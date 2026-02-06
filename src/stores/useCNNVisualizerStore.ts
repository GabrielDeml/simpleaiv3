import { create } from 'zustand';
import * as tf from '@tensorflow/tfjs';
import { loadMobileNet, getLayerNames } from '../ml/mobilenet-loader';
import {
  getActivationMaps,
  getFilterWeights,
  activationToImageData,
  filterToImageData,
  getLayerInfo,
} from '../ml/cnn-visualizer';

type ModelStatus = 'idle' | 'loading' | 'ready';

interface CNNVisualizerState {
  modelStatus: ModelStatus;
  selectedLayer: string | null;
  availableLayers: string[];
  filterWeightImages: ImageData[];
  activationMapImages: ImageData[];
  inputImage: string | null;
  isComputing: boolean;
  layerInfo: { name: string; className: string; outputShape: number[] } | null;
  error: string | null;
  loadModel: () => Promise<void>;
  setLayer: (name: string) => void;
  setImage: (dataUrl: string | null) => void;
  computeActivations: (img: ImageData | HTMLImageElement) => Promise<void>;
  computeFilters: () => Promise<void>;
}

const VIZ_SIZE = 48;
const MAX_FILTERS = 64;

export const useCNNVisualizerStore = create<CNNVisualizerState>((set, get) => ({
  modelStatus: 'idle',
  selectedLayer: null,
  availableLayers: [],
  filterWeightImages: [],
  activationMapImages: [],
  inputImage: null,
  isComputing: false,
  layerInfo: null,
  error: null,

  loadModel: async () => {
    if (get().modelStatus === 'ready' || get().modelStatus === 'loading') return;
    set({ modelStatus: 'loading', error: null });
    try {
      await loadMobileNet();
      const layers = getLayerNames();
      set({ modelStatus: 'ready', availableLayers: layers, selectedLayer: layers[0] || null });
    } catch (err) {
      set({ modelStatus: 'idle', error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  setLayer: (name) => {
    set({ selectedLayer: name, filterWeightImages: [], activationMapImages: [] });
    const info = getLayerInfo(name);
    set({ layerInfo: info });
  },

  setImage: (dataUrl) => set({ inputImage: dataUrl, activationMapImages: [] }),

  computeActivations: async (img) => {
    const { selectedLayer } = get();
    if (!selectedLayer) return;
    set({ isComputing: true, error: null });
    try {
      const input =
        img instanceof ImageData ? tf.browser.fromPixels(img) : tf.browser.fromPixels(img);

      const activation = getActivationMaps(selectedLayer, input as tf.Tensor3D);
      input.dispose();

      if (!activation) {
        set({ isComputing: false, error: 'Could not compute activations' });
        return;
      }

      const numFilters = Math.min(activation.shape[3], MAX_FILTERS);
      const images: ImageData[] = [];
      for (let i = 0; i < numFilters; i++) {
        const imgData = await activationToImageData(activation, i, VIZ_SIZE, VIZ_SIZE);
        images.push(imgData);
      }
      activation.dispose();

      const info = getLayerInfo(selectedLayer);
      set({ activationMapImages: images, isComputing: false, layerInfo: info });
    } catch (err) {
      set({ isComputing: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  computeFilters: async () => {
    const { selectedLayer } = get();
    if (!selectedLayer) return;
    set({ isComputing: true, error: null });
    try {
      const result = getFilterWeights(selectedLayer);
      if (!result) {
        set({ isComputing: false, error: 'Could not get filter weights' });
        return;
      }

      const { weights, shape } = result;
      // For depthwise conv, num filters = inChannels; for standard, num filters = outChannels
      const numFilters = Math.min(shape[3] === 1 ? shape[2] : shape[3], MAX_FILTERS);
      const images: ImageData[] = [];
      for (let i = 0; i < numFilters; i++) {
        const imgData = await filterToImageData(weights, i, VIZ_SIZE, VIZ_SIZE);
        images.push(imgData);
      }

      const info = getLayerInfo(selectedLayer);
      set({ filterWeightImages: images, isComputing: false, layerInfo: info });
    } catch (err) {
      set({ isComputing: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },
}));
