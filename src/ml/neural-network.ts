import * as tf from '@tensorflow/tfjs';
import type { NetworkArchitecture } from './types';
import { createPredictionGrid } from '../utils/tensor-utils';

export function createNetwork(architecture: NetworkArchitecture): tf.LayersModel {
  const model = tf.sequential();

  // First hidden layer needs inputShape
  const firstLayer = architecture.layers[0];
  if (firstLayer) {
    model.add(
      tf.layers.dense({
        units: firstLayer.units,
        activation: firstLayer.activation,
        inputShape: [architecture.inputSize],
      }),
    );
  }

  // Remaining hidden layers
  for (let i = 1; i < architecture.layers.length; i++) {
    const layer = architecture.layers[i];
    model.add(
      tf.layers.dense({
        units: layer.units,
        activation: layer.activation,
      }),
    );
  }

  // Output layer (needs inputShape if no hidden layers)
  model.add(
    tf.layers.dense({
      units: architecture.outputSize,
      activation: architecture.outputActivation,
      ...(architecture.layers.length === 0 ? { inputShape: [architecture.inputSize] } : {}),
    }),
  );

  return model;
}

export function trainStep(
  model: tf.LayersModel,
  xs: number[][],
  ys: number[],
  learningRate: number,
): { loss: number; accuracy: number } {
  const optimizer = tf.train.sgd(learningRate);

  const xTensor = tf.tensor2d(xs);
  const yTensor = tf.tensor2d(ys, [ys.length, 1]);

  let lossVal = 0;
  let accVal = 0;

  // Compute accuracy outside minimize to avoid leaking intermediate tensors
  // inside the gradient tape
  optimizer.minimize(() => {
    const pred = model.predict(xTensor) as tf.Tensor;
    const loss = tf.losses.sigmoidCrossEntropy(yTensor, pred);
    lossVal = loss.dataSync()[0];
    return loss as tf.Scalar;
  });

  // Compute accuracy separately with tf.tidy to avoid tensor leaks
  accVal = tf.tidy(() => {
    const pred = model.predict(xTensor) as tf.Tensor;
    const rounded = pred.round();
    const correct = rounded.equal(yTensor).sum();
    return correct.dataSync()[0] / ys.length;
  });

  xTensor.dispose();
  yTensor.dispose();
  optimizer.dispose();

  return { loss: lossVal, accuracy: accVal };
}

export function predictGrid(
  model: tf.LayersModel,
  resolution: number,
  rangeX: [number, number] = [-1.5, 1.5],
  rangeY: [number, number] = [-1.5, 1.5],
): Float32Array {
  // Use manual dispose instead of tidy since we need dataSync before disposal
  const grid = createPredictionGrid(resolution, rangeX, rangeY);
  let predictions: tf.Tensor | null = null;
  try {
    predictions = model.predict(grid) as tf.Tensor;
    const data = predictions.dataSync() as Float32Array;
    return new Float32Array(data);
  } finally {
    grid.dispose();
    predictions?.dispose();
  }
}

export function getWeights(model: tf.LayersModel): number[][][] {
  const weights: number[][][] = [];
  for (const layer of model.layers) {
    const layerWeights: number[][] = [];
    for (const w of layer.getWeights()) {
      layerWeights.push(Array.from(w.dataSync()));
    }
    weights.push(layerWeights);
  }
  return weights;
}
