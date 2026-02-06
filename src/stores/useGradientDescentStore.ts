import { create } from 'zustand';
import { gradientStep, type SurfaceType } from '../ml/gradient-descent';

interface GradientDescentState {
  position: [number, number];
  path: [number, number][];
  learningRate: number;
  surfaceType: SurfaceType;
  isPlaying: boolean;
  stepCount: number;
  viewMode: '3d' | 'contour';
  setPosition: (pos: [number, number]) => void;
  step: () => void;
  reset: () => void;
  setLearningRate: (lr: number) => void;
  setSurfaceType: (t: SurfaceType) => void;
  togglePlaying: () => void;
  setViewMode: (mode: '3d' | 'contour') => void;
}

export const useGradientDescentStore = create<GradientDescentState>((set, get) => ({
  position: [1.5, 1.5],
  path: [[1.5, 1.5]],
  learningRate: 0.05,
  surfaceType: 'bowl',
  isPlaying: false,
  stepCount: 0,
  viewMode: '3d',

  setPosition: (pos) => set({ position: pos, path: [pos], stepCount: 0 }),

  step: () => {
    const { position, learningRate, surfaceType } = get();
    const [nx, ny] = gradientStep(position[0], position[1], learningRate, surfaceType);
    const clampedX = Math.max(-3, Math.min(3, nx));
    const clampedY = Math.max(-3, Math.min(3, ny));
    const newPos: [number, number] = [clampedX, clampedY];
    set((s) => ({
      position: newPos,
      path: [...s.path, newPos],
      stepCount: s.stepCount + 1,
    }));
  },

  reset: () => {
    const start: [number, number] = [1.5, 1.5];
    set({ position: start, path: [start], stepCount: 0, isPlaying: false });
  },

  setLearningRate: (learningRate) => set({ learningRate }),
  setSurfaceType: (surfaceType) =>
    set({ surfaceType, position: [1.5, 1.5], path: [[1.5, 1.5]], stepCount: 0, isPlaying: false }),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setViewMode: (viewMode) => set({ viewMode }),
}));
