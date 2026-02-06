import { create } from 'zustand';
import type * as tf from '@tensorflow/tfjs';
import type { TrainingState } from '../ml/types';
import { loadMobileNet, inferEmbedding } from '../ml/mobilenet-loader';
import {
  createTransferModel,
  trainOnSamples,
  predictWithTransferModel,
} from '../ml/transfer-learning';

type ModelStatus = 'idle' | 'loading' | 'training' | 'ready';

interface TransferLearningState {
  categories: string[];
  samples: Record<string, string[]>;
  sampleImageData: Map<string, ImageData[]>;
  modelStatus: ModelStatus;
  trainingState: TrainingState;
  prediction: {
    category: string;
    confidence: number;
    all: Array<{ category: string; confidence: number }>;
  } | null;
  isCollecting: boolean;
  activeCategory: string | null;
  headModel: tf.LayersModel | null;
  error: string | null;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  addSample: (category: string, dataUrl: string, imageData: ImageData) => void;
  setActiveCategory: (name: string | null) => void;
  setCollecting: (v: boolean) => void;
  startTraining: () => Promise<void>;
  predict: (img: ImageData | HTMLImageElement | HTMLVideoElement) => Promise<void>;
  reset: () => void;
}

export const useTransferLearningStore = create<TransferLearningState>((set, get) => ({
  categories: [],
  samples: {},
  sampleImageData: new Map(),
  modelStatus: 'idle',
  trainingState: { isTraining: false, epoch: 0, loss: 0, accuracy: 0 },
  prediction: null,
  isCollecting: false,
  activeCategory: null,
  headModel: null,
  error: null,

  addCategory: (name) => {
    const trimmed = name.trim();
    if (!trimmed || get().categories.includes(trimmed)) return;
    set((s) => ({
      categories: [...s.categories, trimmed],
      samples: { ...s.samples, [trimmed]: [] },
    }));
    get().sampleImageData.set(trimmed, []);
  },

  removeCategory: (name) => {
    set((s) => {
      const categories = s.categories.filter((c) => c !== name);
      const samples = { ...s.samples };
      delete samples[name];
      return {
        categories,
        samples,
        activeCategory: s.activeCategory === name ? null : s.activeCategory,
      };
    });
    get().sampleImageData.delete(name);
  },

  addSample: (category, dataUrl, imageData) => {
    set((s) => ({
      samples: {
        ...s.samples,
        [category]: [...(s.samples[category] || []), dataUrl],
      },
    }));
    const existing = get().sampleImageData.get(category) || [];
    existing.push(imageData);
    get().sampleImageData.set(category, existing);
  },

  setActiveCategory: (name) => set({ activeCategory: name }),
  setCollecting: (v) => set({ isCollecting: v }),

  startTraining: async () => {
    const { categories, sampleImageData } = get();
    if (categories.length < 2) return;

    set({ modelStatus: 'loading', error: null });
    try {
      await loadMobileNet();
      set({ modelStatus: 'training' });

      // Determine feature size from a test embedding
      const testEmbedding = inferEmbedding(new ImageData(1, 1));
      const featureSize = testEmbedding.shape[testEmbedding.shape.length - 1];
      testEmbedding.dispose();

      const headModel = createTransferModel(categories.length, featureSize);
      set({ headModel });

      await trainOnSamples(headModel, sampleImageData, categories, (p) => {
        set({
          trainingState: {
            isTraining: true,
            epoch: p.epoch,
            loss: p.loss,
            accuracy: p.accuracy,
          },
        });
      });

      set({
        modelStatus: 'ready',
        trainingState: { ...get().trainingState, isTraining: false },
      });
    } catch (err) {
      set({ modelStatus: 'idle', error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  predict: async (img) => {
    const { headModel, categories, modelStatus } = get();
    if (modelStatus !== 'ready' || !headModel) return;
    try {
      const result = await predictWithTransferModel(headModel, img, categories);
      set({ prediction: result });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  reset: () => {
    get().headModel?.dispose();
    set({
      categories: [],
      samples: {},
      modelStatus: 'idle',
      trainingState: { isTraining: false, epoch: 0, loss: 0, accuracy: 0 },
      prediction: null,
      isCollecting: false,
      activeCategory: null,
      headModel: null,
      error: null,
    });
    get().sampleImageData.clear();
  },
}));
