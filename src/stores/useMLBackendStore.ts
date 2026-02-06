import { create } from 'zustand';

type Backend = 'webgpu' | 'webgl' | 'cpu' | null;

interface MLBackendState {
  backend: Backend;
  isInitializing: boolean;
  error: string | null;
  setBackend: (backend: Backend) => void;
  setInitializing: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useMLBackendStore = create<MLBackendState>((set) => ({
  backend: null,
  isInitializing: true,
  error: null,
  setBackend: (backend) => set({ backend }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setError: (error) => set({ error }),
}));
