import { describe, it, expect } from 'vitest';
import { evaluateSurface, computeGradient, gradientStep } from '../gradient-descent';

describe('evaluateSurface', () => {
  describe('bowl', () => {
    it('returns 0 at the origin', () => {
      expect(evaluateSurface(0, 0, 'bowl')).toBe(0);
    });

    it('returns x^2 + y^2', () => {
      expect(evaluateSurface(3, 4, 'bowl')).toBe(25);
    });

    it('is symmetric', () => {
      expect(evaluateSurface(1, 2, 'bowl')).toBe(evaluateSurface(-1, -2, 'bowl'));
    });
  });

  describe('saddle', () => {
    it('returns 0 at the origin', () => {
      expect(evaluateSurface(0, 0, 'saddle')).toBe(0);
    });

    it('returns x^2 - y^2', () => {
      expect(evaluateSurface(3, 4, 'saddle')).toBe(9 - 16);
    });

    it('positive along x-axis, negative along y-axis', () => {
      expect(evaluateSurface(1, 0, 'saddle')).toBeGreaterThan(0);
      expect(evaluateSurface(0, 1, 'saddle')).toBeLessThan(0);
    });
  });

  describe('rosenbrock', () => {
    it('returns 0 at the minimum (1, 1)', () => {
      expect(evaluateSurface(1, 1, 'rosenbrock')).toBe(0);
    });

    it('is positive away from (1, 1)', () => {
      expect(evaluateSurface(0, 0, 'rosenbrock')).toBeGreaterThan(0);
      expect(evaluateSurface(2, 2, 'rosenbrock')).toBeGreaterThan(0);
    });

    it('computes the correct value at origin', () => {
      // (1-0)^2 + 100*(0-0)^2 = 1
      expect(evaluateSurface(0, 0, 'rosenbrock')).toBe(1);
    });
  });

  describe('beale', () => {
    it('returns 0 at the known minimum (3, 0.5)', () => {
      expect(evaluateSurface(3, 0.5, 'beale')).toBeCloseTo(0, 8);
    });

    it('is positive away from the minimum', () => {
      expect(evaluateSurface(0, 0, 'beale')).toBeGreaterThan(0);
      expect(evaluateSurface(1, 1, 'beale')).toBeGreaterThan(0);
    });
  });
});

describe('computeGradient', () => {
  describe('bowl', () => {
    it('returns [0, 0] at origin', () => {
      const [gx, gy] = computeGradient(0, 0, 'bowl');
      expect(gx).toBe(0);
      expect(gy).toBe(0);
    });

    it('returns [2x, 2y]', () => {
      const [gx, gy] = computeGradient(3, 4, 'bowl');
      expect(gx).toBe(6);
      expect(gy).toBe(8);
    });
  });

  describe('saddle', () => {
    it('returns [0, 0] at origin', () => {
      const [gx, gy] = computeGradient(0, 0, 'saddle');
      expect(gx).toBeCloseTo(0, 10);
      expect(gy).toBeCloseTo(0, 10);
    });

    it('returns [2x, -2y]', () => {
      const [gx, gy] = computeGradient(3, 4, 'saddle');
      expect(gx).toBe(6);
      expect(gy).toBe(-8);
    });
  });

  describe('rosenbrock', () => {
    it('returns [0, 0] at minimum (1, 1)', () => {
      const [gx, gy] = computeGradient(1, 1, 'rosenbrock');
      expect(gx).toBeCloseTo(0, 5);
      expect(gy).toBeCloseTo(0, 5);
    });
  });

  describe('directions', () => {
    it('bowl gradient points away from origin', () => {
      const [gx, gy] = computeGradient(1, 1, 'bowl');
      expect(gx).toBeGreaterThan(0);
      expect(gy).toBeGreaterThan(0);
    });

    it('saddle gradient: positive gx for positive x, negative gy for positive y', () => {
      const [gx, gy] = computeGradient(1, 1, 'saddle');
      expect(gx).toBeGreaterThan(0);
      expect(gy).toBeLessThan(0);
    });
  });
});

describe('gradientStep', () => {
  it('moves toward minimum for bowl surface', () => {
    const [x0, y0] = [3, 4];
    const [x1, y1] = gradientStep(x0, y0, 0.1, 'bowl');
    // Should be closer to origin
    expect(Math.abs(x1)).toBeLessThan(Math.abs(x0));
    expect(Math.abs(y1)).toBeLessThan(Math.abs(y0));
  });

  it('does not move at the minimum of bowl', () => {
    const [x1, y1] = gradientStep(0, 0, 0.1, 'bowl');
    expect(x1).toBe(0);
    expect(y1).toBe(0);
  });

  it('step size is proportional to learning rate', () => {
    const [x0, y0] = [2, 2];
    const [x1a, y1a] = gradientStep(x0, y0, 0.1, 'bowl');
    const [x1b, y1b] = gradientStep(x0, y0, 0.2, 'bowl');

    const moveA = Math.sqrt((x1a - x0) ** 2 + (y1a - y0) ** 2);
    const moveB = Math.sqrt((x1b - x0) ** 2 + (y1b - y0) ** 2);
    // moveB should be approximately 2x moveA
    expect(moveB / moveA).toBeCloseTo(2, 5);
  });

  it('converges to bowl minimum over many steps', () => {
    let [x, y] = [5, -3];
    for (let i = 0; i < 100; i++) {
      [x, y] = gradientStep(x, y, 0.1, 'bowl');
    }
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(0, 5);
  });

  it('converges toward rosenbrock minimum (1, 1) with small learning rate', () => {
    let [x, y] = [0, 0];
    for (let i = 0; i < 10000; i++) {
      [x, y] = gradientStep(x, y, 0.001, 'rosenbrock');
    }
    expect(x).toBeCloseTo(1, 0);
    expect(y).toBeCloseTo(1, 0);
  });
});
