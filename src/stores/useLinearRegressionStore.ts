import { create } from 'zustand';
import type { Point2D } from '../ml/types';
import { LinearRegressionModel } from '../ml/linear-regression';

interface LinearRegressionState {
  points: Point2D[];
  weight: number;
  bias: number;
  learningRate: number;
  loss: number;
  epoch: number;
  isTraining: boolean;
  addPoint: (p: Point2D) => void;
  removePoint: (index: number) => void;
  updatePoint: (index: number, p: Point2D) => void;
  setLearningRate: (lr: number) => void;
  trainStep: () => void;
  reset: () => void;
  toggleTraining: () => void;
}

const model = new LinearRegressionModel();

export const useLinearRegressionStore = create<LinearRegressionState>((set, get) => ({
  points: [],
  weight: 0,
  bias: 0,
  learningRate: 0.1,
  loss: 0,
  epoch: 0,
  isTraining: false,

  addPoint: (p) => set((s) => ({ points: [...s.points, p] })),

  removePoint: (index) => set((s) => ({ points: s.points.filter((_, i) => i !== index) })),

  updatePoint: (index, p) =>
    set((s) => {
      const points = [...s.points];
      points[index] = p;
      return { points };
    }),

  setLearningRate: (learningRate) => set({ learningRate }),

  trainStep: () => {
    const { points, learningRate, epoch } = get();
    if (points.length === 0) return;
    model.weight = get().weight;
    model.bias = get().bias;
    const loss = model.trainStep(points, learningRate);
    set({ weight: model.weight, bias: model.bias, loss, epoch: epoch + 1 });
  },

  reset: () => {
    model.weight = 0;
    model.bias = 0;
    set({ points: [], weight: 0, bias: 0, loss: 0, epoch: 0, isTraining: false });
  },

  toggleTraining: () => set((s) => ({ isTraining: !s.isTraining })),
}));
