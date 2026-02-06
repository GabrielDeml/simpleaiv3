import { create } from 'zustand';
import type { Prediction } from '../ml/types';
import { loadMobileNet, classifyImage } from '../ml/mobilenet-loader';

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ImageClassifierState {
  modelStatus: ModelStatus;
  loadProgress: number;
  predictions: Prediction[];
  inputImage: string | null;
  isClassifying: boolean;
  error: string | null;
  loadModel: () => Promise<void>;
  classify: (
    img: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageData,
  ) => Promise<void>;
  setImage: (dataUrl: string | null) => void;
  reset: () => void;
}

export const useImageClassifierStore = create<ImageClassifierState>((set, get) => ({
  modelStatus: 'idle',
  loadProgress: 0,
  predictions: [],
  inputImage: null,
  isClassifying: false,
  error: null,

  loadModel: async () => {
    if (get().modelStatus === 'ready' || get().modelStatus === 'loading') return;
    set({ modelStatus: 'loading', loadProgress: 0, error: null });
    try {
      await loadMobileNet((p) => set({ loadProgress: p }));
      set({ modelStatus: 'ready', loadProgress: 1 });
    } catch (err) {
      set({ modelStatus: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  classify: async (img) => {
    if (get().modelStatus !== 'ready') return;
    set({ isClassifying: true });
    try {
      const results = await classifyImage(img);
      set({
        predictions: results.map((r) => ({ className: r.className, probability: r.probability })),
        isClassifying: false,
      });
    } catch (err) {
      set({ isClassifying: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  setImage: (dataUrl) => set({ inputImage: dataUrl, predictions: [] }),

  reset: () =>
    set({
      predictions: [],
      inputImage: null,
      isClassifying: false,
      error: null,
    }),
}));
