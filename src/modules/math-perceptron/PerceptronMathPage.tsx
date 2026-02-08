import { useState, useRef, useEffect, useCallback } from 'react';
import { MathLayout } from '../../components/math/MathLayout';
import { Section } from '../../components/math/Section';
import { Eq } from '../../components/math/Eq';
import { Prose } from '../../components/math/Prose';
import { InteractiveDemo } from '../../components/math/InteractiveDemo';
import { ParameterSlider } from '../../components/shared/ParameterSlider';

/* ------------------------------------------------------------------ */
/*  Theme constants                                                    */
/* ------------------------------------------------------------------ */
const COLORS = {
  surface: '#0f172a',
  surfaceLight: '#1e293b',
  surfaceLighter: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  accentPurple: '#8b5cf6',
  border: '#475569',
  gridLine: 'rgba(71, 85, 105, 0.3)',
  positive: '#3b82f6',
  negative: '#ef4444',
  green: '#22c55e',
};

const fmt = (v: number) => v.toFixed(2);

/* ------------------------------------------------------------------ */
/*  Helper: DPR-aware canvas setup                                     */
/* ------------------------------------------------------------------ */
function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  1. Neuron SVG Diagram                                              */
/* ------------------------------------------------------------------ */
function NeuronDiagram({
  x1,
  x2,
  w1,
  w2,
  bias,
  z,
  output,
}: {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  bias: number;
  z: number;
  output: number;
}) {
  const inputY1 = 50;
  const inputY2 = 150;
  const biasY = 200;
  const sumX = 200;
  const sumY = 110;
  const outX = 340;
  const outY = 110;

  return (
    <svg
      viewBox="0 0 420 240"
      className="w-full max-w-md mx-auto"
      aria-label="Perceptron neuron diagram"
    >
      {/* Connection lines */}
      <line
        x1={60}
        y1={inputY1}
        x2={sumX - 30}
        y2={sumY}
        stroke={COLORS.primaryLight}
        strokeWidth={2}
        opacity={0.7}
      />
      <line
        x1={60}
        y1={inputY2}
        x2={sumX - 30}
        y2={sumY}
        stroke={COLORS.primaryLight}
        strokeWidth={2}
        opacity={0.7}
      />
      <line
        x1={60}
        y1={biasY}
        x2={sumX - 30}
        y2={sumY + 15}
        stroke={COLORS.accentPurple}
        strokeWidth={2}
        opacity={0.7}
        strokeDasharray="4 3"
      />
      <line
        x1={sumX + 30}
        y1={sumY}
        x2={outX - 30}
        y2={outY}
        stroke={COLORS.text}
        strokeWidth={2}
        opacity={0.7}
      />

      {/* Weight labels on edges */}
      <text
        x={110}
        y={inputY1 + 18}
        fill={COLORS.primaryLight}
        fontSize={12}
        fontFamily="monospace"
      >
        w1={fmt(w1)}
      </text>
      <text x={110} y={inputY2 - 6} fill={COLORS.primaryLight} fontSize={12} fontFamily="monospace">
        w2={fmt(w2)}
      </text>

      {/* Input nodes */}
      <circle
        cx={40}
        cy={inputY1}
        r={18}
        fill={COLORS.surfaceLight}
        stroke={COLORS.border}
        strokeWidth={1.5}
      />
      <text
        x={40}
        y={inputY1 + 4}
        textAnchor="middle"
        fill={COLORS.text}
        fontSize={12}
        fontFamily="monospace"
      >
        {fmt(x1)}
      </text>
      <text x={40} y={inputY1 - 24} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>
        x1
      </text>

      <circle
        cx={40}
        cy={inputY2}
        r={18}
        fill={COLORS.surfaceLight}
        stroke={COLORS.border}
        strokeWidth={1.5}
      />
      <text
        x={40}
        y={inputY2 + 4}
        textAnchor="middle"
        fill={COLORS.text}
        fontSize={12}
        fontFamily="monospace"
      >
        {fmt(x2)}
      </text>
      <text x={40} y={inputY2 - 24} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>
        x2
      </text>

      {/* Bias node */}
      <circle
        cx={40}
        cy={biasY}
        r={14}
        fill={COLORS.surfaceLight}
        stroke={COLORS.accentPurple}
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      <text
        x={40}
        y={biasY + 4}
        textAnchor="middle"
        fill={COLORS.accentPurple}
        fontSize={11}
        fontFamily="monospace"
      >
        {fmt(bias)}
      </text>
      <text x={40} y={biasY - 20} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>
        b
      </text>

      {/* Sum node */}
      <circle
        cx={sumX}
        cy={sumY}
        r={28}
        fill={COLORS.surfaceLight}
        stroke={COLORS.primary}
        strokeWidth={2}
      />
      <text x={sumX} y={sumY - 4} textAnchor="middle" fill={COLORS.textMuted} fontSize={9}>
        sum
      </text>
      <text
        x={sumX}
        y={sumY + 12}
        textAnchor="middle"
        fill={COLORS.text}
        fontSize={12}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {fmt(z)}
      </text>

      {/* Arrow */}
      <polygon
        points={`${outX - 32},${outY - 4} ${outX - 32},${outY + 4} ${outX - 24},${outY}`}
        fill={COLORS.text}
        opacity={0.7}
      />
      <text
        x={(sumX + outX) / 2 + 2}
        y={outY - 14}
        textAnchor="middle"
        fill={COLORS.textMuted}
        fontSize={9}
      >
        activation
      </text>

      {/* Output node */}
      <circle
        cx={outX}
        cy={outY}
        r={24}
        fill={output >= 0.5 ? COLORS.positive : COLORS.negative}
        opacity={0.25}
      />
      <circle
        cx={outX}
        cy={outY}
        r={24}
        fill="none"
        stroke={output >= 0.5 ? COLORS.positive : COLORS.negative}
        strokeWidth={2}
      />
      <text x={outX} y={outY - 6} textAnchor="middle" fill={COLORS.textMuted} fontSize={9}>
        output
      </text>
      <text
        x={outX}
        y={outY + 12}
        textAnchor="middle"
        fill={COLORS.text}
        fontSize={14}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {fmt(output)}
      </text>

      {/* Labels at very right */}
      <text
        x={outX + 34}
        y={outY + 4}
        fill={output >= 0.5 ? COLORS.positive : COLORS.negative}
        fontSize={11}
        fontWeight="bold"
      >
        {output >= 0.5 ? 'Class 1' : 'Class 0'}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Activation Function Canvas                                      */
/* ------------------------------------------------------------------ */
const ACTIVATION_FNS = {
  step: { label: 'Step Function', fn: (z: number) => (z >= 0 ? 1 : 0) },
  sigmoid: { label: 'Sigmoid', fn: (z: number) => 1 / (1 + Math.exp(-z)) },
  relu: { label: 'ReLU', fn: (z: number) => Math.max(0, z) },
} as const;

type ActivationType = keyof typeof ACTIVATION_FNS;

function ActivationCanvas({
  activationType,
  zValue,
}: {
  activationType: ActivationType;
  zValue: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 400;
  const H = 260;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    const fn = ACTIVATION_FNS[activationType].fn;
    const rangeX = activationType === 'relu' ? [-2, 6] : [-6, 6];
    const rangeY = activationType === 'relu' ? [-0.5, 4] : [-0.2, 1.3];
    const pad = { l: 44, r: 16, t: 16, b: 34 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    const toX = (v: number) => pad.l + ((v - rangeX[0]) / (rangeX[1] - rangeX[0])) * pw;
    const toY = (v: number) => pad.t + (1 - (v - rangeY[0]) / (rangeY[1] - rangeY[0])) * ph;

    // Background
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let gx = Math.ceil(rangeX[0]); gx <= rangeX[1]; gx++) {
      const px = toX(gx);
      ctx.beginPath();
      ctx.moveTo(px, pad.t);
      ctx.lineTo(px, H - pad.b);
      ctx.stroke();
    }
    for (let gy = Math.ceil(rangeY[0] * 2) / 2; gy <= rangeY[1]; gy += 0.5) {
      const py = toY(gy);
      ctx.beginPath();
      ctx.moveTo(pad.l, py);
      ctx.lineTo(W - pad.r, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    // X axis at y=0
    const y0 = toY(0);
    ctx.beginPath();
    ctx.moveTo(pad.l, y0);
    ctx.lineTo(W - pad.r, y0);
    ctx.stroke();
    // Y axis at x=0
    const x0 = toX(0);
    ctx.beginPath();
    ctx.moveTo(x0, pad.t);
    ctx.lineTo(x0, H - pad.b);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    for (let gx = Math.ceil(rangeX[0]); gx <= rangeX[1]; gx += 2) {
      ctx.fillText(String(gx), toX(gx), H - pad.b + 16);
    }
    ctx.textAlign = 'right';
    for (let gy = 0; gy <= rangeY[1]; gy += activationType === 'relu' ? 1 : 0.5) {
      ctx.fillText(gy.toFixed(1), pad.l - 6, toY(gy) + 4);
    }

    // Function curve
    ctx.strokeStyle = COLORS.primaryLight;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const zv = rangeX[0] + (i / steps) * (rangeX[1] - rangeX[0]);
      const yv = fn(zv);
      const px = toX(zv);
      const py = toY(Math.max(rangeY[0], Math.min(rangeY[1], yv)));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Moving dot at z
    const clampedZ = Math.max(rangeX[0], Math.min(rangeX[1], zValue));
    const dotVal = fn(clampedZ);
    const dotX = toX(clampedZ);
    const dotY = toY(Math.max(rangeY[0], Math.min(rangeY[1], dotVal)));

    // Dashed crosshair lines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.textMuted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dotX, y0);
    ctx.lineTo(dotX, dotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, dotY);
    ctx.lineTo(dotX, dotY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot glow
    const gradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 16);
    gradient.addColorStop(0, 'rgba(59,130,246,0.4)');
    gradient.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(dotX - 16, dotY - 16, 32, 32);

    // Dot
    ctx.fillStyle = COLORS.text;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Value label
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    const labelX = dotX + 10;
    const labelY = dotY - 10;
    ctx.fillText(`(${fmt(clampedZ)}, ${fmt(dotVal)})`, labelX, labelY);

    // Axis titles
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('z (weighted sum)', W / 2, H - 2);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('output', 0, 0);
    ctx.restore();
  }, [activationType, zValue]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-white/[0.06] rounded-lg w-full"
      style={{ maxWidth: W, aspectRatio: `${W}/${H}` }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  3. Decision Boundary Canvas                                        */
/* ------------------------------------------------------------------ */
function DecisionBoundaryCanvas({
  w1,
  w2,
  bias,
  points,
}: {
  w1: number;
  w2: number;
  bias: number;
  points: { x: number; y: number; label: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 440;
  const H = 400;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    const pad = { l: 44, r: 20, t: 20, b: 38 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;
    const range = [-0.5, 1.5]; // x1 and x2 axis range
    const span = range[1] - range[0];

    const toX = (v: number) => pad.l + ((v - range[0]) / span) * pw;
    const toY = (v: number) => pad.t + (1 - (v - range[0]) / span) * ph;

    // Fill decision regions pixel by pixel (half resolution for speed)
    const step = 2;
    for (let px = pad.l; px < W - pad.r; px += step) {
      for (let py = pad.t; py < H - pad.b; py += step) {
        const x1Val = range[0] + ((px - pad.l) / pw) * span;
        const x2Val = range[0] + (1 - (py - pad.t) / ph) * span;
        const z = w1 * x1Val + w2 * x2Val + bias;
        const activated = z >= 0 ? 1 : 0;
        ctx.fillStyle = activated === 1 ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.10)';
        ctx.fillRect(px, py, step, step);
      }
    }

    // Grid
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let g = -0.5; g <= 1.5; g += 0.25) {
      const px = toX(g);
      const py = toY(g);
      ctx.beginPath();
      ctx.moveTo(px, pad.t);
      ctx.lineTo(px, H - pad.b);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad.l, py);
      ctx.lineTo(W - pad.r, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    const x0 = toX(0);
    const y0 = toY(0);
    ctx.beginPath();
    ctx.moveTo(pad.l, y0);
    ctx.lineTo(W - pad.r, y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, pad.t);
    ctx.lineTo(x0, H - pad.b);
    ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let g = 0; g <= 1; g += 0.5) {
      ctx.fillText(g.toFixed(1), toX(g), H - pad.b + 14);
    }
    ctx.textAlign = 'right';
    for (let g = 0; g <= 1; g += 0.5) {
      ctx.fillText(g.toFixed(1), pad.l - 6, toY(g) + 4);
    }

    // Decision boundary line: w1*x1 + w2*x2 + b = 0
    // Solve for x2 = -(w1*x1 + b) / w2
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    if (Math.abs(w2) > 0.001) {
      const x1a = range[0];
      const x1b = range[1];
      const x2a = -(w1 * x1a + bias) / w2;
      const x2b = -(w1 * x1b + bias) / w2;
      ctx.beginPath();
      ctx.moveTo(toX(x1a), toY(x2a));
      ctx.lineTo(toX(x1b), toY(x2b));
      ctx.stroke();
    } else if (Math.abs(w1) > 0.001) {
      // Vertical line: x1 = -b / w1
      const xVal = -bias / w1;
      ctx.beginPath();
      ctx.moveTo(toX(xVal), pad.t);
      ctx.lineTo(toX(xVal), H - pad.b);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Data points
    for (const pt of points) {
      const px = toX(pt.x);
      const py = toY(pt.y);
      const color = pt.label === 1 ? COLORS.positive : COLORS.negative;

      // Glow
      const grd = ctx.createRadialGradient(px, py, 0, px, py, 14);
      grd.addColorStop(0, color + '40');
      grd.addColorStop(1, color + '00');
      ctx.fillStyle = grd;
      ctx.fillRect(px - 14, py - 14, 28, 28);

      // Point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Border ring
      ctx.strokeStyle = COLORS.text;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Label inside
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(pt.label), px, py + 3.5);
    }

    // Axis titles
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x\u2081', W / 2, H - 2);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x\u2082', 0, 0);
    ctx.restore();
  }, [w1, w2, bias, points]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-white/[0.06] rounded-lg w-full"
      style={{ maxWidth: W, aspectRatio: `${W}/${H}` }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  4. XOR Visualization Canvas                                        */
/* ------------------------------------------------------------------ */
const XOR_POINTS = [
  { x: 0, y: 0, label: 0 },
  { x: 1, y: 0, label: 1 },
  { x: 0, y: 1, label: 1 },
  { x: 1, y: 1, label: 0 },
];

function XORCanvas({ w1, w2, bias }: { w1: number; w2: number; bias: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 360;
  const H = 340;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    const pad = { l: 44, r: 20, t: 20, b: 38 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;
    const range = [-0.3, 1.3];
    const span = range[1] - range[0];
    const toX = (v: number) => pad.l + ((v - range[0]) / span) * pw;
    const toY = (v: number) => pad.t + (1 - (v - range[0]) / span) * ph;

    // Background
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, 0, W, H);

    // Fill regions
    const step = 2;
    for (let px = pad.l; px < W - pad.r; px += step) {
      for (let py = pad.t; py < H - pad.b; py += step) {
        const x1 = range[0] + ((px - pad.l) / pw) * span;
        const x2 = range[0] + (1 - (py - pad.t) / ph) * span;
        const z = w1 * x1 + w2 * x2 + bias;
        ctx.fillStyle = z >= 0 ? 'rgba(59,130,246,0.10)' : 'rgba(239,68,68,0.08)';
        ctx.fillRect(px, py, step, step);
      }
    }

    // Grid
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let g = 0; g <= 1; g += 0.5) {
      ctx.beginPath();
      ctx.moveTo(toX(g), pad.t);
      ctx.lineTo(toX(g), H - pad.b);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad.l, toY(g));
      ctx.lineTo(W - pad.r, toY(g));
      ctx.stroke();
    }

    // Decision line
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    if (Math.abs(w2) > 0.001) {
      const x1a = range[0];
      const x1b = range[1];
      const x2a = -(w1 * x1a + bias) / w2;
      const x2b = -(w1 * x1b + bias) / w2;
      ctx.beginPath();
      ctx.moveTo(toX(x1a), toY(x2a));
      ctx.lineTo(toX(x1b), toY(x2b));
      ctx.stroke();
    } else if (Math.abs(w1) > 0.001) {
      const xVal = -bias / w1;
      ctx.beginPath();
      ctx.moveTo(toX(xVal), pad.t);
      ctx.lineTo(toX(xVal), H - pad.b);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // XOR data points
    for (const pt of XOR_POINTS) {
      const px = toX(pt.x);
      const py = toY(pt.y);
      const color = pt.label === 1 ? COLORS.positive : COLORS.negative;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.text;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(pt.label), px, py + 4);

      // Coordinate label
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '9px monospace';
      ctx.fillText(`(${pt.x},${pt.y})`, px, py - 14);
    }

    // Check correctness
    let correct = 0;
    for (const pt of XOR_POINTS) {
      const z = w1 * pt.x + w2 * pt.y + bias;
      const pred = z >= 0 ? 1 : 0;
      if (pred === pt.label) correct++;
    }

    ctx.fillStyle = correct === 4 ? COLORS.green : COLORS.textMuted;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${correct}/4 correct`, W - pad.r - 4, pad.t + 16);
  }, [w1, w2, bias]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-white/[0.06] rounded-lg w-full"
      style={{ maxWidth: W, aspectRatio: `${W}/${H}` }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  5. Training Step Canvas + Logic                                    */
/* ------------------------------------------------------------------ */
interface TrainingState {
  w1: number;
  w2: number;
  bias: number;
  epoch: number;
  stepInEpoch: number;
  errors: number;
  converged: boolean;
  history: { w1: number; w2: number; b: number }[];
}

function createTrainingData(pattern: 'and' | 'or') {
  if (pattern === 'and') {
    return [
      { x1: 0, x2: 0, label: 0 },
      { x1: 1, x2: 0, label: 0 },
      { x1: 0, x2: 1, label: 0 },
      { x1: 1, x2: 1, label: 1 },
    ];
  }
  return [
    { x1: 0, x2: 0, label: 0 },
    { x1: 1, x2: 0, label: 1 },
    { x1: 0, x2: 1, label: 1 },
    { x1: 1, x2: 1, label: 1 },
  ];
}

function trainStep(
  state: TrainingState,
  data: { x1: number; x2: number; label: number }[],
  lr: number,
): TrainingState {
  if (state.converged) return state;

  const idx = state.stepInEpoch;
  const sample = data[idx];
  const z = state.w1 * sample.x1 + state.w2 * sample.x2 + state.bias;
  const prediction = z >= 0 ? 1 : 0;
  const error = sample.label - prediction;

  const newW1 = state.w1 + lr * error * sample.x1;
  const newW2 = state.w2 + lr * error * sample.x2;
  const newBias = state.bias + lr * error;

  const newStepInEpoch = idx + 1;
  const newEpoch = state.epoch;
  const newErrors = state.errors + (error !== 0 ? 1 : 0);

  if (newStepInEpoch >= data.length) {
    // End of epoch
    const converged = newErrors === 0;
    return {
      w1: newW1,
      w2: newW2,
      bias: newBias,
      epoch: newEpoch + 1,
      stepInEpoch: 0,
      errors: 0,
      converged,
      history: [...state.history, { w1: newW1, w2: newW2, b: newBias }],
    };
  }

  return {
    w1: newW1,
    w2: newW2,
    bias: newBias,
    epoch: newEpoch,
    stepInEpoch: newStepInEpoch,
    errors: newErrors,
    converged: false,
    history: [...state.history, { w1: newW1, w2: newW2, b: newBias }],
  };
}

function TrainingCanvas({
  w1,
  w2,
  bias,
  data,
  currentSampleIdx,
}: {
  w1: number;
  w2: number;
  bias: number;
  data: { x1: number; x2: number; label: number }[];
  currentSampleIdx: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 340;
  const H = 320;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    const pad = { l: 40, r: 16, t: 16, b: 34 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;
    const range = [-0.3, 1.3];
    const span = range[1] - range[0];
    const toX = (v: number) => pad.l + ((v - range[0]) / span) * pw;
    const toY = (v: number) => pad.t + (1 - (v - range[0]) / span) * ph;

    // Background
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, 0, W, H);

    // Regions
    const step = 3;
    for (let px = pad.l; px < W - pad.r; px += step) {
      for (let py = pad.t; py < H - pad.b; py += step) {
        const x1 = range[0] + ((px - pad.l) / pw) * span;
        const x2 = range[0] + (1 - (py - pad.t) / ph) * span;
        const z = w1 * x1 + w2 * x2 + bias;
        ctx.fillStyle = z >= 0 ? 'rgba(59,130,246,0.10)' : 'rgba(239,68,68,0.08)';
        ctx.fillRect(px, py, step, step);
      }
    }

    // Grid
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let g = 0; g <= 1; g += 0.5) {
      ctx.beginPath();
      ctx.moveTo(toX(g), pad.t);
      ctx.lineTo(toX(g), H - pad.b);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad.l, toY(g));
      ctx.lineTo(W - pad.r, toY(g));
      ctx.stroke();
    }

    // Decision line
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    if (Math.abs(w2) > 0.001) {
      const x1a = range[0];
      const x1b = range[1];
      const x2a = -(w1 * x1a + bias) / w2;
      const x2b = -(w1 * x1b + bias) / w2;
      ctx.beginPath();
      ctx.moveTo(toX(x1a), toY(x2a));
      ctx.lineTo(toX(x1b), toY(x2b));
      ctx.stroke();
    } else if (Math.abs(w1) > 0.001) {
      const xVal = -bias / w1;
      ctx.beginPath();
      ctx.moveTo(toX(xVal), pad.t);
      ctx.lineTo(toX(xVal), H - pad.b);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Data points
    data.forEach((pt, i) => {
      const px = toX(pt.x1);
      const py = toY(pt.x2);
      const color = pt.label === 1 ? COLORS.positive : COLORS.negative;
      const isCurrent = i === currentSampleIdx;

      // Current sample highlight ring
      if (isCurrent) {
        ctx.strokeStyle = COLORS.accentPurple;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 13, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing label
        ctx.fillStyle = COLORS.accentPurple;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('current', px, py - 18);
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.text;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(pt.label), px, py + 3.5);
    });

    // Axis titles
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x\u2081', W / 2, H - 4);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x\u2082', 0, 0);
    ctx.restore();
  }, [w1, w2, bias, data, currentSampleIdx]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-white/[0.06] rounded-lg w-full"
      style={{ maxWidth: W, aspectRatio: `${W}/${H}` }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Preset button helper                                               */
/* ------------------------------------------------------------------ */
function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? 'bg-primary/15 text-primary-light border border-primary/30'
          : 'bg-transparent text-text-muted hover:text-text hover:bg-surface-lighter border border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

/* ================================================================== */
/*  MAIN PAGE COMPONENT                                                */
/* ================================================================== */
export default function PerceptronMathPage() {
  /* --- Section 2: Weighted Sum state --- */
  const [wsX1, setWsX1] = useState(1.0);
  const [wsX2, setWsX2] = useState(0.5);
  const [wsW1, setWsW1] = useState(0.6);
  const [wsW2, setWsW2] = useState(-0.4);
  const [wsBias, setWsBias] = useState(0.1);
  const wsZ = wsW1 * wsX1 + wsW2 * wsX2 + wsBias;
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  const wsOutput = sigmoid(wsZ);

  /* --- Section 3: Activation state --- */
  const [actType, setActType] = useState<ActivationType>('sigmoid');
  const [actZ, setActZ] = useState(0.0);

  /* --- Section 4: Decision boundary state --- */
  const [dbW1, setDbW1] = useState(2.0);
  const [dbW2, setDbW2] = useState(2.0);
  const [dbBias, setDbBias] = useState(-3.0);
  const [gatePreset, setGatePreset] = useState<'and' | 'or' | 'custom'>('and');

  const gatePoints: Record<string, { x: number; y: number; label: number }[]> = {
    and: [
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 0, label: 0 },
      { x: 0, y: 1, label: 0 },
      { x: 1, y: 1, label: 1 },
    ],
    or: [
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 0, label: 1 },
      { x: 0, y: 1, label: 1 },
      { x: 1, y: 1, label: 1 },
    ],
    custom: [
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 0, label: 0 },
      { x: 0, y: 1, label: 0 },
      { x: 1, y: 1, label: 1 },
    ],
  };

  const handleGatePreset = (preset: 'and' | 'or' | 'custom') => {
    setGatePreset(preset);
    if (preset === 'and') {
      setDbW1(2.0);
      setDbW2(2.0);
      setDbBias(-3.0);
    } else if (preset === 'or') {
      setDbW1(2.0);
      setDbW2(2.0);
      setDbBias(-1.0);
    }
  };

  /* --- Section 5: XOR state --- */
  const [xorW1, setXorW1] = useState(1.0);
  const [xorW2, setXorW2] = useState(1.0);
  const [xorBias, setXorBias] = useState(-0.5);

  /* --- Section 6: Training state --- */
  const [trainingPattern, setTrainingPattern] = useState<'and' | 'or'>('and');
  const [learningRate, setLearningRate] = useState(0.5);
  const [tState, setTState] = useState<TrainingState>({
    w1: 0.0,
    w2: 0.0,
    bias: 0.0,
    epoch: 0,
    stepInEpoch: 0,
    errors: 0,
    converged: false,
    history: [{ w1: 0, w2: 0, b: 0 }],
  });
  const trainingData = createTrainingData(trainingPattern);

  const handleTrainStep = () => {
    setTState((prev) => trainStep(prev, trainingData, learningRate));
  };

  const handleTrainEpoch = () => {
    setTState((prev) => {
      let s = prev;
      const remaining = trainingData.length - s.stepInEpoch;
      for (let i = 0; i < remaining && !s.converged; i++) {
        s = trainStep(s, trainingData, learningRate);
      }
      return s;
    });
  };

  const handleTrainReset = () => {
    setTState({
      w1: 0,
      w2: 0,
      bias: 0,
      epoch: 0,
      stepInEpoch: 0,
      errors: 0,
      converged: false,
      history: [{ w1: 0, w2: 0, b: 0 }],
    });
  };

  const handlePatternChange = (p: 'and' | 'or') => {
    setTrainingPattern(p);
    handleTrainReset();
  };

  /* Compute per-point predictions for training display */
  const trainingPredictions = trainingData.map((pt) => {
    const z = tState.w1 * pt.x1 + tState.w2 * pt.x2 + tState.bias;
    return { ...pt, predicted: z >= 0 ? 1 : 0, correct: (z >= 0 ? 1 : 0) === pt.label };
  });
  const totalCorrect = trainingPredictions.filter((p) => p.correct).length;

  return (
    <MathLayout
      title="The Perceptron"
      subtitle="The building block of neural networks -- a single artificial neuron that learns to classify inputs by adjusting weights."
    >
      {/* ============================================================ */}
      {/*  SECTION 1: What is a Perceptron?                            */}
      {/* ============================================================ */}
      <Section title="1. What is a Perceptron?">
        <Prose>
          <p>
            In 1958, Frank Rosenblatt introduced the <strong>perceptron</strong>, an algorithm
            inspired by how biological neurons process information. A biological neuron receives
            electrical signals through its dendrites, integrates them in the cell body, and fires an
            output signal along its axon if the combined input exceeds a threshold.
          </p>
          <p>
            The perceptron is the mathematical abstraction of this process. It takes a set of
            numerical inputs, multiplies each by a learned <strong>weight</strong> (representing the
            strength of that connection), sums them together with a <strong>bias</strong> term, and
            passes the result through an <strong>activation function</strong> to produce an output.
          </p>
        </Prose>
        <Eq block>
          <span className="text-text-muted">output</span>
          <span className="text-text-muted mx-2">=</span>
          <span className="text-primary-light">activation</span>
          <span className="text-text-muted">(</span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-accent-purple mx-1">x</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-text-muted mx-1">+</span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-accent-purple mx-1">x</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-text-muted mx-1">+ ... +</span>
          <span className="text-accent-purple mx-1">b</span>
          <span className="text-text-muted">)</span>
        </Eq>
        <Prose>
          <p>
            Despite its simplicity, the perceptron is the foundation of all neural networks. Every
            neuron in a deep network performs this same weighted-sum-then-activate operation.
            Understanding the perceptron deeply means understanding the atomic unit of deep
            learning.
          </p>
        </Prose>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 2: The Weighted Sum                                 */}
      {/* ============================================================ */}
      <Section title="2. The Weighted Sum">
        <Prose>
          <p>
            The first step inside a perceptron is computing the <strong>weighted sum</strong> (also
            called the <em>pre-activation</em> or <Eq>z</Eq>). Each input <Eq>x</Eq> is scaled by
            its corresponding weight <Eq>w</Eq>, and a bias term <Eq>b</Eq> is added. The bias
            allows the perceptron to shift its decision threshold independent of the inputs.
          </p>
        </Prose>
        <Eq block>
          <span className="text-text-muted">z</span>
          <span className="text-text-muted mx-2">=</span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-text-muted">{' \u00b7 '}</span>
          <span className="text-accent-purple">x</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-text-muted mx-1">+</span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-text-muted">{' \u00b7 '}</span>
          <span className="text-accent-purple">x</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-text-muted mx-1">+</span>
          <span className="text-accent-purple">b</span>
        </Eq>
        <Prose>
          <p>
            Geometrically, the weighted sum is the <strong>dot product</strong> of the weight vector
            and the input vector, plus a bias offset. The weights control the orientation of the
            decision boundary, while the bias shifts it.
          </p>
        </Prose>

        <InteractiveDemo title="Weighted Sum Explorer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Inputs
                </h4>
                <ParameterSlider
                  label={'x\u2081'}
                  value={wsX1}
                  min={-2}
                  max={2}
                  step={0.1}
                  onChange={setWsX1}
                  format={fmt}
                />
                <ParameterSlider
                  label={'x\u2082'}
                  value={wsX2}
                  min={-2}
                  max={2}
                  step={0.1}
                  onChange={setWsX2}
                  format={fmt}
                />
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Weights & Bias
                </h4>
                <ParameterSlider
                  label={'w\u2081'}
                  value={wsW1}
                  min={-3}
                  max={3}
                  step={0.1}
                  onChange={setWsW1}
                  format={fmt}
                />
                <ParameterSlider
                  label={'w\u2082'}
                  value={wsW2}
                  min={-3}
                  max={3}
                  step={0.1}
                  onChange={setWsW2}
                  format={fmt}
                />
                <ParameterSlider
                  label="bias (b)"
                  value={wsBias}
                  min={-3}
                  max={3}
                  step={0.1}
                  onChange={setWsBias}
                  format={fmt}
                />
              </div>

              {/* Computation breakdown */}
              <div className="rounded-lg bg-surface p-4 border border-white/[0.06] space-y-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Computation
                </h4>
                <div className="font-mono text-sm text-text-muted space-y-1">
                  <p>
                    <span className="text-primary-light">{fmt(wsW1)}</span>
                    <span className="text-text-muted">{' \u00d7 '}</span>
                    <span className="text-accent-purple">{fmt(wsX1)}</span>
                    <span className="text-text-muted"> = </span>
                    <span className="text-text">{fmt(wsW1 * wsX1)}</span>
                  </p>
                  <p>
                    <span className="text-primary-light">{fmt(wsW2)}</span>
                    <span className="text-text-muted">{' \u00d7 '}</span>
                    <span className="text-accent-purple">{fmt(wsX2)}</span>
                    <span className="text-text-muted"> = </span>
                    <span className="text-text">{fmt(wsW2 * wsX2)}</span>
                  </p>
                  <div className="border-t border-white/[0.06] pt-1 mt-1">
                    <p>
                      <span className="text-text">
                        z = {fmt(wsW1 * wsX1)} + {fmt(wsW2 * wsX2)} + {fmt(wsBias)} ={' '}
                      </span>
                      <span className="text-primary-light font-bold">{fmt(wsZ)}</span>
                    </p>
                    <p className="mt-1">
                      <span className="text-text">{'\u03c3'}(z) = </span>
                      <span
                        className={`font-bold ${wsOutput >= 0.5 ? 'text-[#3b82f6]' : 'text-[#ef4444]'}`}
                      >
                        {fmt(wsOutput)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <NeuronDiagram
                x1={wsX1}
                x2={wsX2}
                w1={wsW1}
                w2={wsW2}
                bias={wsBias}
                z={wsZ}
                output={wsOutput}
              />
            </div>
          </div>
        </InteractiveDemo>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 3: Activation Functions                             */}
      {/* ============================================================ */}
      <Section title="3. Activation Functions">
        <Prose>
          <p>
            After computing the weighted sum <Eq>z</Eq>, the perceptron passes it through an{' '}
            <strong>activation function</strong>. This function introduces non-linearity, enabling
            the perceptron to model more than just linear relationships. Without it, any composition
            of perceptrons would still be linear.
          </p>
          <p>
            The three most fundamental activation functions are the <strong>step function</strong>{' '}
            (the original perceptron), the <strong>sigmoid</strong> (smooth, differentiable), and{' '}
            <strong>ReLU</strong> (the modern default for hidden layers).
          </p>
        </Prose>

        {/* Formulas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-surface-light border border-white/[0.06] p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Step Function
            </h4>
            <p className="font-mono text-sm text-text">
              f(z) = {'{'} 1 if z {'\u2265'} 0, 0 otherwise {'}'}
            </p>
            <p className="text-xs text-text-muted mt-2">
              Hard binary output. Not differentiable at z=0, so cannot be trained with gradient
              descent.
            </p>
          </div>
          <div className="rounded-lg bg-surface-light border border-white/[0.06] p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Sigmoid
            </h4>
            <p className="font-mono text-sm text-text">
              {'\u03c3'}(z) = 1 / (1 + e<sup>-z</sup>)
            </p>
            <p className="text-xs text-text-muted mt-2">
              Smooth S-curve mapping to (0, 1). Differentiable everywhere. Used for output
              probabilities.
            </p>
          </div>
          <div className="rounded-lg bg-surface-light border border-white/[0.06] p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              ReLU
            </h4>
            <p className="font-mono text-sm text-text">f(z) = max(0, z)</p>
            <p className="text-xs text-text-muted mt-2">
              Zero for negatives, identity for positives. Fast to compute. Default for hidden
              layers.
            </p>
          </div>
        </div>

        <InteractiveDemo title="Activation Function Visualizer">
          <div className="space-y-4">
            <div className="flex gap-2">
              {(Object.keys(ACTIVATION_FNS) as ActivationType[]).map((key) => (
                <PresetButton
                  key={key}
                  label={ACTIVATION_FNS[key].label}
                  active={actType === key}
                  onClick={() => setActType(key)}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ActivationCanvas activationType={actType} zValue={actZ} />
              </div>
              <div className="space-y-4 flex flex-col justify-center">
                <ParameterSlider
                  label="z (weighted sum)"
                  value={actZ}
                  min={actType === 'relu' ? -2 : -6}
                  max={actType === 'relu' ? 6 : 6}
                  step={0.1}
                  onChange={setActZ}
                  format={fmt}
                />
                <div className="rounded-lg bg-surface p-4 border border-white/[0.06]">
                  <div className="font-mono text-sm space-y-1">
                    <p className="text-text-muted">
                      Input z = <span className="text-text">{fmt(actZ)}</span>
                    </p>
                    <p className="text-text-muted">
                      {ACTIVATION_FNS[actType].label}(z) ={' '}
                      <span className="text-primary-light font-bold">
                        {fmt(ACTIVATION_FNS[actType].fn(actZ))}
                      </span>
                    </p>
                  </div>
                </div>
                <Prose>
                  <p>
                    Drag the slider to move <Eq>z</Eq> along the horizontal axis. Watch the dot
                    trace along the activation curve. Notice how the step function creates a hard
                    boundary, the sigmoid smooths it into a probability, and ReLU clips negative
                    values to zero while passing positives unchanged.
                  </p>
                </Prose>
              </div>
            </div>
          </div>
        </InteractiveDemo>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 4: Decision Boundary                                */}
      {/* ============================================================ */}
      <Section title="4. The Decision Boundary">
        <Prose>
          <p>
            A perceptron with two inputs defines a <strong>decision boundary</strong> in 2D space.
            The boundary is the set of all points where the weighted sum equals zero:
          </p>
        </Prose>
        <Eq block>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-accent-purple mx-1">x</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-text-muted mx-1">+</span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-accent-purple mx-1">x</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-text-muted mx-1">+</span>
          <span className="text-accent-purple">b</span>
          <span className="text-text-muted mx-2">=</span>
          <span className="text-text">0</span>
        </Eq>
        <Prose>
          <p>
            This is the equation of a <strong>straight line</strong>. On one side of the line, the
            perceptron outputs class 1 (blue region); on the other side, class 0 (red region). The
            weights <Eq>w1</Eq> and <Eq>w2</Eq> determine the slope and orientation of the line,
            while the bias <Eq>b</Eq> shifts it. By rearranging, we get the slope-intercept form:
          </p>
        </Prose>
        <Eq block>
          <span className="text-accent-purple">x</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-text-muted mx-2">=</span>
          <span className="text-text-muted">{'\u2212'}</span>
          <span className="text-text-muted">(</span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-text-muted"> / </span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2082'}</span>
          <span className="text-text-muted">)</span>
          <span className="text-accent-purple mx-1">x</span>
          <span className="text-text-muted">{'\u2081'}</span>
          <span className="text-text-muted mx-1">{'\u2212'}</span>
          <span className="text-accent-purple">b</span>
          <span className="text-text-muted"> / </span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted">{'\u2082'}</span>
        </Eq>

        <InteractiveDemo title="Decision Boundary Explorer">
          <div className="space-y-4">
            {/* Gate presets */}
            <div className="flex gap-2 items-center">
              <span className="text-xs text-text-muted mr-1">Presets:</span>
              <PresetButton
                label="AND gate"
                active={gatePreset === 'and'}
                onClick={() => handleGatePreset('and')}
              />
              <PresetButton
                label="OR gate"
                active={gatePreset === 'or'}
                onClick={() => handleGatePreset('or')}
              />
              <PresetButton
                label="Custom"
                active={gatePreset === 'custom'}
                onClick={() => handleGatePreset('custom')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex justify-center">
                <DecisionBoundaryCanvas
                  w1={dbW1}
                  w2={dbW2}
                  bias={dbBias}
                  points={gatePoints[gatePreset]}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <ParameterSlider
                    label={'w\u2081'}
                    value={dbW1}
                    min={-5}
                    max={5}
                    step={0.1}
                    onChange={(v) => {
                      setDbW1(v);
                      setGatePreset('custom');
                    }}
                    format={fmt}
                  />
                  <ParameterSlider
                    label={'w\u2082'}
                    value={dbW2}
                    min={-5}
                    max={5}
                    step={0.1}
                    onChange={(v) => {
                      setDbW2(v);
                      setGatePreset('custom');
                    }}
                    format={fmt}
                  />
                  <ParameterSlider
                    label="bias (b)"
                    value={dbBias}
                    min={-5}
                    max={5}
                    step={0.1}
                    onChange={(v) => {
                      setDbBias(v);
                      setGatePreset('custom');
                    }}
                    format={fmt}
                  />
                </div>

                {/* Line equation display */}
                <div className="rounded-lg bg-surface p-4 border border-white/[0.06]">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Decision Boundary Line
                  </h4>
                  <p className="font-mono text-sm text-text">
                    {fmt(dbW1)}x{'\u2081'} + {fmt(dbW2)}x{'\u2082'} + ({fmt(dbBias)}) = 0
                  </p>
                  {Math.abs(dbW2) > 0.001 && (
                    <p className="font-mono text-xs text-text-muted mt-1">
                      x{'\u2082'} = {fmt(-dbW1 / dbW2)}x{'\u2081'} + ({fmt(-dbBias / dbW2)})
                    </p>
                  )}
                </div>

                {/* Point predictions table */}
                <div className="rounded-lg bg-surface p-4 border border-white/[0.06]">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Point Predictions
                  </h4>
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-text-muted">
                        <th className="text-left py-1">Input</th>
                        <th className="text-right py-1">z</th>
                        <th className="text-right py-1">Pred</th>
                        <th className="text-right py-1">Label</th>
                        <th className="text-right py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gatePoints[gatePreset].map((pt, i) => {
                        const z = dbW1 * pt.x + dbW2 * pt.y + dbBias;
                        const pred = z >= 0 ? 1 : 0;
                        const correct = pred === pt.label;
                        return (
                          <tr key={i} className="text-text">
                            <td className="py-0.5">
                              ({pt.x}, {pt.y})
                            </td>
                            <td className="text-right">{fmt(z)}</td>
                            <td className="text-right">{pred}</td>
                            <td className="text-right">{pt.label}</td>
                            <td className="text-right">{correct ? '\u2713' : '\u2717'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Prose>
                  <p>
                    Adjust the weights and bias to move the dashed decision line. Try setting{' '}
                    <Eq>w1 = w2 = 2, b = -3</Eq> for AND, or <Eq>w1 = w2 = 2, b = -1</Eq> for OR.
                    Notice how a single straight line can separate both of these patterns.
                  </p>
                </Prose>
              </div>
            </div>
          </div>
        </InteractiveDemo>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 5: The XOR Problem                                  */}
      {/* ============================================================ */}
      <Section title="5. The XOR Problem">
        <Prose>
          <p>
            The exclusive-or (XOR) function outputs 1 when exactly one of its inputs is 1, and 0
            otherwise. The XOR truth table is: (0,0)=0, (1,0)=1, (0,1)=1, (1,1)=0.
          </p>
          <p>
            Look at these four points plotted below. The two blue points (class 1) sit at opposite
            corners from the two red points (class 0). No matter how you adjust the weights and
            bias, you <strong>cannot draw a single straight line</strong> that separates the blue
            points from the red points. Try it!
          </p>
        </Prose>

        <InteractiveDemo title="XOR Challenge: Try to Separate the Classes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-center">
              <XORCanvas w1={xorW1} w2={xorW2} bias={xorBias} />
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <ParameterSlider
                  label={'w\u2081'}
                  value={xorW1}
                  min={-5}
                  max={5}
                  step={0.1}
                  onChange={setXorW1}
                  format={fmt}
                />
                <ParameterSlider
                  label={'w\u2082'}
                  value={xorW2}
                  min={-5}
                  max={5}
                  step={0.1}
                  onChange={setXorW2}
                  format={fmt}
                />
                <ParameterSlider
                  label="bias (b)"
                  value={xorBias}
                  min={-5}
                  max={5}
                  step={0.1}
                  onChange={setXorBias}
                  format={fmt}
                />
              </div>

              <div className="rounded-lg bg-surface p-4 border border-white/[0.06]">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Point Predictions
                </h4>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-text-muted">
                      <th className="text-left py-1">Input</th>
                      <th className="text-right py-1">z</th>
                      <th className="text-right py-1">Pred</th>
                      <th className="text-right py-1">XOR</th>
                      <th className="text-right py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { x1: 0, x2: 0, label: 0 },
                      { x1: 1, x2: 0, label: 1 },
                      { x1: 0, x2: 1, label: 1 },
                      { x1: 1, x2: 1, label: 0 },
                    ].map((pt, i) => {
                      const z = xorW1 * pt.x1 + xorW2 * pt.x2 + xorBias;
                      const pred = z >= 0 ? 1 : 0;
                      const correct = pred === pt.label;
                      return (
                        <tr key={i} className="text-text">
                          <td className="py-0.5">
                            ({pt.x1}, {pt.x2})
                          </td>
                          <td className="text-right">{fmt(z)}</td>
                          <td className="text-right">{pred}</td>
                          <td className="text-right">{pt.label}</td>
                          <td
                            className={`text-right ${correct ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}
                          >
                            {correct ? '\u2713' : '\u2717'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Prose>
                <p>
                  No matter how you set the sliders, you can only get at most 3 out of 4 correct.
                  This is Minsky and Papert's famous 1969 result: a single perceptron can only learn{' '}
                  <strong>linearly separable</strong> functions. XOR requires at least two
                  perceptrons composed in a <strong>multi-layer network</strong> -- one to compute
                  an intermediate feature, and another to combine.
                </p>
                <p>
                  This limitation motivated the development of multi-layer perceptrons (MLPs) and
                  the backpropagation algorithm, which together can learn XOR and any other
                  computable function.
                </p>
              </Prose>
            </div>
          </div>
        </InteractiveDemo>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 6: Perceptron Learning Rule                         */}
      {/* ============================================================ */}
      <Section title="6. The Perceptron Learning Rule">
        <Prose>
          <p>
            The perceptron learning algorithm adjusts weights based on prediction errors. For each
            training sample, if the perceptron makes the correct prediction, no update occurs. If it
            makes an error, the weights are nudged in the direction that would fix the mistake.
          </p>
        </Prose>
        <Eq block>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted align-sub text-xs">new</span>
          <span className="text-text-muted mx-2">=</span>
          <span className="text-primary-light">w</span>
          <span className="text-text-muted align-sub text-xs">old</span>
          <span className="text-text-muted mx-2">+</span>
          <span className="text-accent-purple">{'\u03b1'}</span>
          <span className="text-text-muted mx-1">{'\u00b7'}</span>
          <span className="text-text-muted">(</span>
          <span className="text-[#22c55e]">y</span>
          <span className="text-text-muted mx-1">{'\u2212'}</span>
          <span className="text-[#ef4444]">{'\u0177'}</span>
          <span className="text-text-muted">)</span>
          <span className="text-text-muted mx-1">{'\u00b7'}</span>
          <span className="text-accent-purple">x</span>
        </Eq>
        <Prose>
          <p>
            Where <Eq>{'\u03b1'}</Eq> is the learning rate, <Eq>y</Eq> is the true label,{' '}
            <Eq>{'\u0177'}</Eq> is the prediction, and <Eq>x</Eq> is the input. The error term{' '}
            <Eq>{'(y - \u0177)'}</Eq> is either -1, 0, or +1 for a step activation. When the error
            is zero (correct prediction), the weights stay the same. When positive (predicted 0 but
            should be 1), the weights increase for active inputs. When negative, they decrease.
          </p>
          <p>
            The <strong>Perceptron Convergence Theorem</strong> guarantees that if the data is
            linearly separable, this algorithm will find a separating hyperplane in a finite number
            of steps. The bias is updated the same way, treating it as a weight on a constant input
            of 1.
          </p>
        </Prose>

        <InteractiveDemo title="Step-by-Step Training">
          <div className="space-y-4">
            {/* Pattern and LR controls */}
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-text-muted">Pattern:</span>
                <PresetButton
                  label="AND"
                  active={trainingPattern === 'and'}
                  onClick={() => handlePatternChange('and')}
                />
                <PresetButton
                  label="OR"
                  active={trainingPattern === 'or'}
                  onClick={() => handlePatternChange('or')}
                />
              </div>
              <div className="w-48">
                <ParameterSlider
                  label={'Learning rate (\u03b1)'}
                  value={learningRate}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  onChange={setLearningRate}
                  format={fmt}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex justify-center">
                <TrainingCanvas
                  w1={tState.w1}
                  w2={tState.w2}
                  bias={tState.bias}
                  data={trainingData}
                  currentSampleIdx={tState.stepInEpoch}
                />
              </div>
              <div className="space-y-4">
                {/* Training controls */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleTrainStep}
                    disabled={tState.converged}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/15 text-primary-light border border-primary/30 hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Train 1 Step
                  </button>
                  <button
                    onClick={handleTrainEpoch}
                    disabled={tState.converged}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/15 text-primary-light border border-primary/30 hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Complete Epoch
                  </button>
                  <button
                    onClick={() => {
                      // Run until converged or 50 epochs
                      setTState((prev) => {
                        let s = prev;
                        let safetyCounter = 0;
                        while (!s.converged && safetyCounter < 200) {
                          s = trainStep(s, trainingData, learningRate);
                          safetyCounter++;
                        }
                        return s;
                      });
                    }}
                    disabled={tState.converged}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent-purple/15 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Train to Convergence
                  </button>
                  <button
                    onClick={handleTrainReset}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-transparent text-text-muted hover:text-text hover:bg-surface-lighter border border-transparent transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Training state display */}
                <div className="rounded-lg bg-surface p-4 border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Training State
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                    <span className="text-text-muted">Epoch:</span>
                    <span className="text-text">{tState.epoch}</span>
                    <span className="text-text-muted">Step in epoch:</span>
                    <span className="text-text">
                      {tState.stepInEpoch} / {trainingData.length}
                    </span>
                    <span className="text-text-muted">w{'\u2081'}:</span>
                    <span className="text-primary-light">{fmt(tState.w1)}</span>
                    <span className="text-text-muted">w{'\u2082'}:</span>
                    <span className="text-primary-light">{fmt(tState.w2)}</span>
                    <span className="text-text-muted">bias:</span>
                    <span className="text-accent-purple">{fmt(tState.bias)}</span>
                    <span className="text-text-muted">Accuracy:</span>
                    <span
                      className={
                        totalCorrect === trainingData.length ? 'text-[#22c55e]' : 'text-text'
                      }
                    >
                      {totalCorrect}/{trainingData.length}
                    </span>
                  </div>
                  {tState.converged && (
                    <div className="mt-2 px-3 py-2 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/20">
                      <p className="text-xs text-[#22c55e] font-semibold">
                        Converged! All samples classified correctly after {tState.epoch} epoch
                        {tState.epoch !== 1 ? 's' : ''}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Current sample info */}
                {!tState.converged && (
                  <div className="rounded-lg bg-surface p-4 border border-white/[0.06]">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Next Sample
                    </h4>
                    <div className="text-xs font-mono space-y-1">
                      <p className="text-text-muted">
                        Input: ({trainingData[tState.stepInEpoch].x1},{' '}
                        {trainingData[tState.stepInEpoch].x2}){' \u2192 '}
                        Label:{' '}
                        <span className="text-[#22c55e]">
                          {trainingData[tState.stepInEpoch].label}
                        </span>
                      </p>
                      <p className="text-text-muted">
                        z = {fmt(tState.w1)} {'\u00d7'} {trainingData[tState.stepInEpoch].x1} +{' '}
                        {fmt(tState.w2)} {'\u00d7'} {trainingData[tState.stepInEpoch].x2} +{' '}
                        {fmt(tState.bias)}
                        {' = '}
                        <span className="text-text">
                          {fmt(
                            tState.w1 * trainingData[tState.stepInEpoch].x1 +
                              tState.w2 * trainingData[tState.stepInEpoch].x2 +
                              tState.bias,
                          )}
                        </span>
                      </p>
                      {(() => {
                        const sample = trainingData[tState.stepInEpoch];
                        const z = tState.w1 * sample.x1 + tState.w2 * sample.x2 + tState.bias;
                        const pred = z >= 0 ? 1 : 0;
                        const error = sample.label - pred;
                        return (
                          <>
                            <p className="text-text-muted">
                              Prediction:{' '}
                              <span
                                className={
                                  pred === sample.label ? 'text-[#22c55e]' : 'text-[#ef4444]'
                                }
                              >
                                {pred}
                              </span>
                              {' | '}
                              Error: <span className="text-text">{error}</span>
                            </p>
                            {error !== 0 && (
                              <p className="text-accent-purple mt-1">
                                Update: w += {fmt(learningRate)} {'\u00d7'} {error} {'\u00d7'} x
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Predictions table */}
                <div className="rounded-lg bg-surface p-4 border border-white/[0.06]">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Current Predictions
                  </h4>
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-text-muted">
                        <th className="text-left py-1">Input</th>
                        <th className="text-right py-1">z</th>
                        <th className="text-right py-1">Pred</th>
                        <th className="text-right py-1">Label</th>
                        <th className="text-right py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingPredictions.map((pt, i) => (
                        <tr
                          key={i}
                          className={`text-text ${i === tState.stepInEpoch && !tState.converged ? 'bg-accent-purple/10' : ''}`}
                        >
                          <td className="py-0.5">
                            ({pt.x1}, {pt.x2})
                          </td>
                          <td className="text-right">
                            {fmt(tState.w1 * pt.x1 + tState.w2 * pt.x2 + tState.bias)}
                          </td>
                          <td className="text-right">{pt.predicted}</td>
                          <td className="text-right">{pt.label}</td>
                          <td
                            className={`text-right ${pt.correct ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}
                          >
                            {pt.correct ? '\u2713' : '\u2717'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Weight history */}
            {tState.history.length > 1 && (
              <div className="rounded-lg bg-surface p-4 border border-white/[0.06]">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Weight History (last {Math.min(tState.history.length, 12)} updates)
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {tState.history.slice(-12).map((h, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 px-2 py-1.5 rounded bg-surface-light border border-white/[0.06] text-xs font-mono"
                    >
                      <div className="text-text-muted text-[10px] mb-0.5">
                        #
                        {tState.history.length - 12 + i < 0
                          ? i
                          : tState.history.length - Math.min(tState.history.length, 12) + i}
                      </div>
                      <div className="text-primary-light">w1={fmt(h.w1)}</div>
                      <div className="text-primary-light">w2={fmt(h.w2)}</div>
                      <div className="text-accent-purple">b={fmt(h.b)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InteractiveDemo>

        <Prose>
          <p>
            Watch the decision boundary shift with each training step. When the perceptron makes an
            error, the weight update rotates and shifts the boundary toward classifying that sample
            correctly. After enough epochs with no errors, the algorithm converges. The Perceptron
            Convergence Theorem guarantees this will happen for any linearly separable dataset in a
            finite number of steps.
          </p>
        </Prose>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 7: Summary                                          */}
      {/* ============================================================ */}
      <Section title="7. Summary and Key Takeaways">
        <Prose>
          <p>
            The perceptron is the simplest possible neural network: one neuron, one layer. Despite
            its simplicity, it encodes the core ideas of all neural computation.
          </p>
        </Prose>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-surface-light border border-white/[0.06] p-4">
            <h4 className="text-xs font-semibold text-primary-light uppercase tracking-wider mb-2">
              What a perceptron CAN do
            </h4>
            <ul className="text-sm text-text-muted space-y-1.5 list-disc list-inside">
              <li>Classify linearly separable data (AND, OR, NAND)</li>
              <li>Learn from examples via the perceptron learning rule</li>
              <li>Converge in finite steps (guaranteed for separable data)</li>
              <li>Form the building block of multi-layer networks</li>
            </ul>
          </div>
          <div className="rounded-lg bg-surface-light border border-white/[0.06] p-4">
            <h4 className="text-xs font-semibold text-[#ef4444] uppercase tracking-wider mb-2">
              What a perceptron CANNOT do
            </h4>
            <ul className="text-sm text-text-muted space-y-1.5 list-disc list-inside">
              <li>Solve non-linearly-separable problems (XOR)</li>
              <li>Model complex, curved decision boundaries</li>
              <li>Learn hierarchical representations</li>
              <li>Handle problems requiring multiple decision regions</li>
            </ul>
          </div>
        </div>
        <Prose>
          <p>
            These limitations are precisely what motivated the development of multi-layer
            perceptrons (MLPs), backpropagation, and eventually the deep networks that power modern
            AI. Every deep network is still, at its core, a carefully arranged collection of
            perceptrons.
          </p>
        </Prose>
      </Section>
    </MathLayout>
  );
}
