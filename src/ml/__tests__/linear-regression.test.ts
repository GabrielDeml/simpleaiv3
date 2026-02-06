import { describe, it, expect } from 'vitest';
import { LinearRegressionModel } from '../linear-regression';

describe('LinearRegressionModel', () => {
  describe('constructor', () => {
    it('defaults to weight=0 and bias=0', () => {
      const model = new LinearRegressionModel();
      expect(model.weight).toBe(0);
      expect(model.bias).toBe(0);
    });

    it('accepts custom initial weight and bias', () => {
      const model = new LinearRegressionModel(2, 3);
      expect(model.weight).toBe(2);
      expect(model.bias).toBe(3);
    });
  });

  describe('predict', () => {
    it('computes y = weight * x + bias', () => {
      const model = new LinearRegressionModel(2, 1);
      expect(model.predict(3)).toBe(7);
    });

    it('returns bias when weight is 0', () => {
      const model = new LinearRegressionModel(0, 5);
      expect(model.predict(100)).toBe(5);
    });

    it('returns 0 for default model at x=0', () => {
      const model = new LinearRegressionModel();
      expect(model.predict(0)).toBe(0);
    });

    it('handles negative inputs', () => {
      const model = new LinearRegressionModel(3, -1);
      expect(model.predict(-2)).toBe(-7);
    });
  });

  describe('computeLoss', () => {
    it('returns 0 for empty points array', () => {
      const model = new LinearRegressionModel();
      expect(model.computeLoss([])).toBe(0);
    });

    it('returns 0 when predictions are perfect', () => {
      const model = new LinearRegressionModel(2, 1);
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
      ];
      expect(model.computeLoss(points)).toBeCloseTo(0, 10);
    });

    it('computes MSE correctly', () => {
      const model = new LinearRegressionModel(0, 0);
      // predict(1) = 0, actual = 2 => err = -2, err^2 = 4
      // predict(2) = 0, actual = 4 => err = -4, err^2 = 16
      // MSE = (4 + 16) / 2 = 10
      const points = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
      ];
      expect(model.computeLoss(points)).toBe(10);
    });

    it('computes loss for single point', () => {
      const model = new LinearRegressionModel(1, 0);
      // predict(2) = 2, actual = 5 => err = -3, err^2 = 9
      // MSE = 9 / 1 = 9
      const points = [{ x: 2, y: 5 }];
      expect(model.computeLoss(points)).toBe(9);
    });
  });

  describe('trainStep', () => {
    it('returns 0 for empty points array', () => {
      const model = new LinearRegressionModel();
      const loss = model.trainStep([], 0.01);
      expect(loss).toBe(0);
    });

    it('does not modify model with empty points', () => {
      const model = new LinearRegressionModel(1, 2);
      model.trainStep([], 0.01);
      expect(model.weight).toBe(1);
      expect(model.bias).toBe(2);
    });

    it('decreases loss over multiple steps', () => {
      const model = new LinearRegressionModel(0, 0);
      const points = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
      ];
      const initialLoss = model.computeLoss(points);
      let lastLoss = initialLoss;
      for (let i = 0; i < 50; i++) {
        lastLoss = model.trainStep(points, 0.01);
      }
      expect(lastLoss).toBeLessThan(initialLoss);
    });

    it('converges on simple linear data (y = 2x + 1)', () => {
      const model = new LinearRegressionModel(0, 0);
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
        { x: -1, y: -1 },
      ];
      for (let i = 0; i < 1000; i++) {
        model.trainStep(points, 0.01);
      }
      expect(model.weight).toBeCloseTo(2, 1);
      expect(model.bias).toBeCloseTo(1, 1);
    });

    it('returns the loss after the step', () => {
      const model = new LinearRegressionModel(0, 0);
      const points = [{ x: 1, y: 1 }];
      const loss = model.trainStep(points, 0.1);
      // After the step, model params have changed, and loss is recomputed
      expect(loss).toBe(model.computeLoss(points));
    });
  });
});
