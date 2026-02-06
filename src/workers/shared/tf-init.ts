import * as tf from '@tensorflow/tfjs';

export async function initTFInWorker(): Promise<string> {
  const backends = ['webgpu', 'webgl', 'cpu'] as const;
  for (const backend of backends) {
    try {
      if (backend === 'webgpu') {
        await import('@tensorflow/tfjs-backend-webgpu');
      }
      await tf.setBackend(backend);
      await tf.ready();
      return backend;
    } catch {
      // try next
    }
  }
  throw new Error('No backend available in worker');
}
