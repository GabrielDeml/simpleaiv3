import { useState, useRef, useEffect, useCallback } from 'react';
import { MathLayout } from '../../components/math/MathLayout';
import { Section } from '../../components/math/Section';
import { Eq } from '../../components/math/Eq';
import { Prose } from '../../components/math/Prose';
import { InteractiveDemo } from '../../components/math/InteractiveDemo';
import { ParameterSlider } from '../../components/shared/ParameterSlider';

// ── Color constants ──────────────────────────────────────────────────
const BG = '#0f172a';
const GRID_COLOR = 'rgba(71, 85, 105, 0.3)';
const TEXT_COLOR = '#f1f5f9';
const MUTED = '#94a3b8';
const PRIMARY = '#2563eb';
const PRIMARY_LIGHT = '#3b82f6';
const ACCENT_GREEN = '#10b981';
const ACCENT_RED = '#ef4444';
const ACCENT_AMBER = '#f59e0b';
const ACCENT_PURPLE = '#8b5cf6';

// ── Viridis-like color map ───────────────────────────────────────────

// ── Canvas setup with DPR ────────────────────────────────────────────
function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  return ctx;
}

// ── Draw grid helper ─────────────────────────────────────────────────
function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  xRange: [number, number],
  yRange: [number, number],
  gridStep: number = 1,
) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;

  const toScreenX = (x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * w;
  const toScreenY = (y: number) => h - ((y - yRange[0]) / (yRange[1] - yRange[0])) * h;

  for (let x = Math.ceil(xRange[0] / gridStep) * gridStep; x <= xRange[1]; x += gridStep) {
    const sx = toScreenX(x);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, h);
    ctx.stroke();
  }
  for (let y = Math.ceil(yRange[0] / gridStep) * gridStep; y <= yRange[1]; y += gridStep) {
    const sy = toScreenY(y);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
  ctx.lineWidth = 1;
  const zx = toScreenX(0);
  const zy = toScreenY(0);
  if (zx >= 0 && zx <= w) {
    ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, h); ctx.stroke();
  }
  if (zy >= 0 && zy <= h) {
    ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(w, zy); ctx.stroke();
  }
}

