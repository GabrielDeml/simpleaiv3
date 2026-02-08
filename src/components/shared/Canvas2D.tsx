import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useResizeObserver } from '../../hooks/useResizeObserver';

interface Canvas2DProps {
  className?: string;
  ariaLabel?: string;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export const Canvas2D = forwardRef<HTMLCanvasElement, Canvas2DProps>(
  ({ className = '', ariaLabel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [containerRef, size] = useResizeObserver<HTMLDivElement>();

    useImperativeHandle(ref, () => canvasRef.current!, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || size.width === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size.width * dpr;
      canvas.height = size.height * dpr;
      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }, [size]);

    return (
      <div ref={containerRef} className={`w-full h-full ${className}`}>
        <canvas
          ref={canvasRef}
          className="block rounded-lg border border-white/[0.04]"
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </div>
    );
  },
);

Canvas2D.displayName = 'Canvas2D';
