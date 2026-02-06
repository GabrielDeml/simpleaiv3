import * as Comlink from 'comlink';
import * as tf from '@tensorflow/tfjs';
import { initTFInWorker } from './shared/tf-init';
import { createNetwork, trainStep, predictGrid, getWeights } from '../ml/neural-network';
import type { NetworkArchitecture } from '../ml/types';

let model: tf.LayersModel | null = null;
let stopRequested = false;

const api = {
  async init() {
    return await initTFInWorker();
  },

  async createModel(architecture: NetworkArchitecture) {
    if (model) {
      model.dispose();
    }
    model = createNetwork(architecture);
  },

  async train(
    xs: number[][],
    ys: number[],
    config: { learningRate: number; epochs: number; batchSize: number },
    onProgress: (data: { epoch: number; loss: number; accuracy: number }) => void,
  ) {
    if (!model) throw new Error('Model not created');
    stopRequested = false;

    for (let epoch = 0; epoch < config.epochs; epoch++) {
      if (stopRequested) break;

      const result = trainStep(model, xs, ys, config.learningRate);
      onProgress({ epoch: epoch + 1, loss: result.loss, accuracy: result.accuracy });

      // Yield to allow stop messages to be processed
      await new Promise((r) => setTimeout(r, 0));
    }
  },

  stop() {
    stopRequested = true;
  },

  async predict(xs: number[][]): Promise<Float32Array> {
    if (!model) throw new Error('Model not created');
    const input = tf.tensor2d(xs);
    const output = model.predict(input) as tf.Tensor;
    const data = output.dataSync() as Float32Array;
    const result = new Float32Array(data);
    input.dispose();
    output.dispose();
    return Comlink.transfer(result, [result.buffer]);
  },

  async predictGrid(
    resolution: number,
    rangeX: [number, number],
    rangeY: [number, number],
  ): Promise<Float32Array> {
    if (!model) throw new Error('Model not created');
    const result = predictGrid(model, resolution, rangeX, rangeY);
    return Comlink.transfer(result, [result.buffer]);
  },

  async getWeights(): Promise<number[][][]> {
    if (!model) throw new Error('Model not created');
    return getWeights(model);
  },

  dispose() {
    if (model) {
      model.dispose();
      model = null;
    }
  },
};

export type NeuralNetworkWorkerAPI = typeof api;

Comlink.expose(api);
