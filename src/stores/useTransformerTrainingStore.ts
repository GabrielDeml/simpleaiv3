import { create } from 'zustand';

const MAX_HISTORY = 500;

interface TransformerTrainingState {
  isTraining: boolean;
  step: number;
  loss: number;
  accuracy: number;
  lossHistory: number[];
  accuracyHistory: number[];
  attentionWeights: number[] | null;
  lastInput: number[] | null;
  lastPrediction: number[] | null;
  lastTarget: number[] | null;
  learningRate: number;
  batchSize: number;

  startTraining: () => void;
  stopTraining: () => void;
  updateProgress: (data: {
    step: number;
    loss: number;
    accuracy: number;
    attentionWeights?: number[];
    lastInput?: number[];
    lastPrediction?: number[];
    lastTarget?: number[];
  }) => void;
  setLearningRate: (lr: number) => void;
  setBatchSize: (bs: number) => void;
  reset: () => void;
}

export const useTransformerTrainingStore = create<TransformerTrainingState>((set) => ({
  isTraining: false,
  step: 0,
  loss: 0,
  accuracy: 0,
  lossHistory: [],
  accuracyHistory: [],
  attentionWeights: null,
  lastInput: null,
  lastPrediction: null,
  lastTarget: null,
  learningRate: 0.001,
  batchSize: 32,

  startTraining: () => set({ isTraining: true }),
  stopTraining: () => set({ isTraining: false }),

  updateProgress: (data) =>
    set((s) => {
      const lossHistory = [...s.lossHistory, data.loss];
      const accuracyHistory = [...s.accuracyHistory, data.accuracy];
      if (lossHistory.length > MAX_HISTORY) lossHistory.shift();
      if (accuracyHistory.length > MAX_HISTORY) accuracyHistory.shift();
      return {
        step: data.step,
        loss: data.loss,
        accuracy: data.accuracy,
        lossHistory,
        accuracyHistory,
        attentionWeights: data.attentionWeights ?? s.attentionWeights,
        lastInput: data.lastInput ?? s.lastInput,
        lastPrediction: data.lastPrediction ?? s.lastPrediction,
        lastTarget: data.lastTarget ?? s.lastTarget,
      };
    }),

  setLearningRate: (learningRate) => set({ learningRate }),
  setBatchSize: (batchSize) => set({ batchSize }),

  reset: () =>
    set({
      isTraining: false,
      step: 0,
      loss: 0,
      accuracy: 0,
      lossHistory: [],
      accuracyHistory: [],
      attentionWeights: null,
      lastInput: null,
      lastPrediction: null,
      lastTarget: null,
      learningRate: 0.001,
      batchSize: 32,
    }),
}));
