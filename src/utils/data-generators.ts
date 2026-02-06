import type { Point2D } from '../ml/types';
import { randomGaussian, randomRange } from './math-utils';

export function generateCircleData(n = 200, noise = 0.1): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const label = i < n / 2 ? 0 : 1;
    const r = label === 0 ? randomRange(0, 0.4) : randomRange(0.6, 1);
    const angle = randomRange(0, 2 * Math.PI);
    points.push({
      x: r * Math.cos(angle) + randomGaussian(0, noise),
      y: r * Math.sin(angle) + randomGaussian(0, noise),
      label,
    });
  }
  return points;
}

export function generateSpiralData(n = 200, noise = 0.05): Point2D[] {
  const points: Point2D[] = [];
  const half = Math.floor(n / 2);
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < half; i++) {
      const r = (i / half) * 0.8;
      const t = (i / half) * 2 * Math.PI + c * Math.PI;
      points.push({
        x: r * Math.cos(t) + randomGaussian(0, noise),
        y: r * Math.sin(t) + randomGaussian(0, noise),
        label: c,
      });
    }
  }
  return points;
}

export function generateXORData(n = 200, noise = 0.1): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const x = randomRange(-1, 1);
    const y = randomRange(-1, 1);
    const label = x > 0 !== y > 0 ? 1 : 0;
    points.push({
      x: x + randomGaussian(0, noise),
      y: y + randomGaussian(0, noise),
      label,
    });
  }
  return points;
}

export function generateGaussianClusters(n = 200, k = 3, spread = 0.15): Point2D[] {
  const points: Point2D[] = [];
  const centersAngle = (2 * Math.PI) / k;
  const perCluster = Math.floor(n / k);
  for (let c = 0; c < k; c++) {
    const cx = 0.5 * Math.cos(c * centersAngle);
    const cy = 0.5 * Math.sin(c * centersAngle);
    for (let i = 0; i < perCluster; i++) {
      points.push({
        x: cx + randomGaussian(0, spread),
        y: cy + randomGaussian(0, spread),
        label: c,
      });
    }
  }
  return points;
}

export function generateMoonsData(n = 200, noise = 0.1): Point2D[] {
  const points: Point2D[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const angle = (i / half) * Math.PI;
    points.push({
      x: Math.cos(angle) + randomGaussian(0, noise),
      y: Math.sin(angle) + randomGaussian(0, noise),
      label: 0,
    });
  }
  for (let i = 0; i < half; i++) {
    const angle = (i / half) * Math.PI;
    points.push({
      x: 1 - Math.cos(angle) + randomGaussian(0, noise),
      y: 0.5 - Math.sin(angle) + randomGaussian(0, noise),
      label: 1,
    });
  }
  return points;
}

export function generateLinearData(n = 50, slope = 0.7, intercept = 0.1, noise = 0.15): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const x = randomRange(-1, 1);
    const y = slope * x + intercept + randomGaussian(0, noise);
    points.push({ x, y });
  }
  return points;
}

export type { Point2D };
