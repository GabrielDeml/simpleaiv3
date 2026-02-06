import { create } from 'zustand';
import type {
  Point2D,
  DatasetType,
  NetworkArchitecture,
  NetworkLayer,
  TrainingState,
} from '../ml/types';
import {
  generateCircleData,
  generateSpiralData,
  generateXORData,
  generateGaussianClusters,
  generateMoonsData,
} from '../utils/data-generators';

interface NeuralNetworkState {
  points: Point2D[];
  datasetType: DatasetType;
  numPoints: number;
  architecture: NetworkArchitecture;
  trainingState: TrainingState;
  learningRate: number;
  decisionBoundary: Float32Array | null;
  boundaryResolution: number;
  weights: number[][][] | null;
  currentLabel: number;

  setDataset: (type: DatasetType) => void;
  generateData: () => void;
  setNumPoints: (n: number) => void;
  addPoint: (p: Point2D) => void;
  addLayer: () => void;
  removeLayer: (index: number) => void;
  updateLayer: (index: number, layer: Partial<NetworkLayer>) => void;
  setLearningRate: (lr: number) => void;
  startTraining: () => void;
  stopTraining: () => void;
  updateTrainingState: (state: Partial<TrainingState>) => void;
  updateBoundary: (boundary: Float32Array) => void;
  updateWeights: (weights: number[][][]) => void;
  setCurrentLabel: (label: number) => void;
  reset: () => void;
}

const defaultArchitecture: NetworkArchitecture = {
  inputSize: 2,
  layers: [
    { units: 8, activation: 'relu' },
    { units: 4, activation: 'relu' },
  ],
  outputSize: 1,
  outputActivation: 'sigmoid',
};

function generateDataForType(type: DatasetType, n: number): Point2D[] {
  switch (type) {
    case 'circle':
      return generateCircleData(n);
    case 'spiral':
      return generateSpiralData(n);
    case 'xor':
      return generateXORData(n);
    case 'gaussian':
      return generateGaussianClusters(n, 2);
    case 'moons':
      return generateMoonsData(n);
  }
}

export const useNeuralNetworkStore = create<NeuralNetworkState>((set, get) => ({
  points: generateCircleData(200),
  datasetType: 'circle',
  numPoints: 200,
  architecture: {
    ...defaultArchitecture,
    layers: defaultArchitecture.layers.map((l) => ({ ...l })),
  },
  trainingState: { isTraining: false, epoch: 0, loss: 0, accuracy: 0 },
  learningRate: 0.03,
  decisionBoundary: null,
  boundaryResolution: 50,
  weights: null,
  currentLabel: 0,

  setDataset: (type) => {
    const { numPoints } = get();
    set({
      datasetType: type,
      points: generateDataForType(type, numPoints),
      trainingState: { isTraining: false, epoch: 0, loss: 0, accuracy: 0 },
      decisionBoundary: null,
      weights: null,
    });
  },

  generateData: () => {
    const { datasetType, numPoints } = get();
    set({
      points: generateDataForType(datasetType, numPoints),
      trainingState: { isTraining: false, epoch: 0, loss: 0, accuracy: 0 },
      decisionBoundary: null,
      weights: null,
    });
  },

  setNumPoints: (n) => {
    const { datasetType } = get();
    set({
      numPoints: n,
      points: generateDataForType(datasetType, n),
      trainingState: { isTraining: false, epoch: 0, loss: 0, accuracy: 0 },
      decisionBoundary: null,
      weights: null,
    });
  },

  addPoint: (p) => set((s) => ({ points: [...s.points, p] })),

  addLayer: () =>
    set((s) => ({
      architecture: {
        ...s.architecture,
        layers: [...s.architecture.layers, { units: 4, activation: 'relu' as const }],
      },
    })),

  removeLayer: (index) =>
    set((s) => ({
      architecture: {
        ...s.architecture,
        layers: s.architecture.layers.filter((_, i) => i !== index),
      },
    })),

  updateLayer: (index, partial) =>
    set((s) => {
      const layers = s.architecture.layers.map((l, i) => (i === index ? { ...l, ...partial } : l));
      return { architecture: { ...s.architecture, layers } };
    }),

  setLearningRate: (learningRate) => set({ learningRate }),

  startTraining: () =>
    set((s) => ({
      trainingState: { ...s.trainingState, isTraining: true },
    })),

  stopTraining: () =>
    set((s) => ({
      trainingState: { ...s.trainingState, isTraining: false },
    })),

  updateTrainingState: (state) =>
    set((s) => ({
      trainingState: { ...s.trainingState, ...state },
    })),

  updateBoundary: (boundary) => set({ decisionBoundary: boundary }),

  updateWeights: (weights) => set({ weights }),

  setCurrentLabel: (label) => set({ currentLabel: label }),

  reset: () =>
    set({
      points: generateCircleData(200),
      datasetType: 'circle',
      numPoints: 200,
      architecture: {
        ...defaultArchitecture,
        layers: defaultArchitecture.layers.map((l) => ({ ...l })),
      },
      trainingState: { isTraining: false, epoch: 0, loss: 0, accuracy: 0 },
      learningRate: 0.03,
      decisionBoundary: null,
      weights: null,
      currentLabel: 0,
    }),
}));
