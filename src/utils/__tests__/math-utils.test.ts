import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  distance,
  normalize,
  denormalize,
  softmax,
  argmax,
  meanSquaredError,
} from '../math-utils';

describe('clamp', () => {
  it('returns value when within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value is below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('returns max when value is above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('handles negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });
});

describe('lerp', () => {
  it('returns a when t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns b when t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint when t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('extrapolates below when t < 0', () => {
    expect(lerp(10, 20, -1)).toBe(0);
  });

  it('extrapolates above when t > 1', () => {
    expect(lerp(10, 20, 2)).toBe(30);
  });

  it('works with negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });
});

describe('distance', () => {
  it('computes distance from origin', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  it('computes diagonal distance', () => {
    expect(distance(0, 0, 1, 1)).toBeCloseTo(Math.SQRT2, 10);
  });

  it('returns 0 for same point', () => {
    expect(distance(5, 5, 5, 5)).toBe(0);
  });

  it('is symmetric', () => {
    expect(distance(1, 2, 3, 4)).toBeCloseTo(distance(3, 4, 1, 2), 10);
  });
});

describe('normalize', () => {
  it('normalizes a value within range to [0,1]', () => {
    expect(normalize(5, 0, 10)).toBe(0.5);
    expect(normalize(0, 0, 10)).toBe(0);
    expect(normalize(10, 0, 10)).toBe(1);
  });

  it('returns 0.5 when max === min', () => {
    expect(normalize(5, 5, 5)).toBe(0.5);
  });

  it('handles negative ranges', () => {
    expect(normalize(0, -10, 10)).toBe(0.5);
  });

  it('can return values outside [0,1] for out-of-range inputs', () => {
    expect(normalize(15, 0, 10)).toBe(1.5);
    expect(normalize(-5, 0, 10)).toBe(-0.5);
  });
});

describe('denormalize', () => {
  it('maps [0,1] back to original range', () => {
    expect(denormalize(0, 0, 10)).toBe(0);
    expect(denormalize(0.5, 0, 10)).toBe(5);
    expect(denormalize(1, 0, 10)).toBe(10);
  });

  it('is the inverse of normalize', () => {
    const min = -5;
    const max = 15;
    const value = 7;
    const normalized = normalize(value, min, max);
    expect(denormalize(normalized, min, max)).toBeCloseTo(value, 10);
  });

  it('handles negative ranges', () => {
    expect(denormalize(0.5, -10, 10)).toBe(0);
  });
});

describe('softmax', () => {
  it('sums to 1', () => {
    const result = softmax([1, 2, 3]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('returns equal probabilities for equal values', () => {
    const result = softmax([1, 1, 1]);
    for (const v of result) {
      expect(v).toBeCloseTo(1 / 3, 10);
    }
  });

  it('largest input gets largest probability', () => {
    const result = softmax([1, 2, 3]);
    expect(result[2]).toBeGreaterThan(result[1]);
    expect(result[1]).toBeGreaterThan(result[0]);
  });

  it('handles large values without overflow (numerical stability)', () => {
    const result = softmax([1000, 1001, 1002]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(result[2]).toBeGreaterThan(result[1]);
    expect(result[1]).toBeGreaterThan(result[0]);
  });

  it('handles single element', () => {
    const result = softmax([5]);
    expect(result).toEqual([1]);
  });

  it('handles negative values', () => {
    const result = softmax([-1, -2, -3]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(result[0]).toBeGreaterThan(result[1]);
    expect(result[1]).toBeGreaterThan(result[2]);
  });
});

describe('argmax', () => {
  it('returns the index of the maximum value', () => {
    expect(argmax([1, 3, 2])).toBe(1);
  });

  it('returns first index on ties', () => {
    expect(argmax([5, 5, 5])).toBe(0);
  });

  it('works with negative values', () => {
    expect(argmax([-3, -1, -2])).toBe(1);
  });

  it('works with single element', () => {
    expect(argmax([42])).toBe(0);
  });
});

describe('meanSquaredError', () => {
  it('returns 0 for perfect predictions', () => {
    expect(meanSquaredError([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it('computes MSE correctly', () => {
    // (1-2)^2 + (2-4)^2 = 1 + 4 = 5, divided by 2 = 2.5
    expect(meanSquaredError([1, 2], [2, 4])).toBe(2.5);
  });

  it('works with single element', () => {
    // (3-1)^2 / 1 = 4
    expect(meanSquaredError([3], [1])).toBe(4);
  });

  it('is symmetric in terms of error magnitude', () => {
    expect(meanSquaredError([0], [1])).toBe(meanSquaredError([1], [0]));
  });
});
