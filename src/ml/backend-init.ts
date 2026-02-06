import * as tf from '@tensorflow/tfjs';
import { useMLBackendStore } from '../stores/useMLBackendStore';

export async function initTFBackend(): Promise<string> {
  const store = useMLBackendStore.getState();
  store.setInitializing(true);

  const backends = ['webgpu', 'webgl', 'cpu'] as const;

  for (const backend of backends) {
    try {
      if (backend === 'webgpu') {
        await import('@tensorflow/tfjs-backend-webgpu');
      }
      await tf.setBackend(backend);
      await tf.ready();
      store.setBackend(backend);
      store.setInitializing(false);
      // eslint-disable-next-line no-console
      if (import.meta.env.DEV) console.log(`TF.js backend: ${backend}`);
      return backend;
    } catch (e) {
      // eslint-disable-next-line no-console
      if (import.meta.env.DEV) console.warn(`Backend ${backend} not available:`, e);
    }
  }

  store.setError('No ML backend available');
  store.setInitializing(false);
  throw new Error('No ML backend available');
}
