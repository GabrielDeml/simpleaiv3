import { create } from 'zustand';

interface EmbeddingState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  progressFile: string;
  error: string | null;
  setLoading: () => void;
  setProgress: (pct: number, file: string) => void;
  setReady: () => void;
  setError: (msg: string) => void;
}

export const useEmbeddingStore = create<EmbeddingState>((set) => ({
  status: 'idle',
  progress: 0,
  progressFile: '',
  error: null,
  setLoading: () => set({ status: 'loading', progress: 0, progressFile: '', error: null }),
  setProgress: (pct, file) => set({ progress: pct, progressFile: file }),
  setReady: () => set({ status: 'ready', progress: 100 }),
  setError: (msg) => set({ status: 'error', error: msg }),
}));
