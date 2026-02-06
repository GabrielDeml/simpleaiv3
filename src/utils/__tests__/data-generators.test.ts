import { describe, it, expect } from 'vitest';
import {
  generateCircleData,
  generateSpiralData,
  generateXORData,
  generateGaussianClusters,
  generateMoonsData,
  generateLinearData,
} from '../data-generators';

describe('generateCircleData', () => {
  it('returns the default count of points', () => {
    const points = generateCircleData();
    expect(points).toHaveLength(200);
  });

  it('returns the requested count of points', () => {
    const points = generateCircleData(50);
    expect(points).toHaveLength(50);
  });

  it('contains both label 0 and label 1', () => {
    const points = generateCircleData(100);
    const labels = new Set(points.map((p) => p.label));
    expect(labels.has(0)).toBe(true);
    expect(labels.has(1)).toBe(true);
  });

  it('each point has x, y, and label properties', () => {
    const points = generateCircleData(10);
    for (const p of points) {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
      expect(typeof p.label).toBe('number');
    }
  });
});

describe('generateSpiralData', () => {
  it('returns the default count of points', () => {
    const points = generateSpiralData();
    // half per class, 2 classes; Math.floor(200/2) * 2 = 200
    expect(points).toHaveLength(200);
  });

  it('returns the requested count of points', () => {
    const points = generateSpiralData(100);
    expect(points).toHaveLength(100);
  });

  it('returns correct count for odd n (rounding down per class)', () => {
    const points = generateSpiralData(51);
    // Math.floor(51/2) * 2 = 50
    expect(points).toHaveLength(50);
  });

  it('contains both label 0 and label 1', () => {
    const points = generateSpiralData(100);
    const labels = new Set(points.map((p) => p.label));
    expect(labels.has(0)).toBe(true);
    expect(labels.has(1)).toBe(true);
  });
});

describe('generateXORData', () => {
  it('returns the default count of points', () => {
    const points = generateXORData();
    expect(points).toHaveLength(200);
  });

  it('returns the requested count of points', () => {
    const points = generateXORData(80);
    expect(points).toHaveLength(80);
  });

  it('contains both label 0 and label 1', () => {
    const points = generateXORData(200);
    const labels = new Set(points.map((p) => p.label));
    expect(labels.has(0)).toBe(true);
    expect(labels.has(1)).toBe(true);
  });
});

describe('generateGaussianClusters', () => {
  it('returns approximately the default count of points', () => {
    const points = generateGaussianClusters();
    // Math.floor(200/3) * 3 = 198
    expect(points.length).toBeGreaterThanOrEqual(198);
    expect(points.length).toBeLessThanOrEqual(200);
  });

  it('returns the requested count with custom k', () => {
    const points = generateGaussianClusters(100, 4);
    // Math.floor(100/4) * 4 = 100
    expect(points).toHaveLength(100);
  });

  it('contains all expected cluster labels', () => {
    const k = 4;
    const points = generateGaussianClusters(200, k);
    const labels = new Set(points.map((p) => p.label));
    for (let i = 0; i < k; i++) {
      expect(labels.has(i)).toBe(true);
    }
  });

  it('each cluster has equal number of points (floor division)', () => {
    const k = 3;
    const n = 90;
    const points = generateGaussianClusters(n, k);
    const counts = new Map<number, number>();
    for (const p of points) {
      counts.set(p.label!, (counts.get(p.label!) ?? 0) + 1);
    }
    for (let i = 0; i < k; i++) {
      expect(counts.get(i)).toBe(Math.floor(n / k));
    }
  });
});

describe('generateMoonsData', () => {
  it('returns the default count of points', () => {
    const points = generateMoonsData();
    expect(points).toHaveLength(200);
  });

  it('returns the requested count of points', () => {
    const points = generateMoonsData(60);
    expect(points).toHaveLength(60);
  });

  it('returns correct count for odd n', () => {
    const points = generateMoonsData(51);
    // Math.floor(51/2) * 2 = 50
    expect(points).toHaveLength(50);
  });

  it('contains both label 0 and label 1', () => {
    const points = generateMoonsData(100);
    const labels = new Set(points.map((p) => p.label));
    expect(labels.has(0)).toBe(true);
    expect(labels.has(1)).toBe(true);
  });
});

describe('generateLinearData', () => {
  it('returns the default count of points', () => {
    const points = generateLinearData();
    expect(points).toHaveLength(50);
  });

  it('returns the requested count of points', () => {
    const points = generateLinearData(30);
    expect(points).toHaveLength(30);
  });

  it('points have x and y but no label', () => {
    const points = generateLinearData(10);
    for (const p of points) {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
      expect(p.label).toBeUndefined();
    }
  });

  it('y values are roughly correlated with x for default slope', () => {
    // Generate a large dataset with zero noise to verify slope/intercept
    const points = generateLinearData(100, 2, 0, 0);
    for (const p of points) {
      expect(p.y).toBeCloseTo(2 * p.x, 5);
    }
  });
});
