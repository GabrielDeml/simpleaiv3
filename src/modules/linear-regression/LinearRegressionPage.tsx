import { useCallback, useEffect, useRef } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { InteractiveCanvas } from '../../components/shared/InteractiveCanvas';
import { ParameterSlider } from '../../components/shared/ParameterSlider';
import { ParameterPanel } from '../../components/shared/ParameterPanel';
import { PlayPauseButton } from '../../components/shared/PlayPauseButton';
import { TrainingMetrics } from '../../components/shared/TrainingMetrics';
import { useLinearRegressionStore } from '../../stores/useLinearRegressionStore';
import { useDraggablePoints } from '../../hooks/useDraggablePoints';
import {
  clearCanvas,
  drawGrid,
  drawAxes,
  drawPoint,
  drawLine,
  dataToCanvas,
} from '../../utils/canvas-helpers';
import { COLORS } from '../../config/constants';

const RANGE_X: [number, number] = [-1.5, 1.5];
const RANGE_Y: [number, number] = [-1.5, 1.5];

export default function LinearRegressionPage() {
  const {
    points,
    weight,
    bias,
    learningRate,
    loss,
    epoch,
    isTraining,
    addPoint,
    updatePoint,
    setLearningRate,
    trainStep,
    reset,
    toggleTraining,
  } = useLinearRegressionStore();

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTraining) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }
    let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime > 33) {
        trainStep();
        lastTime = time;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isTraining, trainStep]);

  const { onMouseDown, onMouseMove, onMouseUp } = useDraggablePoints({
    rangeX: RANGE_X,
    rangeY: RANGE_Y,
    onAddPoint: addPoint,
    onDragPoint: updatePoint,
    getPoints: () => useLinearRegressionStore.getState().points,
  });

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      const width = w / dpr;
      const height = h / dpr;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      clearCanvas(ctx, width, height);
      drawGrid(ctx, width, height);
      drawAxes(ctx, width, height);

      // Regression line
      if (points.length > 0) {
        const x1 = RANGE_X[0];
        const x2 = RANGE_X[1];
        const y1 = weight * x1 + bias;
        const y2 = weight * x2 + bias;
        const [cx1, cy1] = dataToCanvas(x1, y1, width, height, RANGE_X, RANGE_Y);
        const [cx2, cy2] = dataToCanvas(x2, y2, width, height, RANGE_X, RANGE_Y);
        drawLine(ctx, cx1, cy1, cx2, cy2, COLORS.red, 2);
      }

      // Data points
      for (const p of points) {
        const [cx, cy] = dataToCanvas(p.x, p.y, width, height, RANGE_X, RANGE_Y);
        drawPoint(ctx, cx, cy, COLORS.primaryLight, 6);
      }

      // Loss text
      if (points.length > 0) {
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '12px monospace';
        ctx.fillText(`Loss: ${loss.toFixed(4)}`, 10, 20);
        ctx.fillText(`y = ${weight.toFixed(3)}x + ${bias.toFixed(3)}`, 10, 36);
      }

      ctx.restore();
    },
    [points, weight, bias, loss],
  );

  const controls = (
    <div className="space-y-6">
      <ParameterPanel title="Parameters">
        <ParameterSlider
          label="Learning Rate"
          value={learningRate}
          min={0.001}
          max={1}
          step={0.001}
          onChange={setLearningRate}
          format={(v) => v.toFixed(3)}
        />
      </ParameterPanel>

      <ParameterPanel title="Training">
        <PlayPauseButton
          isPlaying={isTraining}
          onToggle={toggleTraining}
          onReset={reset}
          disabled={points.length === 0}
        />
        <TrainingMetrics epoch={epoch} loss={loss} isTraining={isTraining} />
      </ParameterPanel>

      <div className="text-xs text-text-muted leading-relaxed">
        Click on the canvas to add data points. The red line shows the current model fit. Press Play
        to auto-train, or toggle training manually.
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Linear Regression"
      description="Interactive gradient descent for fitting a line to data"
      controls={controls}
    >
      <InteractiveCanvas
        ariaLabel="Linear regression scatter plot — click to add data points"
        render={render}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        deps={[points, weight, bias, loss]}
      />
    </ModuleLayout>
  );
}
