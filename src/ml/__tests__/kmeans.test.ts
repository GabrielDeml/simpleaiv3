import { describe, it, expect } from 'vitest';
import { KMeansAlgorithm } from '../kmeans';
import type { Point2D } from '../types';

describe('KMeansAlgorithm', () => {
  describe('constructor', () => {
    it('sets k', () => {
      const km = new KMeansAlgorithm(3);
      expect(km.k).toBe(3);
    });

    it('initializes with empty centroids', () => {
      const km = new KMeansAlgorithm(5);
      expect(km.centroids).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('creates k centroids from the given points', () => {
      const km = new KMeansAlgorithm(3);
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ];
      km.initialize(points);
      expect(km.centroids).toHaveLength(3);
    });

    it('centroids are drawn from the input points', () => {
      const km = new KMeansAlgorithm(2);
      const points: Point2D[] = [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
      ];
      km.initialize(points);
      for (const c of km.centroids) {
        const match = points.some((p) => p.x === c.x && p.y === c.y);
        expect(match).toBe(true);
      }
    });

    it('handles k greater than number of points', () => {
      const km = new KMeansAlgorithm(10);
      const points: Point2D[] = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];
      km.initialize(points);
      // Can only pick as many unique centroids as there are points
      expect(km.centroids.length).toBeLessThanOrEqual(2);
    });
  });

  describe('assignPoints', () => {
    it('assigns each point to the nearest centroid', () => {
      const km = new KMeansAlgorithm(2);
      const centroids: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      const points: Point2D[] = [
        { x: 1, y: 1 },
        { x: 9, y: 9 },
        { x: 0.5, y: 0.5 },
        { x: 8, y: 8 },
      ];
      const assignments = km.assignPoints(points, centroids);
      expect(assignments).toEqual([0, 1, 0, 1]);
    });

    it('assigns to first centroid when equidistant', () => {
      const km = new KMeansAlgorithm(2);
      const centroids: Point2D[] = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ];
      // Point at (1,0) is equidistant from both
      const points: Point2D[] = [{ x: 1, y: 0 }];
      const assignments = km.assignPoints(points, centroids);
      // Both have distance 1, but since 1 < Infinity from centroid 0 first,
      // the loop checks strictly < so ties go to first
      expect(assignments[0]).toBe(0);
    });

    it('handles single centroid', () => {
      const km = new KMeansAlgorithm(1);
      const centroids: Point2D[] = [{ x: 5, y: 5 }];
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      const assignments = km.assignPoints(points, centroids);
      expect(assignments).toEqual([0, 0]);
    });
  });

  describe('step', () => {
    it('initializes centroids on first step if empty', () => {
      const km = new KMeansAlgorithm(2);
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 10, y: 10 },
        { x: 11, y: 11 },
      ];
      const result = km.step(points);
      expect(result.centroids).toHaveLength(2);
      expect(result.assignments).toHaveLength(4);
    });

    it('updates centroids to the mean of assigned points', () => {
      const km = new KMeansAlgorithm(2);
      // Set centroids manually
      km.centroids = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      const points: Point2D[] = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 9, y: 9 },
        { x: 10, y: 10 },
      ];
      const result = km.step(points);
      // Cluster 0: mean of (1,1) and (2,2) = (1.5, 1.5)
      // Cluster 1: mean of (9,9) and (10,10) = (9.5, 9.5)
      expect(result.centroids[0].x).toBeCloseTo(1.5, 5);
      expect(result.centroids[0].y).toBeCloseTo(1.5, 5);
      expect(result.centroids[1].x).toBeCloseTo(9.5, 5);
      expect(result.centroids[1].y).toBeCloseTo(9.5, 5);
    });

    it('converges on well-separated data', () => {
      const km = new KMeansAlgorithm(2);
      const points: Point2D[] = [];
      // Cluster A around (0, 0)
      for (let i = 0; i < 20; i++) {
        points.push({ x: i * 0.01, y: i * 0.01 });
      }
      // Cluster B around (10, 10)
      for (let i = 0; i < 20; i++) {
        points.push({ x: 10 + i * 0.01, y: 10 + i * 0.01 });
      }

      let converged = false;
      for (let iter = 0; iter < 100; iter++) {
        const result = km.step(points);
        if (result.converged) {
          converged = true;
          break;
        }
      }
      expect(converged).toBe(true);
    });

    it('returns converged=true when centroids do not move', () => {
      const km = new KMeansAlgorithm(2);
      km.centroids = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      // Points already perfectly at centroids
      const points: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      const result = km.step(points);
      expect(result.converged).toBe(true);
    });
  });
});
