import { useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { InteractiveCanvas } from '../../components/shared/InteractiveCanvas';
import { ParameterSlider } from '../../components/shared/ParameterSlider';
import { ParameterPanel } from '../../components/shared/ParameterPanel';
import { PlayPauseButton } from '../../components/shared/PlayPauseButton';
import { LossSurface } from '../../components/three/LossSurface';
import { GradientPath } from '../../components/three/GradientPath';
import { CameraControls } from '../../components/three/CameraControls';
import { useGradientDescentStore } from '../../stores/useGradientDescentStore';
import { evaluateSurface, type SurfaceType } from '../../ml/gradient-descent';
import { clearCanvas, canvasToData } from '../../utils/canvas-helpers';
import { createViridisScale } from '../../utils/color-scales';
import { COLORS } from '../../config/constants';

const SURFACE_OPTIONS: { value: SurfaceType; label: string }[] = [
  { value: 'bowl', label: 'Bowl (Quadratic)' },
  { value: 'saddle', label: 'Saddle Point' },
  { value: 'rosenbrock', label: 'Rosenbrock' },
  { value: 'beale', label: 'Beale' },
];

const RANGE = 3;

export default function GradientDescentPage() {
  const {
    position,
    path,
    learningRate,
    surfaceType,
    isPlaying,
    stepCount,
    viewMode,
    setPosition,
    step,
    reset,
    setLearningRate,
    setSurfaceType,
    togglePlaying,
    setViewMode,
  } = useGradientDescentStore();

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }
    let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime > 100) {
        step();
        lastTime = time;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, step]);

  // Contour click handler
  const onContourClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const [dx, dy] = canvasToData(
        mx,
        my,
        canvas.width,
        canvas.height,
        [-RANGE, RANGE],
        [-RANGE, RANGE],
      );
      setPosition([dx, dy]);
    },
    [setPosition],
  );

  // Contour renderer
  const renderContour = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      const width = w / dpr;
      const height = h / dpr;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      clearCanvas(ctx, width, height);

      // Compute surface values for coloring
      const res = 100;
      const cellW = width / res;
      const cellH = height / res;

      // Find z range for this surface
      let zMin = Infinity;
      let zMax = -Infinity;
      const zGrid: number[][] = [];
      for (let i = 0; i < res; i++) {
        zGrid[i] = [];
        for (let j = 0; j < res; j++) {
          const x = -RANGE + (i / res) * 2 * RANGE;
          const y = RANGE - (j / res) * 2 * RANGE;
          let z = evaluateSurface(x, y, surfaceType);
          z = Math.min(z, 20);
          zGrid[i][j] = z;
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
        }
      }

      const colorScale = createViridisScale([zMin, zMax]);

      for (let i = 0; i < res; i++) {
        for (let j = 0; j < res; j++) {
          ctx.fillStyle = colorScale(zGrid[i][j]);
          ctx.fillRect(i * cellW, j * cellH, cellW + 1, cellH + 1);
        }
      }

      // Draw contour lines
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      const levels = 15;
      for (let l = 0; l < levels; l++) {
        const threshold = zMin + ((zMax - zMin) * l) / levels;
        for (let i = 0; i < res - 1; i++) {
          for (let j = 0; j < res - 1; j++) {
            const v = zGrid[i][j];
            const vr = zGrid[i + 1][j];
            const vb = zGrid[i][j + 1];
            if (v >= threshold !== vr >= threshold) {
              const cx = (i + 0.5) * cellW;
              const cy = j * cellH;
              ctx.beginPath();
              ctx.arc(cx, cy, 0.5, 0, Math.PI * 2);
              ctx.stroke();
            }
            if (v >= threshold !== vb >= threshold) {
              const cx = i * cellW;
              const cy = (j + 0.5) * cellH;
              ctx.beginPath();
              ctx.arc(cx, cy, 0.5, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
      }

      // Draw path
      if (path.length > 1) {
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const px = ((path[i][0] + RANGE) / (2 * RANGE)) * width;
          const py = ((RANGE - path[i][1]) / (2 * RANGE)) * height;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Draw path points
      for (let i = 0; i < path.length; i++) {
        const px = ((path[i][0] + RANGE) / (2 * RANGE)) * width;
        const py = ((RANGE - path[i][1]) / (2 * RANGE)) * height;
        ctx.beginPath();
        ctx.arc(px, py, i === path.length - 1 ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = i === path.length - 1 ? COLORS.red : '#f97316';
        ctx.fill();
      }

      // Info text
      ctx.fillStyle = COLORS.text;
      ctx.font = '12px monospace';
      const z = evaluateSurface(position[0], position[1], surfaceType);
      ctx.fillText(
        `f(${position[0].toFixed(2)}, ${position[1].toFixed(2)}) = ${z.toFixed(4)}`,
        10,
        20,
      );

      ctx.restore();
    },
    [surfaceType, path, position],
  );

  const controls = (
    <div className="space-y-6">
      <ParameterPanel title="Surface">
        <div className="flex flex-col gap-1">
          {SURFACE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSurfaceType(opt.value)}
              className={`text-left px-3 py-1.5 rounded text-sm transition-colors ${
                surfaceType === opt.value
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:bg-surface-lighter'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </ParameterPanel>

      <ParameterPanel title="Parameters">
        <ParameterSlider
          label="Learning Rate"
          value={learningRate}
          min={0.001}
          max={0.5}
          step={0.001}
          onChange={setLearningRate}
          format={(v) => v.toFixed(3)}
        />
      </ParameterPanel>

      <ParameterPanel title="Controls">
        <div className="flex flex-col gap-2">
          <button
            onClick={step}
            className="px-4 py-2 rounded-md bg-surface-lighter hover:bg-border text-text text-sm font-medium transition-colors"
          >
            Step
          </button>
          <PlayPauseButton isPlaying={isPlaying} onToggle={togglePlaying} onReset={reset} />
        </div>
      </ParameterPanel>

      <ParameterPanel title="View">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('3d')}
            className={`flex-1 px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === '3d' ? 'bg-primary text-white' : 'bg-surface-lighter text-text-muted'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => setViewMode('contour')}
            className={`flex-1 px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'contour'
                ? 'bg-primary text-white'
                : 'bg-surface-lighter text-text-muted'
            }`}
          >
            Contour
          </button>
        </div>
      </ParameterPanel>

      <ParameterPanel title="Status">
        <div className="bg-surface rounded-md p-3">
          <p className="text-xs text-text-muted">Steps</p>
          <p className="text-lg font-mono text-text">{stepCount}</p>
        </div>
        <div className="bg-surface rounded-md p-3">
          <p className="text-xs text-text-muted">Value</p>
          <p className="text-lg font-mono text-text">
            {evaluateSurface(position[0], position[1], surfaceType).toFixed(4)}
          </p>
        </div>
      </ParameterPanel>

      <div className="text-xs text-text-muted leading-relaxed">
        {viewMode === 'contour'
          ? 'Click on the contour map to set the starting position. Use Step or Play to watch gradient descent find the minimum.'
          : 'Drag to rotate the 3D view. The red path shows the gradient descent trajectory.'}
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Gradient Descent"
      description="Visualize gradient descent on various loss surfaces"
      controls={controls}
    >
      {viewMode === '3d' ? (
        <div className="w-full h-full rounded-lg overflow-hidden" style={{ background: '#1e293b' }}>
          <Canvas camera={{ position: [6, 5, 6], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} />
            <LossSurface surfaceType={surfaceType} />
            <GradientPath path={path} surfaceType={surfaceType} />
            <CameraControls />
          </Canvas>
        </div>
      ) : (
        <InteractiveCanvas
          ariaLabel="Gradient descent contour plot — click to set starting position"
          render={renderContour}
          onMouseDown={onContourClick}
          deps={[surfaceType, path, position]}
        />
      )}
    </ModuleLayout>
  );
}
