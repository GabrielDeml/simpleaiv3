import * as Comlink from 'comlink';
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

let extractor: FeatureExtractionPipeline | null = null;

const api = {
  async init(onProgress: (progress: { status: string; progress?: number; file?: string }) => void) {
    if (extractor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pipeline() overloads produce union too complex for TS
    extractor = await (pipeline as any)('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: onProgress,
    });
  },

  async embed(words: string[]): Promise<number[][]> {
    if (!extractor) throw new Error('Model not loaded');
    const result = await extractor(words, { pooling: 'mean', normalize: true });
    return result.tolist() as number[][];
  },

  dispose() {
    extractor = null;
  },
};

export type EmbeddingWorkerAPI = typeof api;
Comlink.expose(api);
