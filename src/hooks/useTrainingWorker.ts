import { useEffect, useRef, useCallback } from 'react';
import { wrap, type Remote } from 'comlink';

export function useTrainingWorker<T>(workerFactory: () => Worker): {
  worker: React.RefObject<Remote<T> | null>;
  terminate: () => void;
} {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<T> | null>(null);

  useEffect(() => {
    const w = workerFactory();
    workerRef.current = w;
    apiRef.current = wrap<T>(w);

    return () => {
      w.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, [workerFactory]);

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    apiRef.current = null;
  }, []);

  return { worker: apiRef, terminate };
}
