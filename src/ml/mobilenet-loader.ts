import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';

let model: mobilenet.MobileNet | null = null;

export async function loadMobileNet(
  onProgress?: (p: number) => void,
): Promise<mobilenet.MobileNet> {
  if (model) return model;
  onProgress?.(0.1);
  model = await mobilenet.load({ version: 2, alpha: 1.0 });
  onProgress?.(1);
  return model;
}

export async function classifyImage(
  img: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageData,
): Promise<Array<{ className: string; probability: number }>> {
  if (!model) throw new Error('Model not loaded');
  return model.classify(img as Parameters<typeof model.classify>[0]);
}

export function getModel(): mobilenet.MobileNet | null {
  return model;
}

export function getGraphModel(): tf.GraphModel | null {
  if (!model) return null;
  return (model as unknown as { model: tf.GraphModel }).model;
}

export function inferEmbedding(
  img: tf.Tensor | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
): tf.Tensor {
  if (!model) throw new Error('Model not loaded');
  return model.infer(img, true);
}

export function getActivationAtNode(nodeName: string, input: tf.Tensor4D): tf.Tensor {
  const graphModel = getGraphModel();
  if (!graphModel) throw new Error('Model not loaded');
  return graphModel.execute(input, nodeName) as tf.Tensor;
}

export function getConvLayerInfo(): Array<{ name: string; weightName: string; shape: number[] }> {
  const graphModel = getGraphModel();
  if (!graphModel) return [];
  const weightMap = graphModel.weights;
  const layers: Array<{ name: string; weightName: string; shape: number[] }> = [];
  for (const [key, tensors] of Object.entries(weightMap)) {
    // Conv kernel weights are 4D tensors [h, w, inChannels, outChannels]
    if (tensors.length > 0 && tensors[0].shape.length === 4) {
      // Derive the output node name from the weight name
      // Weight names like "MobilenetV2/Conv/weights" -> output node "MobilenetV2/Conv/Relu6"
      // Weight names like "MobilenetV2/expanded_conv_1/depthwise/depthwise_weights" -> depthwise conv output
      const baseName = key.replace(/\/(weights|kernel|depthwise_weights)$/, '');
      layers.push({
        name: baseName,
        weightName: key,
        shape: tensors[0].shape,
      });
    }
  }
  return layers;
}

export function getLayerNames(): string[] {
  return getConvLayerInfo().map((l) => l.name);
}

export function getWeightTensor(weightName: string): tf.Tensor | null {
  const graphModel = getGraphModel();
  if (!graphModel) return null;
  const weightMap = graphModel.weights;
  const tensors = weightMap[weightName];
  if (!tensors || tensors.length === 0) return null;
  return tensors[0];
}
