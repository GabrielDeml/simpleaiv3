import { useRef, useCallback } from 'react';
import { Canvas2D } from '../../components/shared/Canvas2D';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';
import { useNeuralNetworkStore } from '../../stores/useNeuralNetworkStore';
import { dataToCanvas, canvasToData } from '../../utils/canvas-helpers';
import { drawAxes, drawPoint } from '../../utils/canvas-helpers';
import { createDivergingScale, colorStringToRgb } from '../../utils/color-scales';
import { COLORS } from '../../config/constants';

const RANGE_X: [number, number] = [-1.5, 1.5];
const RANGE_Y: [number, number] = [-1.5, 1.5];

const colorScale = createDivergingScale([1, 0]); // reversed so blue=0, red=1

export function DecisionBoundaryCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<OffscreenCanvas | null>(null);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
      const store = useNeuralNetworkStore.getState();
      const { decisionBoundary, boundaryResolution, points } = store;

      // Canvas dimensions are in device pixels; context is pre-scaled by DPR,
      // so we need to work in CSS pixel coordinates.
      const dpr = window.devicePixelRatio || 1;
      const width = canvasWidth / dpr;
      const height = canvasHeight / dpr;

      // Clear with background
      ctx.fillStyle = COLORS.surfaceLight;
      ctx.fillRect(0, 0, width, height);

      // Draw decision boundary heatmap
      if (decisionBoundary) {
        const res = boundaryResolution;
        if (!offscreenRef.current || offscreenRef.current.width !== res) {
          offscreenRef.current = new OffscreenCanvas(res, res);
        }
        const offCtx = offscreenRef.current.getContext('2d')!;
        const imageData = offCtx.createImageData(res, res);

        // Flip Y-axis: prediction grid row 0 = data y_min (bottom of canvas),
        // but ImageData row 0 = top of canvas. Read rows in reverse.
        for (let py = 0; py < res; py++) {
          for (let px = 0; px < res; px++) {
            const srcRow = res - 1 - py;
            const value = decisionBoundary[srcRow * res + px];
            const color = colorScale(value);
            const [r, g, b] = colorStringToRgb(color);
            const dstIdx = (py * res + px) * 4;
            imageData.data[dstIdx] = r;
            imageData.data[dstIdx + 1] = g;
            imageData.data[dstIdx + 2] = b;
            imageData.data[dstIdx + 3] = 180;
          }
        }

        offCtx.putImageData(imageData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(offscreenRef.current, 0, 0, width, height);
      }

      // Draw axes
      drawAxes(ctx, width, height);

      // Draw data points
      for (const point of points) {
        const [cx, cy] = dataToCanvas(point.x, point.y, width, height, RANGE_X, RANGE_Y);
        const color = point.label === 0 ? COLORS.classColors[0] : COLORS.classColors[1];

        // White outline for visibility on heatmap
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        drawPoint(ctx, cx, cy, color, 4);
      }
    },
    [],
  );

  useCanvasRenderer(canvasRef, render);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Account for DPR in the canvas-to-data conversion
    const dpr = window.devicePixelRatio || 1;
    const [dx, dy] = canvasToData(
      mx / dpr,
      my / dpr,
      canvas.width / dpr,
      canvas.height / dpr,
      RANGE_X,
      RANGE_Y,
    );

    const currentLabel = useNeuralNetworkStore.getState().currentLabel;
    useNeuralNetworkStore.getState().addPoint({ x: dx, y: dy, label: currentLabel });
  }, []);

  return (
    <Canvas2D
      ref={canvasRef}
      className="aspect-square max-h-[500px]"
      ariaLabel="Neural network decision boundary — click to add data points"
      onMouseDown={handleMouseDown}
    />
  );
}
