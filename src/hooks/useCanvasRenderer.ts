import { useEffect, useRef, useCallback } from 'react';

type RenderFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

export function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  render: RenderFn,
  deps: unknown[] = [],
): void {
  const frameRef = useRef<number | null>(null);
  const renderRef = useRef(render);
  renderRef.current = render;

  const startLoop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const { width, height } = canvas;
      if (width > 0 && height > 0) {
        renderRef.current(ctx, width, height);
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
  }, [canvasRef]);

  useEffect(() => {
    startLoop();
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLoop, ...deps]);
}
