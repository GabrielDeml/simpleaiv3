import * as tf from '@tensorflow/tfjs';

export function disposeTensors(...tensors: (tf.Tensor | null | undefined)[]): void {
  for (const t of tensors) {
    if (t && !t.isDisposed) {
      t.dispose();
    }
  }
}

export function tensorToArray(tensor: tf.Tensor): Promise<number[]> {
  return tensor.data().then((d) => Array.from(d as Float32Array));
}

export function createPredictionGrid(
  resolution: number,
  rangeX: [number, number] = [-1, 1],
  rangeY: [number, number] = [-1, 1],
): tf.Tensor2D {
  const grid: number[][] = [];
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const px = rangeX[0] + (x / (resolution - 1)) * (rangeX[1] - rangeX[0]);
      const py = rangeY[0] + (y / (resolution - 1)) * (rangeY[1] - rangeY[0]);
      grid.push([px, py]);
    }
  }
  return tf.tensor2d(grid);
}
