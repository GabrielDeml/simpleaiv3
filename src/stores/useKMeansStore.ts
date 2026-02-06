import { create } from 'zustand';
import type { Point2D } from '../ml/types';
import { KMeansAlgorithm } from '../ml/kmeans';

interface KMeansState {
  points: Point2D[];
  centroids: Point2D[];
  assignments: number[];
  k: number;
  stepCount: number;
  converged: boolean;
  isPlaying: boolean;
  addPoint: (p: Point2D) => void;
  setK: (k: number) => void;
  initialize: () => void;
  step: () => void;
  reset: () => void;
  togglePlaying: () => void;
}

let algo = new KMeansAlgorithm(3);

export const useKMeansStore = create<KMeansState>((set, get) => ({
  points: [],
  centroids: [],
  assignments: [],
  k: 3,
  stepCount: 0,
  converged: false,
  isPlaying: false,

  addPoint: (p) => set((s) => ({ points: [...s.points, p] })),

  setK: (k) => {
    algo = new KMeansAlgorithm(k);
    set({ k, centroids: [], assignments: [], stepCount: 0, converged: false, isPlaying: false });
  },

  initialize: () => {
    const { points, k } = get();
    if (points.length < k) return;
    algo = new KMeansAlgorithm(k);
    algo.initialize(points);
    const assignments = algo.assignPoints(points, algo.centroids);
    set({ centroids: [...algo.centroids], assignments, stepCount: 0, converged: false });
  },

  step: () => {
    const { points, converged } = get();
    if (points.length === 0 || converged) return;
    if (algo.centroids.length === 0) {
      get().initialize();
    }
    const result = algo.step(points);
    set((s) => ({
      centroids: result.centroids,
      assignments: result.assignments,
      converged: result.converged,
      stepCount: s.stepCount + 1,
    }));
  },

  reset: () => {
    const { k } = get();
    algo = new KMeansAlgorithm(k);
    set({
      points: [],
      centroids: [],
      assignments: [],
      stepCount: 0,
      converged: false,
      isPlaying: false,
    });
  },

  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
}));
