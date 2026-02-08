import * as Comlink from 'comlink';
import * as tf from '@tensorflow/tfjs';
import { initTFInWorker } from './shared/tf-init';
import {
  createWeights,
  disposeWeights,
  trainStep,
  predict as modelPredict,
  generateSortBatch,
  type TransformerConfig,
  type TransformerWeights,
  DEFAULT_CONFIG,
} from '../ml/transformer';

let weights: TransformerWeights | null = null;
let config: TransformerConfig = DEFAULT_CONFIG;
let optimizer: tf.Optimizer | null = null;
let stopRequested = false;

interface ProgressData {
  step: number;
  loss: number;
  accuracy: number;
  attentionWeights?: number[];
  lastInput?: number[];
  lastPrediction?: number[];
  lastTarget?: number[];
}

const api = {
  async init() {
    return await initTFInWorker();
  },

  async createModel(cfg?: Partial<TransformerConfig>) {
    if (weights) {
      disposeWeights(weights);
    }
    if (optimizer) {
      optimizer.dispose();
      optimizer = null;
    }
    config = { ...DEFAULT_CONFIG, ...cfg };
    weights = createWeights(config);
  },

  async train(
    trainConfig: { learningRate: number; batchSize: number; steps: number },
    onProgress: (data: ProgressData) => void,
    startStep: number,
  ) {
    if (!weights) throw new Error('Model not created');
    stopRequested = false;

    // Create or recreate optimizer if learning rate changed
    if (!optimizer) {
      optimizer = tf.train.adam(trainConfig.learningRate);
    }

    for (let i = 0; i < trainConfig.steps; i++) {
      if (stopRequested) break;

      const step = startStep + i + 1;
      const { inputs, targets } = generateSortBatch(
        trainConfig.batchSize,
        config.seqLen,
        config.vocabSize,
      );

      const inputTensor = tf.tensor2d(inputs, [trainConfig.batchSize, config.seqLen], 'int32');
      const targetTensor = tf.tensor2d(targets, [trainConfig.batchSize, config.seqLen], 'int32');

      const result = trainStep(weights, config, optimizer, inputTensor, targetTensor);

      inputTensor.dispose();
      targetTensor.dispose();

      // Send progress with attention weights every 5 steps, and sample data every 5 steps
      const sendAttn = step % 5 === 0 || i === trainConfig.steps - 1;
      const progress: ProgressData = {
        step,
        loss: result.loss,
        accuracy: result.accuracy,
      };

      if (sendAttn) {
        progress.attentionWeights = result.attentionWeights;
        // Also send a sample prediction
        const sample = generateSortBatch(1, config.seqLen, config.vocabSize);
        const pred = modelPredict(sample.inputs[0], weights, config);
        progress.lastInput = sample.inputs[0];
        progress.lastPrediction = pred.prediction;
        progress.lastTarget = sample.targets[0];
      }

      onProgress(progress);

      // Yield to allow stop messages to be processed
      await new Promise((r) => setTimeout(r, 0));
    }
  },

  stop() {
    stopRequested = true;
  },

  async predict(seq: number[]): Promise<{ prediction: number[]; attentionWeights: number[] }> {
    if (!weights) throw new Error('Model not created');
    return modelPredict(seq, weights, config);
  },

  dispose() {
    if (weights) {
      disposeWeights(weights);
      weights = null;
    }
    if (optimizer) {
      optimizer.dispose();
      optimizer = null;
    }
  },

  getConfig() {
    return config;
  },
};

export type TransformerWorkerAPI = typeof api;

Comlink.expose(api);
