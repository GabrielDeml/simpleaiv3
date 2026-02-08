import { useCallback, useEffect, useRef } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { InteractiveCanvas } from '../../components/shared/InteractiveCanvas';
import { ParameterSlider } from '../../components/shared/ParameterSlider';
import { ParameterPanel } from '../../components/shared/ParameterPanel';
import { PlayPauseButton } from '../../components/shared/PlayPauseButton';
import { ColorLegend } from '../../components/shared/ColorLegend';
import { useKMeansStore } from '../../stores/useKMeansStore';
import {
  clearCanvas,
  drawGrid,
  drawPoint,
  dataToCanvas,
  canvasToData,
} from '../../utils/canvas-helpers';
import { COLORS } from '../../config/constants';

const RANGE: [number, number] = [-1.5, 1.5];

export default function KMeansPage() {
  const {
    points,
    centroids,
    assignments,
    k,
    stepCount,
    converged,
    isPlaying,
    addPoint,
    setK,
    initialize,
    step,
    reset,
    togglePlaying,
  } = useKMeansStore();

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || converged) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (converged && isPlaying) togglePlaying();
      return;
    }
    let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime > 500) {
        step();
        lastTime = time;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, converged, step, togglePlaying]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const [dx, dy] = canvasToData(mx, my, canvas.width, canvas.height, RANGE, RANGE);
      addPoint({ x: dx, y: dy });
    },
    [addPoint],
  );

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      const width = w / dpr;
      const height = h / dpr;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      clearCanvas(ctx, width, height);
      drawGrid(ctx, width, height);

      // Draw data points colored by assignment
      for (let i = 0; i < points.length; i++) {
        const color =
          assignments.length > 0
            ? COLORS.classColors[assignments[i] % COLORS.classColors.length]
            : COLORS.textMuted;
        const [cx, cy] = dataToCanvas(points[i].x, points[i].y, width, height, RANGE, RANGE);
        drawPoint(ctx, cx, cy, color, 5);
      }

      // Draw centroids
      for (let c = 0; c < centroids.length; c++) {
        const color = COLORS.classColors[c % COLORS.classColors.length];
        const [cx, cy] = dataToCanvas(centroids[c].x, centroids[c].y, width, height, RANGE, RANGE);
        // Filled center
        drawPoint(ctx, cx, cy, color, 10);
        // Outline ring
        drawPoint(ctx, cx, cy, '#ffffff', 12, true);
      }

      // Status text
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '12px monospace';
      ctx.fillText(`Step: ${stepCount}`, 10, 20);
      if (converged) {
        ctx.fillStyle = COLORS.green;
        ctx.fillText('Converged!', 10, 36);
      }

      ctx.restore();
    },
    [points, centroids, assignments, stepCount, converged],
  );

  const legendItems = Array.from({ length: k }, (_, i) => ({
    label: `Cluster ${i + 1}`,
    color: COLORS.classColors[i % COLORS.classColors.length],
  }));

  const controls = (
    <div className="space-y-6">
      <ParameterPanel title="Parameters">
        <ParameterSlider label="K (clusters)" value={k} min={2} max={8} step={1} onChange={setK} />
      </ParameterPanel>

      <ParameterPanel title="Controls">
        <div className="flex flex-col gap-2">
          <button
            onClick={initialize}
            disabled={points.length < k}
            className="px-4 py-2 rounded-lg border border-border/80 bg-surface-lighter/50 hover:bg-surface-lighter hover:border-border text-text text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Initialize Centroids
          </button>
          <button
            onClick={step}
            disabled={points.length < k || converged}
            className="px-4 py-2 rounded-lg border border-border/80 bg-surface-lighter/50 hover:bg-surface-lighter hover:border-border text-text text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Step
          </button>
          <PlayPauseButton
            isPlaying={isPlaying}
            onToggle={togglePlaying}
            onReset={reset}
            disabled={points.length < k}
          />
        </div>
      </ParameterPanel>

      <ParameterPanel title="Status">
        <div className="bg-surface rounded-lg p-3 border border-white/[0.04]">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Steps</p>
          <p className="text-lg font-mono text-text tabular-nums">{stepCount}</p>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-white/[0.04]">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Points</p>
          <p className="text-lg font-mono text-text tabular-nums">{points.length}</p>
        </div>
        {converged && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-xs text-accent-green">Converged</span>
          </div>
        )}
      </ParameterPanel>

      <ParameterPanel title="Legend">
        <ColorLegend items={legendItems} />
      </ParameterPanel>

      <div className="text-xs text-text-muted leading-relaxed">
        Click on the canvas to add data points. Initialize centroids, then step through the K-Means
        algorithm.
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="K-Means Clustering"
      description="Interactive K-Means clustering with step-by-step visualization"
      controls={controls}
    >
      <InteractiveCanvas
        ariaLabel="K-means clustering visualization — click to add data points"
        render={render}
        onMouseDown={onMouseDown}
        deps={[points, centroids, assignments, stepCount, converged]}
      />
    </ModuleLayout>
  );
}
