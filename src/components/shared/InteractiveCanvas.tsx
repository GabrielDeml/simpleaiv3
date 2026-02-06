import { useRef } from 'react';
import { Canvas2D } from './Canvas2D';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';

interface InteractiveCanvasProps {
  className?: string;
  ariaLabel?: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  deps?: unknown[];
}

export function InteractiveCanvas({
  className,
  ariaLabel,
  render,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  deps = [],
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasRenderer(canvasRef, render, deps);

  return (
    <Canvas2D
      ref={canvasRef}
      className={className}
      ariaLabel={ariaLabel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}
