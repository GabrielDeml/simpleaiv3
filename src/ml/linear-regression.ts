import type { Point2D } from './types';

export class LinearRegressionModel {
  weight: number;
  bias: number;

  constructor(weight = 0, bias = 0) {
    this.weight = weight;
    this.bias = bias;
  }

  predict(x: number): number {
    return this.weight * x + this.bias;
  }

  computeLoss(points: Point2D[]): number {
    if (points.length === 0) return 0;
    let sum = 0;
    for (const p of points) {
      const err = this.predict(p.x) - p.y;
      sum += err * err;
    }
    return sum / points.length;
  }

  trainStep(points: Point2D[], learningRate: number): number {
    if (points.length === 0) return 0;
    const n = points.length;
    let dw = 0;
    let db = 0;
    for (const p of points) {
      const err = this.predict(p.x) - p.y;
      dw += (2 / n) * err * p.x;
      db += (2 / n) * err;
    }
    this.weight -= learningRate * dw;
    this.bias -= learningRate * db;
    return this.computeLoss(points);
  }
}
