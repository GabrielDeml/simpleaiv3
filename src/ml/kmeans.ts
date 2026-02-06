import type { Point2D } from './types';

export class KMeansAlgorithm {
  k: number;
  centroids: Point2D[];

  constructor(k: number) {
    this.k = k;
    this.centroids = [];
  }

  initialize(points: Point2D[]): void {
    const indices = new Set<number>();
    while (indices.size < this.k && indices.size < points.length) {
      indices.add(Math.floor(Math.random() * points.length));
    }
    this.centroids = Array.from(indices).map((i) => ({ x: points[i].x, y: points[i].y }));
  }

  assignPoints(points: Point2D[], centroids: Point2D[]): number[] {
    return points.map((p) => {
      let minDist = Infinity;
      let best = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dx = p.x - centroids[c].x;
        const dy = p.y - centroids[c].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          best = c;
        }
      }
      return best;
    });
  }

  step(points: Point2D[]): { assignments: number[]; centroids: Point2D[]; converged: boolean } {
    if (this.centroids.length === 0) {
      this.initialize(points);
    }

    const assignments = this.assignPoints(points, this.centroids);

    const newCentroids: Point2D[] = Array.from({ length: this.k }, () => ({ x: 0, y: 0 }));
    const counts = new Array<number>(this.k).fill(0);

    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      newCentroids[c].x += points[i].x;
      newCentroids[c].y += points[i].y;
      counts[c]++;
    }

    let converged = true;
    for (let c = 0; c < this.k; c++) {
      if (counts[c] > 0) {
        newCentroids[c].x /= counts[c];
        newCentroids[c].y /= counts[c];
      } else {
        newCentroids[c] = { ...this.centroids[c] };
      }
      const dx = newCentroids[c].x - this.centroids[c].x;
      const dy = newCentroids[c].y - this.centroids[c].y;
      if (dx * dx + dy * dy > 1e-8) {
        converged = false;
      }
    }

    this.centroids = newCentroids;
    return { assignments, centroids: newCentroids, converged };
  }
}
