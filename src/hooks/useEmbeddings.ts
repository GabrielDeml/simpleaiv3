import { useRef, useCallback, useEffect } from 'react';
import { wrap, proxy, type Remote } from 'comlink';
import { useEmbeddingStore } from '../stores/useEmbeddingStore';
import type { EmbeddingWorkerAPI } from '../workers/embedding.worker';

export function useEmbeddings() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<EmbeddingWorkerAPI> | null>(null);
  const cacheRef = useRef<Map<string, number[]>>(new Map());
  const { status, progress, progressFile, error, setLoading, setProgress, setReady, setError } =
    useEmbeddingStore();

  // Create worker lazily on first use
  const getApi = useCallback(() => {
    if (!workerRef.current) {
      const w = new Worker(new URL('../workers/embedding.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = w;
      apiRef.current = wrap<EmbeddingWorkerAPI>(w);
    }
    return apiRef.current!;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  const loadModel = useCallback(async () => {
    if (status === 'ready' || status === 'loading') return;
    setLoading();
    try {
      const api = getApi();
      await api.init(
        proxy((p: { status: string; progress?: number; file?: string }) => {
          if (p.status === 'progress' && p.progress != null) {
            setProgress(Math.round(p.progress), p.file ?? '');
          }
        }),
      );
      setReady();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load model');
    }
  }, [status, getApi, setLoading, setProgress, setReady, setError]);

  const embed = useCallback(
    async (words: string[]): Promise<number[][]> => {
      const api = getApi();
      // Check cache for all words
      const uncached: string[] = [];
      for (let i = 0; i < words.length; i++) {
        if (!cacheRef.current.has(words[i].toLowerCase())) {
          uncached.push(words[i]);
        }
      }

      if (uncached.length > 0) {
        const vectors = await api.embed(uncached);
        for (let i = 0; i < uncached.length; i++) {
          cacheRef.current.set(uncached[i].toLowerCase(), vectors[i]);
        }
      }

      return words.map((w) => cacheRef.current.get(w.toLowerCase())!);
    },
    [getApi],
  );

  return { embed, loadModel, status, progress, progressFile, error };
}
