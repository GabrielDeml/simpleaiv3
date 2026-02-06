import * as tf from '@tensorflow/tfjs';
import { getActivationAtNode, getConvLayerInfo, getWeightTensor } from './mobilenet-loader';
import { colorStringToRgb, createViridisScale } from '../utils/color-scales';

export function getActivationMaps(layerName: string, input: tf.Tensor3D): tf.Tensor4D | null {
  try {
    const batched = tf.tidy(() => input.expandDims(0).div(255) as tf.Tensor4D);
    const activation = getActivationAtNode(layerName, batched);
    batched.dispose();
    // Ensure 4D output [batch, height, width, channels]
    if (activation.shape.length === 4) {
      return activation as tf.Tensor4D;
    }
    activation.dispose();
    return null;
  } catch {
    return null;
  }
}

export function getFilterWeights(
  layerName: string,
): { weights: tf.Tensor4D; shape: number[] } | null {
  const layers = getConvLayerInfo();
  const layerInfo = layers.find((l) => l.name === layerName);
  if (!layerInfo) return null;

  const kernelWeights = getWeightTensor(layerInfo.weightName);
  if (!kernelWeights || kernelWeights.shape.length !== 4) return null;

  return {
    weights: kernelWeights as tf.Tensor4D,
    shape: kernelWeights.shape,
  };
}

export async function activationToImageData(
  activation: tf.Tensor4D,
  filterIndex: number,
  width: number,
  height: number,
): Promise<ImageData> {
  const singleMap = tf.tidy(() => {
    const map = activation.slice([0, 0, 0, filterIndex], [1, -1, -1, 1]).squeeze();
    const min = map.min();
    const max = map.max();
    const range = max.sub(min).add(1e-8);
    return map.sub(min).div(range) as tf.Tensor2D;
  });

  const resized = tf.tidy(() => {
    return tf.image
      .resizeBilinear(singleMap.expandDims(-1) as tf.Tensor3D, [height, width])
      .squeeze() as tf.Tensor2D;
  });

  const data = await resized.data();
  singleMap.dispose();
  resized.dispose();

  const imageData = new ImageData(width, height);
  const viridis = createViridisScale([0, 1]);

  for (let i = 0; i < data.length; i++) {
    const color = viridis(data[i]);
    const rgb = colorStringToRgb(color);
    imageData.data[i * 4] = rgb[0];
    imageData.data[i * 4 + 1] = rgb[1];
    imageData.data[i * 4 + 2] = rgb[2];
    imageData.data[i * 4 + 3] = 255;
  }

  return imageData;
}

export async function filterToImageData(
  weights: tf.Tensor4D,
  filterIndex: number,
  width: number,
  height: number,
): Promise<ImageData> {
  const singleFilter = tf.tidy(() => {
    // For depthwise conv: shape is [h, w, channels, 1], use filterIndex as channel
    // For standard conv: shape is [h, w, inChannels, outChannels]
    const shape = weights.shape;
    let filter: tf.Tensor2D;
    if (shape[3] === 1) {
      // Depthwise: extract channel slice
      filter = weights.slice([0, 0, filterIndex, 0], [-1, -1, 1, 1]).squeeze() as tf.Tensor2D;
    } else {
      // Standard conv: take mean across input channels for the given output filter
      filter = weights
        .slice([0, 0, 0, filterIndex], [-1, -1, -1, 1])
        .mean(2)
        .squeeze() as tf.Tensor2D;
    }
    const min = filter.min();
    const max = filter.max();
    const range = max.sub(min).add(1e-8);
    return filter.sub(min).div(range) as tf.Tensor2D;
  });

  const resized = tf.tidy(() => {
    return tf.image
      .resizeBilinear(singleFilter.expandDims(-1) as tf.Tensor3D, [height, width], false)
      .squeeze() as tf.Tensor2D;
  });

  const data = await resized.data();
  singleFilter.dispose();
  resized.dispose();

  const imageData = new ImageData(width, height);
  const viridis = createViridisScale([0, 1]);

  for (let i = 0; i < data.length; i++) {
    const color = viridis(data[i]);
    const rgb = colorStringToRgb(color);
    imageData.data[i * 4] = rgb[0];
    imageData.data[i * 4 + 1] = rgb[1];
    imageData.data[i * 4 + 2] = rgb[2];
    imageData.data[i * 4 + 3] = 255;
  }

  return imageData;
}

export function getLayerInfo(
  layerName: string,
): { name: string; className: string; outputShape: number[] } | null {
  const layers = getConvLayerInfo();
  const layerInfo = layers.find((l) => l.name === layerName);
  if (!layerInfo) return null;

  // Determine className from weight shape
  const shape = layerInfo.shape;
  const isDepthwise = shape[3] === 1;
  const className = isDepthwise ? 'DepthwiseConv2D' : 'Conv2D';

  return {
    name: layerInfo.name,
    className,
    outputShape: shape,
  };
}