// ── Draw a dot ───────────────────────────────────────────────────────
function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ── Draw an arrow ────────────────────────────────────────────────────
function drawArrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, width: number = 2) {
  const headLen = 8;
  const angle = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - headLen * Math.cos(angle - 0.4), y1 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x1 - headLen * Math.cos(angle + 0.4), y1 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

// ── Contour using canvas native resolution (for DPR-scaled canvases) ─
function drawContourDPR(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  xRange: [number, number],
  yRange: [number, number],
  fn: (x: number, y: number) => number,
  maxVal: number,
) {
  // Reset transform, draw at native resolution, then restore
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const nw = canvas.width;
  const nh = canvas.height;
  const imageData = ctx.createImageData(nw, nh);
  for (let py = 0; py < nh; py++) {
    for (let px = 0; px < nw; px++) {
      const x = xRange[0] + (px / nw) * (xRange[1] - xRange[0]);
      const y = yRange[1] - (py / nh) * (yRange[1] - yRange[0]);
      const val = fn(x, y);
      const t = Math.min(val / maxVal, 1);
      const r = Math.round(68 * (1 - t) * (1 - t) + 49 * 2 * t * (1 - t) + 253 * t * t);
      const g = Math.round(1 * (1 - t) * (1 - t) + 155 * 2 * t * (1 - t) + 231 * t * t);
      const b = Math.round(84 * (1 - t) * (1 - t) + 110 * 2 * t * (1 - t) + 37 * t * t);
      const idx = (py * nw + px) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

// ── Contour lines overlay ────────────────────────────────────────────
function drawContourLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  xRange: [number, number],
  yRange: [number, number],
  fn: (x: number, y: number) => number,
  levels: number[],
) {
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 0.5;
  const step = 2;
  for (const level of levels) {
    for (let py = 0; py < h - step; py += step) {
      for (let px = 0; px < w - step; px += step) {
        const x0 = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
        const y0 = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
        const x1 = xRange[0] + ((px + step) / w) * (xRange[1] - xRange[0]);
        const y1 = yRange[1] - ((py + step) / h) * (yRange[1] - yRange[0]);
        const v00 = fn(x0, y0);
        const v10 = fn(x1, y0);
        const v01 = fn(x0, y1);
        const v11 = fn(x1, y1);
        const above = [v00 >= level, v10 >= level, v01 >= level, v11 >= level];
        const nAbove = above.filter(Boolean).length;
        if (nAbove > 0 && nAbove < 4) {
          ctx.beginPath();
          ctx.arc(px + step / 2, py + step / 2, 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 1: Derivative Demo
// ══════════════════════════════════════════════════════════════════════
function DerivativeDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [xPos, setXPos] = useState(1.5);
  const [deltaX, setDeltaX] = useState(1.5);
  const isDragging = useRef(false);
  const W = 600;
  const H = 340;
  const xRange: [number, number] = [-3, 3];
  const yRange: [number, number] = [-1, 9.5];

  const f = (x: number) => x * x;
  const df = (x: number) => 2 * x;

  const toSx = useCallback((x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W, []);
  const toSy = useCallback((y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H, []);
  const fromSx = useCallback((sx: number) => xRange[0] + (sx / W) * (xRange[1] - xRange[0]), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, xRange, yRange, 1);

    // Draw f(x) = x^2
    ctx.strokeStyle = PRIMARY_LIGHT;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px <= W; px++) {
      const x = fromSx(px);
      const y = f(x);
      const sy = toSy(y);
      if (px === 0) ctx.moveTo(px, sy);
      else ctx.lineTo(px, sy);
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = MUTED;
    ctx.font = '13px monospace';
    ctx.fillText('f(x) = x\u00B2', toSx(1.8), toSy(8.5));

    const slope = df(xPos);
    const y0 = f(xPos);

    // Secant line (delta x visualization)
    if (deltaX > 0.05) {
      const x2 = xPos + deltaX;
      const y2 = f(x2);
      // Secant line
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      const secSlope = (y2 - y0) / (x2 - xPos);
      const xL = xRange[0];
      const xR = xRange[1];
      ctx.beginPath();
      ctx.moveTo(toSx(xL), toSy(y0 + secSlope * (xL - xPos)));
      ctx.lineTo(toSx(xR), toSy(y0 + secSlope * (xR - xPos)));
      ctx.stroke();
      ctx.setLineDash([]);

      // Delta markers
      ctx.strokeStyle = ACCENT_PURPLE;
      ctx.lineWidth = 1;
      // Horizontal delta x
      ctx.beginPath();
      ctx.moveTo(toSx(xPos), toSy(y0));
      ctx.lineTo(toSx(x2), toSy(y0));
      ctx.stroke();
      // Vertical delta y
      ctx.beginPath();
      ctx.moveTo(toSx(x2), toSy(y0));
      ctx.lineTo(toSx(x2), toSy(y2));
      ctx.stroke();

      // Labels
      ctx.fillStyle = ACCENT_PURPLE;
      ctx.font = '11px monospace';
      ctx.fillText(`\u0394x = ${deltaX.toFixed(2)}`, toSx((xPos + x2) / 2) - 20, toSy(y0) + 16);
      ctx.fillText(`\u0394y = ${(y2 - y0).toFixed(2)}`, toSx(x2) + 5, toSy((y0 + y2) / 2));

      // Second point
      drawDot(ctx, toSx(x2), toSy(y2), 5, ACCENT_PURPLE, 'white');
    }

    // Tangent line
    ctx.strokeStyle = ACCENT_GREEN;
    ctx.lineWidth = 2;
    const tanLen = 2;
    ctx.beginPath();
    ctx.moveTo(toSx(xPos - tanLen), toSy(y0 - slope * tanLen));
    ctx.lineTo(toSx(xPos + tanLen), toSy(y0 + slope * tanLen));
    ctx.stroke();

    // Point on curve
    drawDot(ctx, toSx(xPos), toSy(y0), 6, ACCENT_GREEN, 'white');

    // Value labels
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`x = ${xPos.toFixed(2)}`, 12, 22);
    ctx.fillText(`f(x) = ${y0.toFixed(2)}`, 12, 40);
    ctx.fillStyle = ACCENT_GREEN;
    ctx.fillText(`f'(x) = ${slope.toFixed(2)}`, 12, 58);
    if (deltaX > 0.05) {
      ctx.fillStyle = ACCENT_PURPLE;
      const secSlope = (f(xPos + deltaX) - y0) / deltaX;
      ctx.fillText(`\u0394y/\u0394x = ${secSlope.toFixed(2)}`, 12, 76);
    }
  }, [xPos, deltaX, toSx, toSy, fromSx]);

  const handleMouse = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const x = fromSx(sx);
    setXPos(Math.max(-2.8, Math.min(2.8, x)));
  }, [fromSx]);

  return (
    <InteractiveDemo title="Interactive: Drag the point along the curve">
      <canvas
        ref={canvasRef}
        className="border border-white/[0.06] rounded-lg cursor-grab active:cursor-grabbing w-full"
        style={{ maxWidth: W }}
        onMouseDown={() => { isDragging.current = true; }}
        onMouseMove={handleMouse}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => { isDragging.current = false; }}
      />
      <div className="mt-4 max-w-md">
        <ParameterSlider
          label={'\u0394x (secant interval)'}
          value={deltaX}
          min={0}
          max={2}
          step={0.01}
          onChange={setDeltaX}
          format={(v) => v < 0.05 ? 'limit \u2192 0' : v.toFixed(2)}
        />
        <p className="text-xs text-text-muted mt-2">
          Shrink {'\u0394x'} toward zero and watch the secant line (purple) approach the tangent (green).
          The slope of the tangent is the derivative.
        </p>
      </div>
    </InteractiveDemo>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 2: Gradient (Partial Derivatives) Demo
// ══════════════════════════════════════════════════════════════════════
function GradientDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clickPt, setClickPt] = useState<{ x: number; y: number } | null>(null);
  const W = 500;
  const H = 500;
  const R = 4;
  const xRange: [number, number] = [-R, R];
  const yRange: [number, number] = [-R, R];

  const fn = (x: number, y: number) => x * x + y * y;
  const gradF = (x: number, y: number): [number, number] => [2 * x, 2 * y];

  const toSx = useCallback((x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W, []);
  const toSy = useCallback((y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    // Draw contour
    drawContourDPR(ctx, canvas, W, H, xRange, yRange, fn, 20);

    // Contour lines
    const levels = [1, 2, 4, 6, 8, 10, 14, 18];
    drawContourLines(ctx, W, H, xRange, yRange, fn, levels);

    // Draw gradient arrows on grid
    const step = 1;
    for (let x = -3; x <= 3; x += step) {
      for (let y = -3; y <= 3; y += step) {
        if (x === 0 && y === 0) continue;
        const [gx, gy] = gradF(x, y);
        const mag = Math.sqrt(gx * gx + gy * gy);
        const scale = 22 / Math.max(mag, 0.1);
        const sx0 = toSx(x);
        const sy0 = toSy(y);
        const sx1 = sx0 + gx * scale;
        const sy1 = sy0 - gy * scale; // flip y
        drawArrow(ctx, sx0, sy0, sx1, sy1, 'rgba(255,255,255,0.35)', 1.2);
      }
    }

    // Highlighted click point
    if (clickPt) {
      const [gx, gy] = gradF(clickPt.x, clickPt.y);
      const mag = Math.sqrt(gx * gx + gy * gy);
      const scale = 30 / Math.max(mag, 0.1);
      const sx0 = toSx(clickPt.x);
      const sy0 = toSy(clickPt.y);
      drawArrow(ctx, sx0, sy0, sx0 + gx * scale, sy0 - gy * scale, ACCENT_AMBER, 2.5);
      drawDot(ctx, sx0, sy0, 6, ACCENT_AMBER, 'white');

      // Info
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`Point: (${clickPt.x.toFixed(1)}, ${clickPt.y.toFixed(1)})`, 10, 22);
      ctx.fillText(`f = ${fn(clickPt.x, clickPt.y).toFixed(2)}`, 10, 40);
      ctx.fillStyle = ACCENT_AMBER;
      ctx.fillText(`\u2207f = [${gx.toFixed(2)}, ${gy.toFixed(2)}]`, 10, 58);
      ctx.fillText(`|\u2207f| = ${mag.toFixed(2)}`, 10, 76);
    }

    // Axis labels
    ctx.fillStyle = MUTED;
    ctx.font = '12px monospace';
    ctx.fillText('x', W - 15, toSy(0) - 5);
    ctx.fillText('y', toSx(0) + 5, 15);
  }, [clickPt, toSx, toSy]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const x = xRange[0] + (sx / W) * (xRange[1] - xRange[0]);
    const y = yRange[1] - (sy / H) * (yRange[1] - yRange[0]);
    setClickPt({ x: Math.round(x * 4) / 4, y: Math.round(y * 4) / 4 });
  }, []);

  return (
    <InteractiveDemo title="Interactive: Click to see the gradient vector">
      <canvas
        ref={canvasRef}
        className="border border-white/[0.06] rounded-lg cursor-crosshair w-full"
        style={{ maxWidth: W }}
        onClick={handleClick}
      />
      <p className="text-xs text-text-muted mt-3">
        Contour plot of f(x,y) = x{'\u00B2'} + y{'\u00B2'}. White arrows show the gradient (steepest ascent).
        Click anywhere to highlight the gradient vector at that point.
      </p>
    </InteractiveDemo>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 3: GD Update Rule - 1D Step Demo
// ══════════════════════════════════════════════════════════════════════
function GDStepDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState(2.5);
  const [trail, setTrail] = useState<number[]>([2.5]);
  const [lr, setLr] = useState(0.15);
  const W = 600;
  const H = 300;
  const xRange: [number, number] = [-3.5, 3.5];
  const yRange: [number, number] = [-0.5, 8];

  const f = (x: number) => x * x;
  const df = (x: number) => 2 * x;

  const toSx = useCallback((x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W, []);
  const toSy = useCallback((y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H, xRange, yRange, 1);

    // Draw curve
    ctx.strokeStyle = PRIMARY_LIGHT;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px <= W; px++) {
      const x = xRange[0] + (px / W) * (xRange[1] - xRange[0]);
      const y = f(x);
      const sy = toSy(y);
      if (px === 0) ctx.moveTo(px, sy);
      else ctx.lineTo(px, sy);
    }
    ctx.stroke();

    // Trail dots
    for (let i = 0; i < trail.length; i++) {
      const alpha = 0.2 + 0.8 * (i / trail.length);
      const tx = trail[i];
      drawDot(ctx, toSx(tx), toSy(f(tx)), 4, `rgba(37, 99, 235, ${alpha})`);
    }

    // Current position
    const curY = f(pos);
    drawDot(ctx, toSx(pos), toSy(curY), 7, ACCENT_GREEN, 'white');

    // Tangent at current point
    const slope = df(pos);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(toSx(pos - 1.5), toSy(curY - slope * 1.5));
    ctx.lineTo(toSx(pos + 1.5), toSy(curY + slope * 1.5));
    ctx.stroke();
    ctx.setLineDash([]);

    // Show update equation with numbers
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Step ${trail.length - 1}`, 10, 22);
    ctx.fillText(`\u03B8 = ${pos.toFixed(4)}`, 10, 40);
    ctx.fillText(`f(\u03B8) = ${curY.toFixed(4)}`, 10, 58);
    ctx.fillText(`f'(\u03B8) = ${slope.toFixed(4)}`, 10, 76);
    ctx.fillStyle = ACCENT_GREEN;
    const newPos = pos - lr * slope;
    ctx.fillText(`\u03B8_new = ${pos.toFixed(3)} - ${lr} \u00D7 ${slope.toFixed(3)} = ${newPos.toFixed(4)}`, 10, 100);
  }, [pos, trail, lr, toSx, toSy]);

  const step = () => {
    const grad = df(pos);
    const newPos = pos - lr * grad;
    setPos(newPos);
    setTrail((prev) => [...prev, newPos]);
  };

  const reset = () => {
    setPos(2.5);
    setTrail([2.5]);
  };

  return (
    <InteractiveDemo title="Interactive: Step through gradient descent">
      <canvas
        ref={canvasRef}
        className="border border-white/[0.06] rounded-lg w-full"
        style={{ maxWidth: W }}
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={step}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
        >
          Take Step
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-surface-lighter text-text text-sm font-medium hover:bg-border/60 transition-colors"
        >
          Reset
        </button>
        <div className="flex-1 min-w-[200px]">
          <ParameterSlider
            label={'Learning Rate (\u03B1)'}
            value={lr}
            min={0.01}
            max={0.5}
            step={0.01}
            onChange={setLr}
          />
        </div>
      </div>
    </InteractiveDemo>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 4: Learning Rate Comparison
// ══════════════════════════════════════════════════════════════════════
function LearningRateDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userLr, setUserLr] = useState(0.1);
  const [running, setRunning] = useState(false);
  const animRef = useRef(0);
  // Paths are computed on each render/animation frame
  const W = 600;
  const H = 450;
  const R = 4;
  const xRange: [number, number] = [-R, R];
  const yRange: [number, number] = [-R, R];

  // Elongated bowl: f(x,y) = 3x^2 + 0.5y^2
  const fn = (x: number, y: number) => 3 * x * x + 0.5 * y * y;
  const grad = (x: number, y: number): [number, number] => [6 * x, y];

  const toSx = useCallback((x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W, []);
  const toSy = useCallback((y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H, []);

  const computePath = useCallback((lr: number, steps: number): [number, number][] => {
    const path: [number, number][] = [[-3, 3]];
    let x = -3, y = 3;
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = grad(x, y);
      x = x - lr * gx;
      y = y - lr * gy;
      if (Math.abs(x) > 20 || Math.abs(y) > 20) break;
      path.push([x, y]);
    }
    return path;
  }, []);

  const drawPaths = useCallback((stepCount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    // Contour
    drawContourDPR(ctx, canvas, W, H, xRange, yRange, fn, 32);
    const levels = [0.5, 1, 2, 4, 8, 12, 16, 24, 32];
    drawContourLines(ctx, W, H, xRange, yRange, fn, levels);

    const configs: { path: [number, number][]; color: string; label: string }[] = [
      { path: computePath(0.005, stepCount), color: ACCENT_RED, label: '\u03B1 = 0.005 (too small)' },
      { path: computePath(0.08, stepCount), color: ACCENT_GREEN, label: '\u03B1 = 0.08 (good)' },
      { path: computePath(0.34, stepCount), color: ACCENT_AMBER, label: '\u03B1 = 0.34 (too large)' },
      { path: computePath(userLr, stepCount), color: ACCENT_PURPLE, label: `\u03B1 = ${userLr.toFixed(3)} (yours)` },
    ];

    for (const { path, color, label } of configs) {
      if (path.length < 2) continue;

      // Draw path
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const sx = toSx(path[i][0]);
        const sy = toSy(path[i][1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Trail dots
      for (let i = 0; i < path.length; i++) {
        const alpha = 0.3 + 0.7 * (i / path.length);
        drawDot(ctx, toSx(path[i][0]), toSy(path[i][1]), 3, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
      }

      // Current head
      const last = path[path.length - 1];
      drawDot(ctx, toSx(last[0]), toSy(last[1]), 5, color, 'white');

      void label;
    }

    // Legend
    ctx.font = 'bold 11px monospace';
    configs.forEach(({ color, label }, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(10, 12 + i * 18, 10, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(label, 26, 21 + i * 18);
    });
  }, [computePath, toSx, toSy, userLr]);

  useEffect(() => {
    if (!running) {
      drawPaths(80);
      return;
    }
    let step = 1;
    const animate = () => {
      drawPaths(step);
      step++;
      if (step > 80) {
        setRunning(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, drawPaths]);

  // Redraw when userLr changes
  useEffect(() => {
    if (!running) drawPaths(80);
  }, [userLr, running, drawPaths]);

  return (
    <InteractiveDemo title="Interactive: Learning rate comparison">
      <canvas
        ref={canvasRef}
        className="border border-white/[0.06] rounded-lg w-full"
        style={{ maxWidth: W }}
      />
      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <button
          onClick={() => setRunning(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
        >
          Animate
        </button>
        <div className="flex-1 min-w-[240px]">
          <ParameterSlider
            label="Your Learning Rate"
            value={userLr}
            min={0.001}
            max={0.4}
            step={0.001}
            onChange={setUserLr}
            format={(v) => v.toFixed(3)}
          />
        </div>
      </div>
      <p className="text-xs text-text-muted mt-2">
        Surface: f(x,y) = 3x{'\u00B2'} + 0.5y{'\u00B2'} (elongated bowl). Start: (-3, 3). Adjust the purple path's learning rate.
      </p>
    </InteractiveDemo>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 5: Momentum Demo
// ══════════════════════════════════════════════════════════════════════
function MomentumDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [beta, setBeta] = useState(0.9);
  const [running, setRunning] = useState(false);
  const animRef = useRef(0);
  const W = 600;
  const H = 450;
  const R = 4;
  const xRange: [number, number] = [-R, R];
  const yRange: [number, number] = [-R, R];

  // Narrow valley: f(x,y) = 10x^2 + 0.1y^2
  const fn = (x: number, y: number) => 10 * x * x + 0.1 * y * y;
  const grad = (x: number, y: number): [number, number] => [20 * x, 0.2 * y];

  const toSx = useCallback((x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W, []);
  const toSy = useCallback((y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H, []);

  const computeVanilla = useCallback((steps: number): [number, number][] => {
    const lr = 0.04;
    let x = 0.5, y = -3.5;
    const path: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = grad(x, y);
      x -= lr * gx;
      y -= lr * gy;
      path.push([x, y]);
    }
    return path;
  }, []);

  const computeMomentum = useCallback((steps: number, b: number): [number, number][] => {
    const lr = 0.04;
    let x = 0.5, y = -3.5;
    let vx = 0, vy = 0;
    const path: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = grad(x, y);
      vx = b * vx + gx;
      vy = b * vy + gy;
      x -= lr * vx;
      y -= lr * vy;
      path.push([x, y]);
    }
    return path;
  }, []);

  const draw = useCallback((stepCount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    drawContourDPR(ctx, canvas, W, H, xRange, yRange, fn, 20);
    const levels = [0.2, 0.5, 1, 2, 4, 8, 12, 16];
    drawContourLines(ctx, W, H, xRange, yRange, fn, levels);

    const vanilla = computeVanilla(stepCount);
    const momentum = computeMomentum(stepCount, beta);

    // Vanilla path
    ctx.strokeStyle = PRIMARY;
    ctx.lineWidth = 2;
    ctx.beginPath();
    vanilla.forEach(([x, y], i) => {
      const sx = toSx(x), sy = toSy(y);
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
    vanilla.forEach(([x, y]) => drawDot(ctx, toSx(x), toSy(y), 2.5, PRIMARY));
    const vLast = vanilla[vanilla.length - 1];
    drawDot(ctx, toSx(vLast[0]), toSy(vLast[1]), 5, PRIMARY, 'white');

    // Momentum path
    ctx.strokeStyle = ACCENT_AMBER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    momentum.forEach(([x, y], i) => {
      const sx = toSx(x), sy = toSy(y);
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
    momentum.forEach(([x, y]) => drawDot(ctx, toSx(x), toSy(y), 2.5, ACCENT_AMBER));
    const mLast = momentum[momentum.length - 1];
    drawDot(ctx, toSx(mLast[0]), toSy(mLast[1]), 5, ACCENT_AMBER, 'white');

    // Legend
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = PRIMARY;
    ctx.fillRect(10, 12, 10, 10);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('Vanilla GD', 26, 21);
    ctx.fillStyle = ACCENT_AMBER;
    ctx.fillRect(10, 30, 10, 10);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(`Momentum (\u03B2 = ${beta.toFixed(2)})`, 26, 39);
  }, [beta, computeVanilla, computeMomentum, toSx, toSy]);

  useEffect(() => {
    if (!running) {
      draw(100);
      return;
    }
    let step = 1;
    const animate = () => {
      draw(step);
      step += 1;
      if (step > 100) {
        setRunning(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, draw]);

  useEffect(() => {
    if (!running) draw(100);
  }, [beta, running, draw]);

  return (
    <InteractiveDemo title="Interactive: Momentum vs vanilla gradient descent">
      <canvas
        ref={canvasRef}
        className="border border-white/[0.06] rounded-lg w-full"
        style={{ maxWidth: W }}
      />
      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <button
          onClick={() => setRunning(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
        >
          Animate
        </button>
        <div className="flex-1 min-w-[200px]">
          <ParameterSlider
            label={'Momentum \u03B2'}
            value={beta}
            min={0}
            max={0.99}
            step={0.01}
            onChange={setBeta}
          />
        </div>
      </div>
      <p className="text-xs text-text-muted mt-2">
        Narrow valley: f(x,y) = 10x{'\u00B2'} + 0.1y{'\u00B2'}. Notice how vanilla GD oscillates across the narrow
        direction while momentum smooths the path and accelerates along the valley.
      </p>
    </InteractiveDemo>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 6: SGD vs Batch vs Mini-Batch
// ══════════════════════════════════════════════════════════════════════
function StochasticDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'all' | 'sgd' | 'batch' | 'mini'>('all');
  const [running, setRunning] = useState(false);
  const animRef = useRef(0);
  // Paths are computed on each render/animation frame
  const W = 600;
  const H = 450;
  const R = 4;
  const xRange: [number, number] = [-R, R];
  const yRange: [number, number] = [-R, R];

  const fn = (x: number, y: number) => x * x + y * y;
  const grad = (x: number, y: number): [number, number] => [2 * x, 2 * y];

  const toSx = useCallback((x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W, []);
  const toSy = useCallback((y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H, []);

  // Seeded random for reproducibility
  const seededRandom = useCallback((seed: number) => {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 4294967296;
    };
  }, []);

  const computePath = useCallback((noise: number, steps: number, seed: number): [number, number][] => {
    const lr = 0.08;
    let x = -3, y = 3;
    const path: [number, number][] = [[x, y]];
    const rng = seededRandom(seed);
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = grad(x, y);
      const nx = (rng() - 0.5) * 2 * noise;
      const ny = (rng() - 0.5) * 2 * noise;
      x -= lr * (gx + nx);
      y -= lr * (gy + ny);
      path.push([x, y]);
    }
    return path;
  }, [seededRandom]);

  const draw = useCallback((stepCount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    drawContourDPR(ctx, canvas, W, H, xRange, yRange, fn, 20);
    const levels = [1, 2, 4, 8, 12, 16];
    drawContourLines(ctx, W, H, xRange, yRange, fn, levels);

    const configs: { key: string; noise: number; color: string; label: string; seed: number }[] = [
      { key: 'batch', noise: 0, color: ACCENT_GREEN, label: 'Batch GD (smooth)', seed: 42 },
      { key: 'mini', noise: 2, color: ACCENT_AMBER, label: 'Mini-Batch (medium noise)', seed: 123 },
      { key: 'sgd', noise: 5, color: ACCENT_RED, label: 'SGD (high noise)', seed: 77 },
    ];

    for (const { key, noise, color, label, seed } of configs) {
      if (mode !== 'all' && mode !== key) continue;
      const path = computePath(noise, stepCount, seed);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      path.forEach(([x, y], i) => {
        const sx = toSx(x), sy = toSy(y);
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      const last = path[path.length - 1];
      drawDot(ctx, toSx(last[0]), toSy(last[1]), 5, color, 'white');
      void label;
    }

    // Legend
    ctx.font = 'bold 11px monospace';
    let ly = 12;
    for (const { key, color, label } of configs) {
      if (mode !== 'all' && mode !== key) continue;
      ctx.fillStyle = color;
      ctx.fillRect(10, ly, 10, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(label, 26, ly + 9);
      ly += 18;
    }
  }, [mode, computePath, toSx, toSy]);

  useEffect(() => {
    if (!running) {
      draw(80);
      return;
    }
    let step = 1;
    const animate = () => {
      draw(step);
      step++;
      if (step > 80) {
        setRunning(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, draw]);

  useEffect(() => {
    if (!running) draw(80);
  }, [mode, running, draw]);


  return (
    <InteractiveDemo title="Interactive: SGD vs Batch vs Mini-Batch">
      <canvas
        ref={canvasRef}
        className="border border-white/[0.06] rounded-lg w-full"
        style={{ maxWidth: W }}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {([['all', 'Show All'], ['batch', 'Batch'], ['mini', 'Mini-Batch'], ['sgd', 'SGD']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === key
                ? 'bg-primary text-white'
                : 'bg-surface-lighter text-text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setRunning(true)}
          className="px-4 py-1.5 rounded-lg bg-surface-lighter text-text text-sm font-medium hover:bg-border/60 transition-colors ml-auto"
        >
          Animate
        </button>
      </div>
      <p className="text-xs text-text-muted mt-2">
        All three converge to the same minimum. SGD adds the most noise (simulating single-sample gradients),
        mini-batch has moderate noise, and batch GD follows the true gradient exactly.
      </p>
    </InteractiveDemo>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 7: Adam Optimizer Comparison
// ══════════════════════════════════════════════════════════════════════
function AdamDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const animRef = useRef(0);
  const W = 600;
  const H = 500;
  // Rosenbrock-like: f(x,y) = (1-x)^2 + 100*(y-x^2)^2
  // Use a tamer version for visualization
  const scale = 5;
  const xRange: [number, number] = [-2, 2];
  const yRange: [number, number] = [-1, 3];

  const fn = (x: number, y: number) => (1 - x) * (1 - x) + scale * (y - x * x) * (y - x * x);
  const gradFn = (x: number, y: number): [number, number] => {
    const dx = -2 * (1 - x) + scale * 2 * (y - x * x) * (-2 * x);
    const dy = scale * 2 * (y - x * x);
    return [dx, dy];
  };

  const toSx = useCallback((x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W, []);
  const toSy = useCallback((y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H, []);

  const computeSGD = useCallback((steps: number): [number, number][] => {
    const lr = 0.002;
    let x = -1.5, y = 2.5;
    const path: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = gradFn(x, y);
      x -= lr * gx;
      y -= lr * gy;
      // Clip
      x = Math.max(xRange[0], Math.min(xRange[1], x));
      y = Math.max(yRange[0], Math.min(yRange[1], y));
      path.push([x, y]);
    }
    return path;
  }, []);

  const computeMomentum = useCallback((steps: number): [number, number][] => {
    const lr = 0.002;
    const beta = 0.9;
    let x = -1.5, y = 2.5;
    let vx = 0, vy = 0;
    const path: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = gradFn(x, y);
      vx = beta * vx + gx;
      vy = beta * vy + gy;
      x -= lr * vx;
      y -= lr * vy;
      x = Math.max(xRange[0], Math.min(xRange[1], x));
      y = Math.max(yRange[0], Math.min(yRange[1], y));
      path.push([x, y]);
    }
    return path;
  }, []);

  const computeAdam = useCallback((steps: number): [number, number][] => {
    const lr = 0.05;
    const b1 = 0.9, b2 = 0.999, eps = 1e-8;
    let x = -1.5, y = 2.5;
    let mx = 0, my = 0, vx = 0, vy = 0;
    const path: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      const t = i + 1;
      const [gx, gy] = gradFn(x, y);
      mx = b1 * mx + (1 - b1) * gx;
      my = b1 * my + (1 - b1) * gy;
      vx = b2 * vx + (1 - b2) * gx * gx;
      vy = b2 * vy + (1 - b2) * gy * gy;
      const mxh = mx / (1 - Math.pow(b1, t));
      const myh = my / (1 - Math.pow(b1, t));
      const vxh = vx / (1 - Math.pow(b2, t));
      const vyh = vy / (1 - Math.pow(b2, t));
      x -= lr * mxh / (Math.sqrt(vxh) + eps);
      y -= lr * myh / (Math.sqrt(vyh) + eps);
      x = Math.max(xRange[0], Math.min(xRange[1], x));
      y = Math.max(yRange[0], Math.min(yRange[1], y));
      path.push([x, y]);
    }
    return path;
  }, []);

  const draw = useCallback((stepCount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    // Contour - use log scale for Rosenbrock
    const logFn = (x: number, y: number) => Math.log(1 + fn(x, y));
    drawContourDPR(ctx, canvas, W, H, xRange, yRange, logFn, Math.log(1 + 50));
    const levels = [0.1, 0.5, 1, 2, 3, 5, 10, 20, 40].map((v) => Math.log(1 + v));
    drawContourLines(ctx, W, H, xRange, yRange, logFn, levels);

    // Mark the minimum at (1, 1)
    drawDot(ctx, toSx(1), toSy(1), 4, 'white');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('min (1,1)', toSx(1) + 8, toSy(1) + 4);

    const configs: { compute: (s: number) => [number, number][]; color: string; label: string }[] = [
      { compute: computeSGD, color: PRIMARY, label: 'SGD' },
      { compute: computeMomentum, color: ACCENT_AMBER, label: 'Momentum' },
      { compute: computeAdam, color: ACCENT_GREEN, label: 'Adam' },
    ];

    for (const { compute, color, label } of configs) {
      const path = compute(stepCount);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      path.forEach(([x, y], i) => {
        const sx = toSx(x), sy = toSy(y);
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      });
      ctx.stroke();

      // Dots
      for (let i = 0; i < path.length; i += Math.max(1, Math.floor(path.length / 30))) {
        drawDot(ctx, toSx(path[i][0]), toSy(path[i][1]), 2.5, color);
      }

      const last = path[path.length - 1];
      drawDot(ctx, toSx(last[0]), toSy(last[1]), 5, color, 'white');

      void label;
    }

    // Start
    drawDot(ctx, toSx(-1.5), toSy(2.5), 6, 'white', MUTED);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('start', toSx(-1.5) + 10, toSy(2.5) + 4);

    // Legend
    ctx.font = 'bold 11px monospace';
    configs.forEach(({ color, label }, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(10, 12 + i * 18, 10, 10);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(label, 26, 21 + i * 18);
    });
  }, [computeSGD, computeMomentum, computeAdam, toSx, toSy]);

  useEffect(() => {
    if (!running) {
      draw(300);
      return;
    }
    let step = 1;
    const animate = () => {
      draw(step);
      step += 2;
      if (step > 300) {
        setRunning(false);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, draw]);

  return (
    <InteractiveDemo title="Interactive: SGD vs Momentum vs Adam on Rosenbrock">
      <canvas
        ref={canvasRef}
        className="border border-white/[0.06] rounded-lg w-full"
        style={{ maxWidth: W }}
      />
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setRunning(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
        >
          Animate
        </button>
      </div>
      <p className="text-xs text-text-muted mt-2">
        Rosenbrock-like surface: f(x,y) = (1-x){'\u00B2'} + 5(y-x{'\u00B2'}){'\u00B2'}. The minimum is at (1,1). Adam adapts
        its step size per-dimension, navigating the curved valley much more effectively.
      </p>
    </InteractiveDemo>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function GradientDescentMathPage() {
  return (
    <MathLayout
      title="Gradient Descent"
      subtitle="The optimization algorithm that powers all of deep learning -- from derivatives to Adam, with interactive visualizations at every step."
    >
      {/* ── Section 1: What is a Derivative? ─────────────────────────── */}
      <Section title="1. What is a Derivative?">
        <Prose>
          <p>
            Before we can understand gradient descent, we need to understand the <strong>derivative</strong>.
            The derivative of a function at a point tells us the <em>rate of change</em> -- how much the
            output changes when we nudge the input by a tiny amount.
          </p>
          <p>
            For a function f(x), the derivative at point x is defined as the limit:
          </p>
        </Prose>

        <Eq block>
          <span className="text-accent-purple">f'(x)</span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">lim</span>
          <sub className="text-text-muted">{'\u0394x\u21920'}</sub>
          <span className="text-text-muted"> </span>
          <span className="text-accent-purple">[f(x + {'\u0394'}x) - f(x)]</span>
          <span className="text-text-muted"> / </span>
          <span className="text-accent-purple">{'\u0394'}x</span>
        </Eq>

        <Prose>
          <p>
            Geometrically, this is the slope of the <strong>tangent line</strong> to the curve at that point.
            We start with two points (a secant line) and shrink the gap until it becomes the tangent.
            For <Eq>f(x) = x{'\u00B2'}</Eq>, the derivative is <Eq>f'(x) = 2x</Eq>.
          </p>
          <p>
            <strong>Try it:</strong> Drag the green point along the curve and watch the tangent line.
            Then shrink {'\u0394'}x with the slider to see the secant (purple) approach the tangent (green).
          </p>
        </Prose>

        <DerivativeDemo />

        <Prose>
          <p>
            The derivative is positive when the function is increasing (slope points up), negative when
            decreasing (slope points down), and zero at a minimum or maximum. This is the key insight
            for optimization: <strong>the derivative tells us which direction to move to decrease the function</strong>.
          </p>
        </Prose>
      </Section>

      {/* ── Section 2: Partial Derivatives & The Gradient ─────────── */}
      <Section title="2. Partial Derivatives & The Gradient">
        <Prose>
          <p>
            In machine learning, we rarely optimize functions of a single variable. Our loss functions
            depend on thousands or millions of parameters. We need to extend the idea of a derivative
            to multiple dimensions.
          </p>
          <p>
            A <strong>partial derivative</strong> measures the rate of change with respect to
            <em> one variable</em>, holding all others constant. For f(x, y) = x{'\u00B2'} + y{'\u00B2'}:
          </p>
        </Prose>

        <Eq block>
          <span className="text-primary-light">{'\u2202'}f/{'\u2202'}x</span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">2x</span>
          <span className="text-text-muted mx-6">{'  '}</span>
          <span className="text-accent-amber">{'\u2202'}f/{'\u2202'}y</span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">2y</span>
        </Eq>

        <Prose>
          <p>
            The <strong>gradient</strong> is the vector of all partial derivatives. It points in the
            direction of <em>steepest ascent</em> -- the direction that increases the function the fastest:
          </p>
        </Prose>

        <Eq block>
          <span className="text-accent-amber">{'\u2207'}f</span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">[</span>
          <span className="text-primary-light">{'\u2202'}f/{'\u2202'}x</span>
          <span className="text-text-muted">, </span>
          <span className="text-accent-amber">{'\u2202'}f/{'\u2202'}y</span>
          <span className="text-text">]</span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">[2x, 2y]</span>
        </Eq>

        <Prose>
          <p>
            The magnitude of the gradient tells us how steep the surface is. Near the minimum (the bowl's
            bottom), the gradient is small. Far from the minimum, it's large.
          </p>
          <p>
            <strong>Click on the contour plot</strong> below to see the gradient vector at any point.
            Notice how the arrows always point away from the center (the minimum) and grow longer as
            you move further out.
          </p>
        </Prose>

        <GradientDemo />
      </Section>

      {/* ── Section 3: The Gradient Descent Update Rule ───────────── */}
      <Section title="3. The Gradient Descent Update Rule">
        <Prose>
          <p>
            Now the key idea: if the gradient points in the direction of steepest <em>ascent</em>,
            then the <strong>negative gradient</strong> points in the direction of steepest <em>descent</em>.
            To minimize a function, we take steps in the negative gradient direction:
          </p>
        </Prose>

        <Eq block>
          <span className="text-accent-green">{'\u03B8'}<sub>new</sub></span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">{'\u03B8'}<sub>old</sub></span>
          <span className="text-text-muted"> - </span>
          <span className="text-accent-amber">{'\u03B1'}</span>
          <span className="text-text-muted"> {'\u00D7'} </span>
          <span className="text-primary-light">{'\u2207'}f({'\u03B8'}<sub>old</sub>)</span>
        </Eq>

        <Prose>
          <p>
            Here, <Eq>{'\u03B1'}</Eq> (alpha) is the <strong>learning rate</strong> -- it controls how
            big each step is. <Eq>{'\u03B8'}</Eq> represents our parameters, and <Eq>{'\u2207'}f({'\u03B8'})</Eq> is
            the gradient of the loss function at the current parameters.
          </p>
          <p>
            The algorithm is beautifully simple: <strong>compute the gradient, take a step opposite to it,
            repeat</strong>. Each step reduces the loss (if the learning rate is small enough), eventually
            converging to a minimum.
          </p>
          <p>
            <strong>Try it:</strong> Press "Take Step" to watch gradient descent minimize f(x) = x{'\u00B2'}.
            Each step shows the exact numbers in the update equation. Adjust the learning rate to see
            how it affects convergence.
          </p>
        </Prose>

        <GDStepDemo />

        <Prose>
          <p>
            Notice how the steps get smaller as we approach the minimum. This is because the gradient
            itself shrinks near the minimum (the slope flattens out). With a fixed learning rate, GD
            naturally takes smaller steps as it converges -- a desirable property.
          </p>
        </Prose>
      </Section>

      {/* ── Section 4: Learning Rate Effects ──────────────────────── */}
      <Section title="4. Learning Rate Effects">
        <Prose>
          <p>
            The learning rate <Eq>{'\u03B1'}</Eq> is arguably the most important hyperparameter in
            deep learning. Setting it correctly is crucial:
          </p>
          <p>
            <strong>Too small</strong> ({'\u03B1'} = 0.005): The optimizer barely moves. Training takes forever
            and may get stuck in a poor local minimum. You'll see the red path barely budge.
          </p>
          <p>
            <strong>Just right</strong> ({'\u03B1'} = 0.08): Steady, efficient convergence. The green path
            moves smoothly toward the minimum without oscillating.
          </p>
          <p>
            <strong>Too large</strong> ({'\u03B1'} = 0.34): The optimizer overshoots, oscillates wildly, and
            may even diverge. The amber path bounces around erratically.
          </p>
          <p>
            <strong>Adjust the purple path's learning rate</strong> with the slider and find the sweet spot.
          </p>
        </Prose>

        <LearningRateDemo />

        <Prose>
          <p>
            In practice, finding the right learning rate involves experimentation. Common strategies
            include learning rate schedules (starting high and decaying), warmup periods, and
            adaptive methods like Adam that adjust the rate automatically.
          </p>
        </Prose>
      </Section>

      {/* ── Section 5: Momentum ──────────────────────────────────── */}
      <Section title="5. Momentum">
        <Prose>
          <p>
            Standard gradient descent has a problem: on surfaces with narrow valleys (common in
            deep learning), it oscillates back and forth across the valley instead of rolling
            smoothly along it. <strong>Momentum</strong> fixes this with a physics analogy.
          </p>
          <p>
            Think of a ball rolling downhill. It doesn't just follow the slope at each instant --
            it accumulates velocity. Past gradients influence the current direction, smoothing
            out the oscillations:
          </p>
        </Prose>

        <Eq block>
          <span className="text-accent-amber">v</span>
          <span className="text-text-muted"> = </span>
          <span className="text-accent-purple">{'\u03B2'}</span>
          <span className="text-text-muted"> {'\u00D7'} </span>
          <span className="text-accent-amber">v</span>
          <span className="text-text-muted"> + </span>
          <span className="text-primary-light">{'\u2207'}f({'\u03B8'})</span>
        </Eq>
        <Eq block>
          <span className="text-accent-green">{'\u03B8'}</span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">{'\u03B8'}</span>
          <span className="text-text-muted"> - </span>
          <span className="text-accent-amber">{'\u03B1'}</span>
          <span className="text-text-muted"> {'\u00D7'} </span>
          <span className="text-accent-amber">v</span>
        </Eq>

        <Prose>
          <p>
            The velocity <Eq>v</Eq> is an exponential moving average of past gradients.
            The momentum coefficient <Eq>{'\u03B2'}</Eq> (typically 0.9) controls how much history
            to remember. Higher {'\u03B2'} means more smoothing.
          </p>
          <p>
            <strong>Watch the comparison:</strong> On this narrow valley surface, vanilla GD (blue)
            zig-zags wildly, while momentum (amber) cuts through smoothly. Try adjusting {'\u03B2'}.
          </p>
        </Prose>

        <MomentumDemo />

        <Prose>
          <p>
            With {'\u03B2'} = 0, momentum reduces to vanilla GD. As you increase it toward 0.99,
            the ball carries more inertia. Too much momentum and it might overshoot, but the
            sweet spot around 0.9 typically works well. The oscillating component cancels out over
            time while the consistent downhill component accumulates.
          </p>
        </Prose>
      </Section>

      {/* ── Section 6: Stochastic vs Batch vs Mini-Batch ──────────── */}
      <Section title="6. Stochastic vs Batch vs Mini-Batch Gradient Descent">
        <Prose>
          <p>
            So far we've assumed we compute the gradient over the <em>entire</em> dataset. In practice,
            datasets have millions of examples. Computing the full gradient is expensive. There are
            three approaches:
          </p>
          <p>
            <strong>Batch GD:</strong> Use all data for each gradient step. Smooth, exact gradients but
            very slow per step. The green path is perfectly smooth.
          </p>
          <p>
            <strong>Stochastic GD (SGD):</strong> Use a single random sample for each step. Very noisy
            gradients (the red path zigzags), but many more steps per second. The noise can actually
            help escape local minima.
          </p>
          <p>
            <strong>Mini-Batch GD:</strong> Use a small batch (32-512 samples) for each step. A practical
            compromise -- the amber path has moderate noise but converges reliably.
          </p>
        </Prose>

        <StochasticDemo />

        <Prose>
          <p>
            In modern deep learning, mini-batch SGD is the standard. Batch sizes of 32-256 provide
            a good balance of gradient accuracy and computational efficiency. The noise from stochastic
            estimation acts as a form of regularization, often improving generalization.
          </p>
        </Prose>
      </Section>

      {/* ── Section 7: Adam Optimizer ─────────────────────────────── */}
      <Section title="7. The Adam Optimizer">
        <Prose>
          <p>
            <strong>Adam</strong> (Adaptive Moment Estimation) is the most widely used optimizer in deep
            learning. It combines two powerful ideas: <strong>momentum</strong> (tracking the direction
            of past gradients) and <strong>adaptive learning rates</strong> (giving each parameter its
            own learning rate based on gradient history).
          </p>
          <p>
            Adam maintains two running averages for each parameter:
          </p>
        </Prose>

        <Eq block>
          <span className="text-accent-amber">m</span>
          <span className="text-text-muted"> = </span>
          <span className="text-accent-purple">{'\u03B2'}<sub>1</sub></span>
          <span className="text-text-muted"> {'\u00D7'} </span>
          <span className="text-accent-amber">m</span>
          <span className="text-text-muted"> + (1 - </span>
          <span className="text-accent-purple">{'\u03B2'}<sub>1</sub></span>
          <span className="text-text-muted">) {'\u00D7'} </span>
          <span className="text-primary-light">g</span>
          <span className="text-text-muted ml-8"> (first moment / mean)</span>
        </Eq>
        <Eq block>
          <span className="text-accent-green">v</span>
          <span className="text-text-muted"> = </span>
          <span className="text-accent-purple">{'\u03B2'}<sub>2</sub></span>
          <span className="text-text-muted"> {'\u00D7'} </span>
          <span className="text-accent-green">v</span>
          <span className="text-text-muted"> + (1 - </span>
          <span className="text-accent-purple">{'\u03B2'}<sub>2</sub></span>
          <span className="text-text-muted">) {'\u00D7'} </span>
          <span className="text-primary-light">g{'\u00B2'}</span>
          <span className="text-text-muted ml-8"> (second moment / variance)</span>
        </Eq>

        <Prose>
          <p>
            The update divides the momentum term by the square root of the variance, effectively
            normalizing each parameter's step:
          </p>
        </Prose>

        <Eq block>
          <span className="text-accent-green">{'\u03B8'}</span>
          <span className="text-text-muted"> = </span>
          <span className="text-text">{'\u03B8'}</span>
          <span className="text-text-muted"> - </span>
          <span className="text-accent-amber">{'\u03B1'}</span>
          <span className="text-text-muted"> {'\u00D7'} </span>
          <span className="text-accent-amber">m&#x0302;</span>
          <span className="text-text-muted"> / (</span>
          <span className="text-accent-green">{'\u221A'}v&#x0302;</span>
          <span className="text-text-muted"> + {'\u03B5'})</span>
        </Eq>

        <Prose>
          <p>
            Parameters with consistently large gradients get smaller effective learning rates (preventing
            overshooting), while parameters with small or rare gradients get larger rates (helping them
            learn). The {'\u03B5'} prevents division by zero.
          </p>
          <p>
            Default hyperparameters (<Eq>{'\u03B2'}<sub>1</sub> = 0.9</Eq>, <Eq>{'\u03B2'}<sub>2</sub> = 0.999</Eq>, <Eq>{'\u03B5'} = 10<sup>-8</sup></Eq>)
            work well across most problems. This "just works" quality is why Adam is the go-to optimizer.
          </p>
          <p>
            <strong>Watch the comparison</strong> on the Rosenbrock function -- a notoriously difficult
            optimization surface with a curved, narrow valley. Adam (green) navigates it far more
            efficiently than SGD (blue) or even Momentum (amber).
          </p>
        </Prose>

        <AdamDemo />

        <Prose>
          <p>
            Notice how Adam quickly finds and follows the curved valley, while SGD barely moves and
            Momentum overshoots. Adam's adaptive per-parameter learning rates let it handle the
            vastly different curvatures along the x and y directions simultaneously.
          </p>
          <p>
            In practice, Adam is the default choice for training neural networks. While SGD with
            momentum can sometimes find better solutions (especially for image classification),
            Adam's robust default performance and minimal tuning requirements make it the
            standard starting point.
          </p>
        </Prose>
      </Section>

      {/* ── Summary ───────────────────────────────────────────────── */}
      <Section title="Summary: The Optimization Landscape">
        <Prose>
          <p>
            We've built up the full picture of gradient-based optimization:
          </p>
          <p>
            <strong>Derivatives</strong> tell us the slope at a point. <strong>Gradients</strong> extend
            this to multiple dimensions, pointing toward steepest ascent. <strong>Gradient descent</strong>
            {' '}steps opposite to the gradient, iteratively reducing the loss.
          </p>
          <p>
            The <strong>learning rate</strong> controls step size -- too small and we're slow, too large
            and we diverge. <strong>Momentum</strong> smooths oscillations by accumulating past gradients.
            <strong> Mini-batch SGD</strong> makes training practical at scale by estimating gradients from
            subsets of data.
          </p>
          <p>
            <strong>Adam</strong> combines momentum with adaptive per-parameter learning rates, making it
            the workhorse of modern deep learning. Every time you train a neural network, these
            algorithms are working under the hood, navigating a loss surface with millions of dimensions
            to find good parameters.
          </p>
        </Prose>

        <Eq block>
          <span className="text-text-muted">The gradient is all you need: </span>
          <span className="text-accent-green">{'\u03B8'}</span>
          <span className="text-text-muted"> {'\u2190'} </span>
          <span className="text-text">{'\u03B8'}</span>
          <span className="text-text-muted"> - </span>
          <span className="text-accent-amber">{'\u03B1'}</span>
          <span className="text-text-muted"> {'\u00D7'} </span>
          <span className="text-primary-light">{'\u2207'}L({'\u03B8'})</span>
        </Eq>
      </Section>
    </MathLayout>
  );
}
