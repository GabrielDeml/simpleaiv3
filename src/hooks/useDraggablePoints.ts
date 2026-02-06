import { useCallback, useRef } from 'react';
import { canvasToData, dataToCanvas } from '../utils/canvas-helpers';
import type { Point2D } from '../ml/types';

interface DraggableOptions {
  rangeX?: [number, number];
  rangeY?: [number, number];
  onAddPoint?: (point: Point2D) => void;
  onDragPoint?: (index: number, point: Point2D) => void;
  getPoints: () => Point2D[];
  hitRadius?: number;
  getLabel?: () => number;
}

export function useDraggablePoints(options: DraggableOptions) {
  const {
    rangeX = [-1, 1],
    rangeY = [-1, 1],
    onAddPoint,
    onDragPoint,
    getPoints,
    hitRadius = 12,
    getLabel,
  } = options;

  const draggingIndex = useRef<number | null>(null);

  const getMousePos = useCallback(
    (canvas: HTMLCanvasElement, e: React.MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return canvasToData(
        mx * (canvas.width / rect.width),
        my * (canvas.height / rect.height),
        canvas.width,
        canvas.height,
        rangeX,
        rangeY,
      );
    },
    [rangeX, rangeY],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const points = getPoints();

      for (let i = 0; i < points.length; i++) {
        const [px, py] = dataToCanvas(
          points[i].x,
          points[i].y,
          canvas.width,
          canvas.height,
          rangeX,
          rangeY,
        );
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
        if (dist < hitRadius) {
          draggingIndex.current = i;
          return;
        }
      }

      // No hit — add new point
      const [dx, dy] = getMousePos(canvas, e);
      onAddPoint?.({ x: dx, y: dy, label: getLabel?.() ?? 0 });
    },
    [getPoints, rangeX, rangeY, hitRadius, getMousePos, onAddPoint, getLabel],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingIndex.current === null) return;
      const canvas = e.currentTarget;
      const [dx, dy] = getMousePos(canvas, e);
      const pts = getPoints();
      onDragPoint?.(draggingIndex.current, {
        x: dx,
        y: dy,
        label: pts[draggingIndex.current]?.label ?? 0,
      });
    },
    [getMousePos, getPoints, onDragPoint],
  );

  const onMouseUp = useCallback(() => {
    draggingIndex.current = null;
  }, []);

  return { onMouseDown, onMouseMove, onMouseUp };
}
