import * as tf from '@tensorflow/tfjs';
import { loadMobileNet, inferEmbedding } from './mobilenet-loader';

export function preprocessImage(img: ImageData | HTMLImageElement | HTMLVideoElement): tf.Tensor3D {
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(img);
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    return resized.div(255) as tf.Tensor3D;
  });
}

export function extractFeatures(img: ImageData | HTMLImageElement | HTMLVideoElement): tf.Tensor2D {
  // MobileNet's infer(img, true) handles preprocessing internally
  // (normalization, resizing) and returns the embedding
  const embedding = inferEmbedding(img);
  // Ensure 2D shape [1, featureSize] for batching compatibility
  if (embedding.shape.length === 1) {
    const batched = embedding.expandDims(0) as tf.Tensor2D;
    embedding.dispose();
    return batched;
  }
  if (embedding.shape.length > 2) {
    const reshaped = embedding.reshape([
      1,
      embedding.shape[embedding.shape.length - 1],
    ]) as tf.Tensor2D;
    embedding.dispose();
    return reshaped;
  }
  return embedding as tf.Tensor2D;
}

export function createTransferModel(numClasses: number, featureSize: number): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [featureSize], units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

export interface TrainProgress {
  epoch: number;
  loss: number;
  accuracy: number;
}

export async function trainOnSamples(
  headModel: tf.LayersModel,
  samples: Map<string, ImageData[]>,
  categories: string[],
  onProgress?: (p: TrainProgress) => void,
): Promise<void> {
  await loadMobileNet();
  const numClasses = categories.length;

  // Extract features for all samples
  const allFeatures: tf.Tensor[] = [];
  const allLabels: number[] = [];

  for (const [category, images] of samples.entries()) {
    const catIndex = categories.indexOf(category);
    if (catIndex < 0) continue;
    for (const imgData of images) {
      const features = extractFeatures(imgData);
      allFeatures.push(features);
      allLabels.push(catIndex);
    }
  }

  if (allFeatures.length === 0) {
    return;
  }

  const xs = tf.concat(allFeatures);
  const labelTensor = tf.tensor1d(allLabels, 'int32');
  const ys = tf.oneHot(labelTensor, numClasses);
  labelTensor.dispose();

  allFeatures.forEach((f) => f.dispose());

  await headModel.fit(xs, ys, {
    epochs: 20,
    batchSize: Math.min(16, allLabels.length),
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onProgress?.({
          epoch: epoch + 1,
          loss: logs?.loss ?? 0,
          accuracy: logs?.accuracy ?? 0,
        });
      },
    },
  });

  xs.dispose();
  ys.dispose();
}

export async function predictWithTransferModel(
  headModel: tf.LayersModel,
  img: ImageData | HTMLImageElement | HTMLVideoElement,
  categories: string[],
): Promise<{
  category: string;
  confidence: number;
  all: Array<{ category: string; confidence: number }>;
}> {
  const features = extractFeatures(img);
  const prediction = headModel.predict(features) as tf.Tensor;
  const probabilities = await prediction.data();

  features.dispose();
  prediction.dispose();

  const all = categories.map((category, i) => ({
    category,
    confidence: probabilities[i],
  }));
  all.sort((a, b) => b.confidence - a.confidence);

  return {
    category: all[0].category,
    confidence: all[0].confidence,
    all,
  };
}
