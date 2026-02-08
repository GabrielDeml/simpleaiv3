import { useState, useMemo, useCallback } from 'react';
import { MathLayout } from '../../components/math/MathLayout';
import { Section } from '../../components/math/Section';
import { Eq } from '../../components/math/Eq';
import { Prose } from '../../components/math/Prose';
import { InteractiveDemo } from '../../components/math/InteractiveDemo';
import { ParameterSlider } from '../../components/shared/ParameterSlider';

/* ────────────────────────────────────────────────────────────────────────────
   Constants & preset kernels
   ──────────────────────────────────────────────────────────────────────────── */

const CELL = 36; // px per grid cell

const PRESET_KERNELS: Record<string, { name: string; kernel: number[][] }> = {
  edgeH: { name: 'Edge (H)', kernel: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
  edgeV: { name: 'Edge (V)', kernel: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
  sharpen: { name: 'Sharpen', kernel: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
  blur: { name: 'Blur', kernel: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  emboss: { name: 'Emboss', kernel: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]] },
  identity: { name: 'Identity', kernel: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
};

const INITIAL_IMAGE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

const POOL_GRID: number[][] = [
  [1, 3, 2, 4],
  [5, 6, 7, 8],
  [3, 2, 1, 0],
  [1, 2, 3, 4],
];

const PIPELINE_STAGES = [
  { label: 'Input', dim: '28 x 28 x 1', desc: 'Raw grayscale image. Each pixel is a single value between 0 and 1.' },
  { label: 'Conv 5x5', dim: '24 x 24 x 6', desc: 'Six 5x5 kernels slide across the input. Output shrinks by (kernel_size - 1) = 4 in each dimension. Each kernel detects a different low-level feature.' },
  { label: 'ReLU', dim: '24 x 24 x 6', desc: 'ReLU(x) = max(0, x). Negative activations are zeroed out, introducing non-linearity so the network can learn complex patterns.' },
  { label: 'MaxPool 2x2', dim: '12 x 12 x 6', desc: '2x2 max pooling halves spatial dimensions. Keeps the strongest activation in each 2x2 window, providing translation invariance.' },
  { label: 'Conv 5x5', dim: '8 x 8 x 16', desc: 'Sixteen 5x5 kernels over 6 input channels. Each kernel now combines patterns from multiple feature maps to detect higher-level features.' },
  { label: 'ReLU', dim: '8 x 8 x 16', desc: 'Another non-linearity layer. Same operation, applied element-wise to every value in all 16 feature maps.' },
  { label: 'MaxPool 2x2', dim: '4 x 4 x 16', desc: 'Spatial dimensions halved again. We now have a compact 4x4 spatial representation with 16 channels of abstract features.' },
  { label: 'Flatten', dim: '256', desc: 'Reshape the 4x4x16 volume into a single vector of 256 values. This bridges the convolutional layers and the fully connected classifier.' },
  { label: 'FC 128', dim: '128', desc: 'Fully connected layer with 256x128 = 32,768 weights. Combines all spatial features into 128 abstract representations.' },
  { label: 'Output 10', dim: '10', desc: 'Final layer with 10 outputs (one per digit class). Softmax converts these into probabilities that sum to 1.' },
];

/* ────────────────────────────────────────────────────────────────────────────
   Utility helpers
   ──────────────────────────────────────────────────────────────────────────── */

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Compute a single convolution output value at position (oy, ox). */
function convAt(
  image: number[][],
  kernel: number[][],
  oy: number,
  ox: number,
): number {
  const kSize = kernel.length;
  let sum = 0;
  for (let m = 0; m < kSize; m++) {
    for (let n = 0; n < kSize; n++) {
      sum += (image[oy + m]?.[ox + n] ?? 0) * kernel[m][n];
    }
  }
  return sum;
}

/** Full convolution of image with kernel (valid, stride=1). */
function convolve(image: number[][], kernel: number[][]): number[][] {
  const kSize = kernel.length;
  const outH = image.length - kSize + 1;
  const outW = (image[0]?.length ?? 0) - kSize + 1;
  const out: number[][] = [];
  for (let i = 0; i < outH; i++) {
    const row: number[] = [];
    for (let j = 0; j < outW; j++) {
      row.push(convAt(image, kernel, i, j));
    }
    out.push(row);
  }
  return out;
}


/** Normalize convolution output to [0,1] for display. */
function normalizeOutput(output: number[][]): number[][] {
  let min = Infinity;
  let max = -Infinity;
  for (const row of output) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const range = max - min || 1;
  return output.map(row => row.map(v => (v - min) / range));
}

/* ────────────────────────────────────────────────────────────────────────────
   Reusable small components
   ──────────────────────────────────────────────────────────────────────────── */

function Cell({
  value,
  highlight,
  highlightColor = 'ring-accent-amber',
  onClick,
  showNumber,
  numberValue,
  size = CELL,
  isMaxPoolWinner,
}: {
  value: number;
  highlight?: boolean;
  highlightColor?: string;
  onClick?: () => void;
  showNumber?: boolean;
  numberValue?: number;
  size?: number;
  isMaxPoolWinner?: boolean;
}) {
  const bg =
    value >= 0.5
      ? `rgba(241,245,249,${clamp(value, 0, 1)})`
      : `rgba(241,245,249,${clamp(value, 0, 1)})`;

  return (
    <div
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-sm border border-white/[0.06]
        transition-all duration-150 select-none
        ${onClick ? 'cursor-pointer hover:border-primary/40' : ''}
        ${highlight ? `ring-2 ${highlightColor} z-10` : ''}
        ${isMaxPoolWinner ? 'ring-2 ring-accent-green z-10' : ''}
      `}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: bg,
      }}
    >
      {showNumber && (
        <span className="text-[10px] font-mono text-text-muted leading-none">
          {numberValue !== undefined ? numberValue : value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function PixelGrid({
  grid,
  highlight,
  onCellClick,
  showNumbers,
  cellSize = CELL,
  highlightColor,
  maxPoolWinners,
  padCells,
}: {
  grid: number[][];
  highlight?: { row: number; col: number; kSize: number } | null;
  onCellClick?: (r: number, c: number) => void;
  showNumbers?: boolean;
  cellSize?: number;
  highlightColor?: string;
  maxPoolWinners?: Set<string>;
  padCells?: number;
}) {
  return (
    <div className="inline-flex flex-col gap-[2px]">
      {grid.map((row, r) => (
        <div key={r} className="flex gap-[2px]">
          {row.map((val, c) => {
            const inReceptive =
              highlight != null &&
              r >= highlight.row &&
              r < highlight.row + highlight.kSize &&
              c >= highlight.col &&
              c < highlight.col + highlight.kSize;
            const isPad =
              padCells != null &&
              (r < padCells ||
                r >= grid.length - padCells ||
                c < padCells ||
                c >= row.length - padCells);
            return (
              <Cell
                key={`${r}-${c}`}
                value={isPad ? 0 : val}
                highlight={inReceptive}
                highlightColor={highlightColor}
                onClick={onCellClick ? () => onCellClick(r, c) : undefined}
                showNumber={showNumbers}
                numberValue={showNumbers ? val : undefined}
                size={cellSize}
                isMaxPoolWinner={maxPoolWinners?.has(`${r}-${c}`)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function KernelEditor({
  kernel,
  onChange,
}: {
  kernel: number[][];
  onChange: (k: number[][]) => void;
}) {
  const adjust = (r: number, c: number, delta: number) => {
    const next = kernel.map(row => [...row]);
    next[r][c] = clamp(next[r][c] + delta, -9, 9);
    onChange(next);
  };

  return (
    <div className="inline-flex flex-col gap-[2px]">
      {kernel.map((row, r) => (
        <div key={r} className="flex gap-[2px]">
          {row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className="relative flex flex-col items-center justify-center rounded-sm border border-accent-amber/40 bg-surface-light"
              style={{ width: 56, height: 44, minWidth: 56 }}
            >
              <span className="text-xs font-mono text-text leading-none mb-1">
                {val}
              </span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => adjust(r, c, -1)}
                  className="text-[9px] px-1 rounded bg-surface-lighter text-text-muted hover:bg-accent-red/20 hover:text-accent-red transition-colors leading-tight"
                  aria-label={`Decrease kernel ${r},${c}`}
                >
                  -
                </button>
                <button
                  onClick={() => adjust(r, c, 1)}
                  className="text-[9px] px-1 rounded bg-surface-lighter text-text-muted hover:bg-accent-green/20 hover:text-accent-green transition-colors leading-tight"
                  aria-label={`Increase kernel ${r},${c}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md border transition-colors
        ${
          active
            ? 'bg-primary/20 border-primary/40 text-primary-light'
            : 'bg-surface-light border-white/[0.06] text-text-muted hover:text-text hover:border-primary/30'
        }
      `}
    >
      {label}
    </button>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md border transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          variant === 'primary'
            ? 'bg-primary/20 border-primary/40 text-primary-light hover:bg-primary/30'
            : 'bg-surface-light border-white/[0.06] text-text-muted hover:text-text hover:border-primary/30'
        }
      `}
    >
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Section 1 – What Is Convolution?
   ──────────────────────────────────────────────────────────────────────────── */

function WhatIsConvolution() {
  return (
    <Section title="1. What Is Convolution?">
      <Prose>
        <p>
          A <strong>convolution</strong> is the core operation behind how neural
          networks process images. It works by sliding a small matrix of weights
          (a <em>kernel</em> or <em>filter</em>) across an input image,
          computing a weighted sum at every position. The result is a new grid
          called a <em>feature map</em> that encodes where certain patterns
          appear in the input.
        </p>
        <p>
          For a 2D input and a kernel of size K x K, the output at position
          (i, j) is defined as:
        </p>
      </Prose>

      <Eq block>
        <span className="text-accent-amber">output</span>[i, j] ={' '}
        <span className="text-text-muted">
          &Sigma;<sub>m=0</sub><sup>K-1</sup>{' '}
          &Sigma;<sub>n=0</sub><sup>K-1</sup>
        </span>{' '}
        <span className="text-primary-light">input</span>[i+m, j+n]{' '}
        <span className="text-text-muted">&times;</span>{' '}
        <span className="text-accent-purple">kernel</span>[m, n]
      </Eq>

      <Prose>
        <p>
          At each position the kernel overlaps a region of the input called the{' '}
          <strong>receptive field</strong>. We multiply every overlapping pair of
          values element-wise, then sum them all into a single output number.
          The kernel then slides one step to the right (or down at the end of a
          row) and the process repeats.
        </p>
        <p>
          This simple operation is surprisingly powerful: by learning the right
          kernel weights, a network can detect edges, corners, textures, and
          eventually complex objects — all from raw pixel values.
        </p>
      </Prose>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Section 2 – Interactive Convolution Demo
   ──────────────────────────────────────────────────────────────────────────── */

function ConvolutionDemo() {
  const [image, setImage] = useState<number[][]>(() =>
    INITIAL_IMAGE.map(r => [...r]),
  );
  const [kernel, setKernel] = useState<number[][]>([
    [-1, -1, -1],
    [0, 0, 0],
    [1, 1, 1],
  ]);
  const [activePreset, setActivePreset] = useState<string>('edgeH');
  const [stepMode, setStepMode] = useState(false);
  const [stepPos, setStepPos] = useState({ row: 0, col: 0 });

  const kSize = kernel.length;
  const outH = image.length - kSize + 1;
  const outW = (image[0]?.length ?? 0) - kSize + 1;
  const totalSteps = outH * outW;

  const output = useMemo(() => convolve(image, kernel), [image, kernel]);
  const normalizedOut = useMemo(() => normalizeOutput(output), [output]);

  const togglePixel = useCallback(
    (r: number, c: number) => {
      setImage(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = next[r][c] > 0.5 ? 0 : 1;
        return next;
      });
    },
    [],
  );

  const applyPreset = (key: string) => {
    setActivePreset(key);
    setKernel(PRESET_KERNELS[key].kernel.map(r => [...r]));
    setStepPos({ row: 0, col: 0 });
  };

  const stepForward = () => {
    setStepPos(prev => {
      let nextCol = prev.col + 1;
      let nextRow = prev.row;
      if (nextCol >= outW) {
        nextCol = 0;
        nextRow += 1;
      }
      if (nextRow >= outH) {
        return { row: 0, col: 0 };
      }
      return { row: nextRow, col: nextCol };
    });
  };

  const stepBack = () => {
    setStepPos(prev => {
      let nextCol = prev.col - 1;
      let nextRow = prev.row;
      if (nextCol < 0) {
        nextCol = outW - 1;
        nextRow -= 1;
      }
      if (nextRow < 0) {
        return { row: outH - 1, col: outW - 1 };
      }
      return { row: nextRow, col: nextCol };
    });
  };

  const currentStepIndex = stepPos.row * outW + stepPos.col;

  // Element-wise multiplication breakdown for current step
  const products = useMemo(() => {
    const res: { r: number; c: number; inputVal: number; kernelVal: number; product: number }[] = [];
    for (let m = 0; m < kSize; m++) {
      for (let n = 0; n < kSize; n++) {
        const iv = image[stepPos.row + m]?.[stepPos.col + n] ?? 0;
        const kv = kernel[m][n];
        res.push({ r: m, c: n, inputVal: iv, kernelVal: kv, product: iv * kv });
      }
    }
    return res;
  }, [image, kernel, stepPos, kSize]);

  const stepSum = products.reduce((s, p) => s + p.product, 0);

  const highlight = stepMode
    ? { row: stepPos.row, col: stepPos.col, kSize }
    : null;

  return (
    <Section title="2. Interactive Convolution Demo">
      <Prose>
        <p>
          Click cells in the input grid to paint pixels. Choose a preset kernel
          or edit weights manually. Toggle <strong>Step Mode</strong> to walk
          through the convolution one position at a time and see exactly how
          each output value is computed.
        </p>
      </Prose>

      <InteractiveDemo title="Convolution Playground">
        {/* Preset kernel buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(PRESET_KERNELS).map(([key, { name }]) => (
            <PresetButton
              key={key}
              label={name}
              active={activePreset === key}
              onClick={() => applyPreset(key)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-8 items-start">
          {/* Input grid */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Input (click to paint)
            </p>
            <PixelGrid
              grid={image}
              highlight={highlight}
              onCellClick={togglePixel}
            />
          </div>

          {/* Kernel editor */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Kernel (3 x 3)
            </p>
            <KernelEditor
              kernel={kernel}
              onChange={(k) => {
                setKernel(k);
                setActivePreset('');
              }}
            />
          </div>

          {/* Output feature map */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Output Feature Map
            </p>
            <PixelGrid
              grid={normalizedOut}
              showNumbers
              highlightColor="ring-primary"
              highlight={
                stepMode
                  ? { row: stepPos.row, col: stepPos.col, kSize: 1 }
                  : null
              }
            />
          </div>
        </div>

        {/* Step mode controls */}
        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <SmallButton
              onClick={() => {
                setStepMode(!stepMode);
                setStepPos({ row: 0, col: 0 });
              }}
              variant={stepMode ? 'primary' : 'default'}
            >
              {stepMode ? 'Exit Step Mode' : 'Step Mode'}
            </SmallButton>
            {stepMode && (
              <>
                <SmallButton onClick={stepBack}>
                  &larr; Prev
                </SmallButton>
                <SmallButton onClick={stepForward} variant="primary">
                  Next &rarr;
                </SmallButton>
                <span className="text-xs text-text-muted font-mono">
                  Step {currentStepIndex + 1} / {totalSteps} &mdash; pos ({stepPos.row}, {stepPos.col})
                </span>
              </>
            )}
          </div>

          {stepMode && (
            <div className="bg-surface rounded-lg border border-white/[0.06] p-4">
              <p className="text-xs text-text-muted mb-2">
                Element-wise multiplication at position ({stepPos.row}, {stepPos.col}):
              </p>
              <div className="flex flex-wrap items-center gap-1 font-mono text-xs mb-2">
                {products.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-0.5">
                    {i > 0 && <span className="text-text-muted mx-0.5">+</span>}
                    <span className="text-primary-light">{p.inputVal}</span>
                    <span className="text-text-muted">&times;</span>
                    <span className="text-accent-purple">{p.kernelVal}</span>
                    <span className="text-text-muted">=</span>
                    <span className="text-text">{p.product}</span>
                  </span>
                ))}
              </div>
              <p className="text-sm font-mono">
                <span className="text-text-muted">Sum = </span>
                <span className="text-accent-amber font-bold">{stepSum}</span>
                <span className="text-text-muted ml-2">(raw output value)</span>
              </p>
            </div>
          )}
        </div>

        {/* Clear / reset */}
        <div className="mt-3 flex gap-2">
          <SmallButton
            onClick={() => setImage(INITIAL_IMAGE.map(r => [...r]))}
          >
            Reset Image
          </SmallButton>
          <SmallButton
            onClick={() =>
              setImage(Array.from({ length: 7 }, () => Array(7).fill(0)))
            }
          >
            Clear Image
          </SmallButton>
        </div>
      </InteractiveDemo>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Section 3 – Stride and Padding
   ──────────────────────────────────────────────────────────────────────────── */

function StridePaddingSection() {
  const [inputSize, setInputSize] = useState(7);
  const [kernelSize, setKernelSize] = useState(3);
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(0);

  const outputSize = Math.floor((inputSize - kernelSize + 2 * padding) / stride) + 1;
  const valid = outputSize > 0;

  // Build a small visual grid for the stride/padding visualization
  const visInputSize = clamp(inputSize, 3, 9);
  const visPadding = clamp(padding, 0, 2);
  const paddedSize = visInputSize + 2 * visPadding;

  const visGrid = useMemo(() => {
    const g: number[][] = [];
    for (let r = 0; r < paddedSize; r++) {
      const row: number[] = [];
      for (let c = 0; c < paddedSize; c++) {
        const isPad =
          r < visPadding ||
          r >= paddedSize - visPadding ||
          c < visPadding ||
          c >= paddedSize - visPadding;
        row.push(isPad ? 0 : 0.4 + Math.random() * 0.3);
      }
      g.push(row);
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visInputSize, visPadding, paddedSize]);

  // Show stride positions
  const [strideStep, setStrideStep] = useState(0);
  const visKernel = clamp(kernelSize, 2, 5);
  const visOutW = Math.max(0, Math.floor((paddedSize - visKernel) / stride) + 1);
  const visOutH = visOutW;
  const maxStrideSteps = visOutW * visOutH;

  const strideRow = visOutH > 0 ? Math.floor(strideStep / visOutW) : 0;
  const strideCol = visOutW > 0 ? strideStep % visOutW : 0;
  const highlightRow = strideRow * stride;
  const highlightCol = strideCol * stride;

  return (
    <Section title="3. Stride and Padding">
      <Prose>
        <p>
          <strong>Stride</strong> controls how many positions the kernel jumps
          between each computation. A stride of 1 means the kernel moves one
          pixel at a time; a stride of 2 skips every other position, producing a
          smaller output.
        </p>
        <p>
          <strong>Padding</strong> adds extra zeros around the border of the
          input. This lets the kernel fully overlap the edge pixels and can
          preserve the spatial dimensions in the output.
        </p>
      </Prose>

      <Eq block>
        <span className="text-accent-amber">output_size</span> = &#8970;(
        <span className="text-primary-light">input_size</span> &minus;{' '}
        <span className="text-accent-purple">kernel_size</span> + 2 &times;{' '}
        <span className="text-accent-green">padding</span>) /{' '}
        <span className="text-accent-red">stride</span>&#8971; + 1
      </Eq>

      <InteractiveDemo title="Stride & Padding Calculator">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <ParameterSlider
            label="Input Size"
            value={inputSize}
            min={3}
            max={12}
            step={1}
            onChange={v => { setInputSize(v); setStrideStep(0); }}
          />
          <ParameterSlider
            label="Kernel Size"
            value={kernelSize}
            min={2}
            max={5}
            step={1}
            onChange={v => { setKernelSize(v); setStrideStep(0); }}
          />
          <ParameterSlider
            label="Stride"
            value={stride}
            min={1}
            max={4}
            step={1}
            onChange={v => { setStride(v); setStrideStep(0); }}
          />
          <ParameterSlider
            label="Padding"
            value={padding}
            min={0}
            max={3}
            step={1}
            onChange={v => { setPadding(v); setStrideStep(0); }}
          />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="px-4 py-2 rounded-lg bg-surface border border-white/[0.06]">
            <span className="text-xs text-text-muted">Output Size: </span>
            <span className={`font-mono text-sm font-bold ${valid ? 'text-accent-green' : 'text-accent-red'}`}>
              {valid ? `${outputSize} x ${outputSize}` : 'Invalid'}
            </span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-surface border border-white/[0.06]">
            <span className="text-xs text-text-muted">Padded Input: </span>
            <span className="font-mono text-sm text-text">
              {inputSize + 2 * padding} x {inputSize + 2 * padding}
            </span>
          </div>
        </div>

        {/* Visual grid */}
        <div className="flex flex-wrap gap-6 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Input {visPadding > 0 ? '(with padding)' : ''}
            </p>
            <PixelGrid
              grid={visGrid}
              cellSize={paddedSize > 10 ? 28 : CELL}
              padCells={visPadding}
              highlight={
                valid && maxStrideSteps > 0
                  ? { row: highlightRow, col: highlightCol, kSize: visKernel }
                  : null
              }
            />
          </div>
          {valid && maxStrideSteps > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
                Output positions
              </p>
              <div className="inline-flex flex-col gap-[2px]">
                {Array.from({ length: visOutH }, (_, r) => (
                  <div key={r} className="flex gap-[2px]">
                    {Array.from({ length: visOutW }, (_, c) => {
                      const idx = r * visOutW + c;
                      const isCurrent = idx === strideStep;
                      return (
                        <div
                          key={c}
                          className={`
                            flex items-center justify-center rounded-sm border transition-all duration-150
                            ${isCurrent ? 'border-accent-amber bg-accent-amber/20' : 'border-white/[0.06] bg-surface-light'}
                          `}
                          style={{
                            width: paddedSize > 10 ? 28 : CELL,
                            height: paddedSize > 10 ? 28 : CELL,
                          }}
                        >
                          <span className="text-[9px] font-mono text-text-muted">
                            {r},{c}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {valid && maxStrideSteps > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <SmallButton
              onClick={() => setStrideStep(s => (s - 1 + maxStrideSteps) % maxStrideSteps)}
            >
              &larr; Prev
            </SmallButton>
            <SmallButton
              onClick={() => setStrideStep(s => (s + 1) % maxStrideSteps)}
              variant="primary"
            >
              Next &rarr;
            </SmallButton>
            <span className="text-xs text-text-muted font-mono">
              Position {strideStep + 1} / {maxStrideSteps}
              {' '}&mdash; stride jumps to ({highlightRow}, {highlightCol})
            </span>
          </div>
        )}
      </InteractiveDemo>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Section 4 – Pooling Operations
   ──────────────────────────────────────────────────────────────────────────── */

function PoolingSection() {
  const [poolType, setPoolType] = useState<'max' | 'avg'>('max');
  const [activeWindow, setActiveWindow] = useState(0); // 0..3

  // 4x4 -> 2x2 pool with 2x2 window
  const windows = [
    { rowStart: 0, colStart: 0 },
    { rowStart: 0, colStart: 2 },
    { rowStart: 2, colStart: 0 },
    { rowStart: 2, colStart: 2 },
  ];

  const computePoolValue = (wIdx: number) => {
    const { rowStart, colStart } = windows[wIdx];
    const vals: number[] = [];
    for (let r = rowStart; r < rowStart + 2; r++) {
      for (let c = colStart; c < colStart + 2; c++) {
        vals.push(POOL_GRID[r][c]);
      }
    }
    if (poolType === 'max') return Math.max(...vals);
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };

  const poolOutput = windows.map((_, i) => computePoolValue(i));

  // Find max value position in the active window
  const { rowStart, colStart } = windows[activeWindow];
  const maxPoolWinners = new Set<string>();
  if (poolType === 'max') {
    let maxVal = -Infinity;
    let maxR = rowStart;
    let maxC = colStart;
    for (let r = rowStart; r < rowStart + 2; r++) {
      for (let c = colStart; c < colStart + 2; c++) {
        if (POOL_GRID[r][c] > maxVal) {
          maxVal = POOL_GRID[r][c];
          maxR = r;
          maxC = c;
        }
      }
    }
    maxPoolWinners.add(`${maxR}-${maxC}`);
  }

  return (
    <Section title="4. Pooling Operations">
      <Prose>
        <p>
          Pooling <strong>reduces the spatial dimensions</strong> of feature maps,
          cutting computation and making the network more robust to small
          translations. A pooling layer slides a window across the feature map
          (typically 2x2 with stride 2) and replaces each window with a single
          summary value.
        </p>
        <p>
          <strong>Max pooling</strong> takes the largest value in each window
          (keeping the strongest activation), while <strong>average pooling</strong>{' '}
          takes the mean. Max pooling is far more common in practice because it
          preserves the most prominent features.
        </p>
      </Prose>

      <InteractiveDemo title="Pooling Visualization">
        <div className="flex gap-3 mb-5">
          <PresetButton
            label="Max Pooling"
            active={poolType === 'max'}
            onClick={() => setPoolType('max')}
          />
          <PresetButton
            label="Average Pooling"
            active={poolType === 'avg'}
            onClick={() => setPoolType('avg')}
          />
        </div>

        <div className="flex flex-wrap gap-8 items-start">
          {/* Input 4x4 */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Input (4 x 4)
            </p>
            <PixelGrid
              grid={POOL_GRID.map(row => row.map(v => v / 8))}
              showNumbers
              cellSize={48}
              highlight={{
                row: windows[activeWindow].rowStart,
                col: windows[activeWindow].colStart,
                kSize: 2,
              }}
              maxPoolWinners={maxPoolWinners}
            />
            {/* Override numbers with actual ints */}
            <div className="absolute" style={{ display: 'none' }} />
          </div>

          {/* Arrow */}
          <div className="flex items-center self-center text-text-muted">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
              <path d="M0 12H32M32 12L24 4M32 12L24 20" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          {/* Output 2x2 */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Output (2 x 2) &mdash; {poolType === 'max' ? 'Max' : 'Average'} Pool
            </p>
            <div className="inline-flex flex-col gap-[2px]">
              {[0, 1].map(r => (
                <div key={r} className="flex gap-[2px]">
                  {[0, 1].map(c => {
                    const idx = r * 2 + c;
                    const val = poolOutput[idx];
                    const isActive = idx === activeWindow;
                    return (
                      <div
                        key={c}
                        onClick={() => setActiveWindow(idx)}
                        className={`
                          flex items-center justify-center rounded-sm border cursor-pointer
                          transition-all duration-150
                          ${isActive
                            ? 'border-accent-amber ring-2 ring-accent-amber/50 bg-accent-amber/10'
                            : 'border-white/[0.06] bg-surface-light hover:border-primary/30'
                          }
                        `}
                        style={{ width: 56, height: 56 }}
                      >
                        <span className="text-sm font-mono text-text font-bold">
                          {poolType === 'avg' ? val.toFixed(1) : val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explanation of current window */}
        <div className="mt-4 bg-surface rounded-lg border border-white/[0.06] p-4">
          <p className="text-xs text-text-muted mb-1">
            Window {activeWindow + 1} &mdash; rows [{rowStart}, {rowStart + 1}], cols [{colStart}, {colStart + 1}]:
          </p>
          <div className="font-mono text-sm text-text">
            Values:{' '}
            {[0, 1].map(dr =>
              [0, 1].map(dc => {
                const v = POOL_GRID[rowStart + dr][colStart + dc];
                const isWinner =
                  poolType === 'max' && maxPoolWinners.has(`${rowStart + dr}-${colStart + dc}`);
                return (
                  <span key={`${dr}-${dc}`}>
                    {(dr > 0 || dc > 0) && <span className="text-text-muted">, </span>}
                    <span className={isWinner ? 'text-accent-green font-bold' : 'text-text'}>{v}</span>
                  </span>
                );
              }),
            )}{' '}
            <span className="text-text-muted">&rarr; {poolType === 'max' ? 'max' : 'avg'} = </span>
            <span className="text-accent-amber font-bold">
              {poolType === 'avg' ? poolOutput[activeWindow].toFixed(1) : poolOutput[activeWindow]}
            </span>
          </div>
        </div>

        {/* Step through windows */}
        <div className="mt-3 flex gap-2">
          <SmallButton
            onClick={() => setActiveWindow(w => (w - 1 + 4) % 4)}
          >
            &larr; Prev Window
          </SmallButton>
          <SmallButton
            onClick={() => setActiveWindow(w => (w + 1) % 4)}
            variant="primary"
          >
            Next Window &rarr;
          </SmallButton>
        </div>
      </InteractiveDemo>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Section 5 – Building Feature Maps
   ──────────────────────────────────────────────────────────────────────────── */

function FeatureMapsSection() {
  const [activeKernel, setActiveKernel] = useState(0);

  const featureKernels = [
    { name: 'Horizontal Edges', kernel: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], color: 'text-accent-amber' },
    { name: 'Vertical Edges', kernel: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], color: 'text-accent-green' },
    { name: 'Emboss / Texture', kernel: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], color: 'text-accent-purple' },
  ];

  const featureMaps = useMemo(() => {
    return featureKernels.map(fk => normalizeOutput(convolve(INITIAL_IMAGE, fk.kernel)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Section title="5. Building Feature Maps">
      <Prose>
        <p>
          A single kernel produces a single feature map. In a real CNN, each
          convolutional layer applies <strong>many kernels</strong> in parallel
          (e.g. 32 or 64). Each kernel learns to respond to a different pattern,
          so the output of one layer is a <em>stack</em> of feature maps — one
          per kernel — that together describe what patterns appear where.
        </p>
        <p>
          Below, the same input letter "A" is convolved with three different
          kernels. Notice how each feature map highlights a different aspect of
          the shape: horizontal edges, vertical edges, and diagonal texture.
        </p>
      </Prose>

      <InteractiveDemo title="Multiple Feature Maps">
        <div className="flex gap-3 mb-5">
          {featureKernels.map((fk, i) => (
            <PresetButton
              key={i}
              label={fk.name}
              active={activeKernel === i}
              onClick={() => setActiveKernel(i)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-8 items-start">
          {/* Input */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Input
            </p>
            <PixelGrid grid={INITIAL_IMAGE} cellSize={32} />
          </div>

          {/* Kernel display */}
          <div>
            <p className={`text-[11px] uppercase tracking-wider mb-2 font-semibold ${featureKernels[activeKernel].color}`}>
              Kernel {activeKernel + 1}: {featureKernels[activeKernel].name}
            </p>
            <div className="inline-flex flex-col gap-[2px]">
              {featureKernels[activeKernel].kernel.map((row, r) => (
                <div key={r} className="flex gap-[2px]">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className="flex items-center justify-center rounded-sm border border-accent-amber/30 bg-surface-light"
                      style={{ width: 36, height: 36 }}
                    >
                      <span className="text-xs font-mono text-text">{val}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Feature map */}
          <div>
            <p className={`text-[11px] uppercase tracking-wider mb-2 font-semibold ${featureKernels[activeKernel].color}`}>
              Feature Map {activeKernel + 1}
            </p>
            <PixelGrid
              grid={featureMaps[activeKernel]}
              showNumbers
              cellSize={40}
            />
          </div>
        </div>

        {/* All three at once */}
        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-3 font-semibold">
            All Feature Maps Side by Side
          </p>
          <div className="flex flex-wrap gap-6">
            {featureMaps.map((fm, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 transition-colors cursor-pointer
                  ${activeKernel === i
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-white/[0.06] bg-surface hover:border-primary/20'
                  }
                `}
                onClick={() => setActiveKernel(i)}
              >
                <p className={`text-[10px] uppercase tracking-wider mb-2 font-semibold ${featureKernels[i].color}`}>
                  {featureKernels[i].name}
                </p>
                <PixelGrid grid={fm} cellSize={24} />
              </div>
            ))}
          </div>
        </div>
      </InteractiveDemo>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Section 6 – The Full CNN Pipeline
   ──────────────────────────────────────────────────────────────────────────── */

function PipelineSection() {
  const [activeStage, setActiveStage] = useState(0);

  const stageColors = [
    'border-primary/40 bg-primary/10',       // Input
    'border-accent-purple/40 bg-accent-purple/10', // Conv
    'border-accent-green/40 bg-accent-green/10',   // ReLU
    'border-accent-amber/40 bg-accent-amber/10',   // Pool
    'border-accent-purple/40 bg-accent-purple/10', // Conv
    'border-accent-green/40 bg-accent-green/10',   // ReLU
    'border-accent-amber/40 bg-accent-amber/10',   // Pool
    'border-text-muted/40 bg-text-muted/10',       // Flatten
    'border-primary/40 bg-primary/10',             // FC
    'border-accent-red/40 bg-accent-red/10',       // Output
  ];

  const stageTextColors = [
    'text-primary-light',
    'text-accent-purple',
    'text-accent-green',
    'text-accent-amber',
    'text-accent-purple',
    'text-accent-green',
    'text-accent-amber',
    'text-text-muted',
    'text-primary-light',
    'text-accent-red',
  ];

  return (
    <Section title="6. The Full CNN Pipeline">
      <Prose>
        <p>
          A complete CNN stacks multiple layers into a pipeline that
          progressively transforms raw pixels into a classification decision.
          Each layer has a specific role: convolutional layers extract features,
          ReLU adds non-linearity, pooling reduces spatial size, and fully
          connected layers combine everything for the final prediction.
        </p>
        <p>
          Click any stage below to see how the data dimensions change and what
          each layer contributes.
        </p>
      </Prose>

      <InteractiveDemo title="CNN Architecture Explorer">
        {/* Pipeline diagram */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => setActiveStage(i)}
                className={`
                  px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150
                  ${activeStage === i
                    ? `${stageColors[i]} ring-1 ring-white/20 scale-105`
                    : 'border-white/[0.06] bg-surface-light text-text-muted hover:border-primary/30 hover:text-text'
                  }
                `}
              >
                <div className={`font-semibold ${activeStage === i ? stageTextColors[i] : ''}`}>
                  {stage.label}
                </div>
                <div className="text-[10px] font-mono mt-0.5 opacity-70">{stage.dim}</div>
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-text-muted/50 mx-0.5 shrink-0">
                  <path d="M4 8H12M12 8L9 5M12 8L9 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Active stage detail */}
        <div className={`rounded-lg border p-5 transition-all duration-200 ${stageColors[activeStage]}`}>
          <div className="flex items-baseline gap-3 mb-3">
            <h4 className={`text-base font-bold ${stageTextColors[activeStage]}`}>
              {PIPELINE_STAGES[activeStage].label}
            </h4>
            <span className="text-xs font-mono text-text-muted">
              Output: {PIPELINE_STAGES[activeStage].dim}
            </span>
          </div>
          <p className="text-sm text-text leading-relaxed">
            {PIPELINE_STAGES[activeStage].desc}
          </p>

          {/* Dimension flow mini-diagram */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-wider text-text-muted/70 mb-2 font-semibold">
              Dimension flow
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {PIPELINE_STAGES.slice(0, activeStage + 1).map((s, i) => (
                <div key={i} className="flex items-center">
                  <span className={`text-[11px] font-mono ${i === activeStage ? stageTextColors[i] + ' font-bold' : 'text-text-muted'}`}>
                    {s.dim}
                  </span>
                  {i < activeStage && (
                    <span className="text-text-muted/40 mx-1">&rarr;</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </InteractiveDemo>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Section 7 – Why Convolution Works
   ──────────────────────────────────────────────────────────────────────────── */

function WhyConvWorks() {
  const inputSize = 28;
  const kernelSize = 5;
  const numFilters = 6;
  const fcInputs = inputSize * inputSize;
  const fcOutputs = (inputSize - kernelSize + 1) * (inputSize - kernelSize + 1) * numFilters;
  const fcParams = fcInputs * fcOutputs;
  const convParams = kernelSize * kernelSize * numFilters + numFilters; // weights + biases

  return (
    <Section title="7. Why Convolution Works">
      <Prose>
        <p>
          Two key ideas make convolution dramatically more efficient and
          effective than using fully connected layers on images:
        </p>
      </Prose>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parameter Sharing */}
        <div className="rounded-xl border border-accent-purple/20 bg-surface-light/50 p-5">
          <h3 className="text-sm font-bold text-accent-purple mb-2">Parameter Sharing</h3>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            A single kernel uses the <strong>same weights</strong> at every
            spatial position. Instead of learning unique weights for each pixel
            location, one small set of weights is reused across the entire image.
            This reduces the number of parameters by orders of magnitude.
          </p>
          <div className="bg-surface rounded-lg border border-white/[0.06] p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-text-muted">Fully Connected</span>
              <span className="font-mono text-xs text-accent-red">
                {fcParams.toLocaleString()} params
              </span>
            </div>
            <div className="w-full bg-surface-lighter rounded-full h-2 mb-3">
              <div className="bg-accent-red/60 h-2 rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-text-muted">
                Conv ({kernelSize}x{kernelSize}, {numFilters} filters)
              </span>
              <span className="font-mono text-xs text-accent-green">
                {convParams.toLocaleString()} params
              </span>
            </div>
            <div className="w-full bg-surface-lighter rounded-full h-2">
              <div
                className="bg-accent-green/60 h-2 rounded-full"
                style={{ width: `${Math.max(1, (convParams / fcParams) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              That is a <span className="text-accent-green font-bold">
                {Math.round(fcParams / convParams).toLocaleString()}x
              </span> reduction in parameters.
            </p>
          </div>
        </div>

        {/* Translation Invariance */}
        <div className="rounded-xl border border-accent-amber/20 bg-surface-light/50 p-5">
          <h3 className="text-sm font-bold text-accent-amber mb-2">Translation Invariance</h3>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            Because the same kernel is applied everywhere, a feature detector
            works <strong>regardless of position</strong>. An edge-detection
            kernel finds edges whether they appear in the top-left corner or the
            bottom-right. This means the network does not need to re-learn the
            same pattern for every possible location.
          </p>
          <div className="bg-surface rounded-lg border border-white/[0.06] p-3">
            {/* Visual: same kernel, two positions, same detection */}
            <div className="flex gap-4 items-center justify-center">
              {/* Position A */}
              <div className="text-center">
                <div className="inline-flex flex-col gap-[1px] mb-1">
                  {[
                    [1, 1, 0, 0, 0],
                    [1, 1, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                  ].map((row, r) => (
                    <div key={r} className="flex gap-[1px]">
                      {row.map((v, c) => (
                        <div
                          key={c}
                          className={`rounded-sm ${r < 2 && c < 2 ? 'ring-1 ring-accent-amber' : ''}`}
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: `rgba(241,245,249,${v})`,
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted">Top-left</p>
              </div>

              <span className="text-text-muted text-lg">=</span>

              {/* Position B */}
              <div className="text-center">
                <div className="inline-flex flex-col gap-[1px] mb-1">
                  {[
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 1, 1],
                    [0, 0, 0, 1, 1],
                  ].map((row, r) => (
                    <div key={r} className="flex gap-[1px]">
                      {row.map((v, c) => (
                        <div
                          key={c}
                          className={`rounded-sm ${r >= 3 && c >= 3 ? 'ring-1 ring-accent-amber' : ''}`}
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: `rgba(241,245,249,${v})`,
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted">Bottom-right</p>
              </div>
            </div>
            <p className="text-[11px] text-text-muted mt-2 text-center">
              Same kernel detects the same pattern at both positions.
            </p>
          </div>
        </div>
      </div>

      <Prose>
        <p>
          Together, parameter sharing and translation invariance make CNNs
          remarkably data-efficient for image tasks. A network with a few
          thousand convolutional parameters can outperform one with millions of
          fully-connected parameters, while also generalizing better to unseen
          inputs.
        </p>
      </Prose>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────────────────────────────────────── */

export default function CNNMathPage() {
  return (
    <MathLayout
      title="Convolutional Neural Networks"
      subtitle="How computers learn to see — the math of convolution, pooling, and feature extraction."
    >
      <WhatIsConvolution />
      <ConvolutionDemo />
      <StridePaddingSection />
      <PoolingSection />
      <FeatureMapsSection />
      <PipelineSection />
      <WhyConvWorks />
    </MathLayout>
  );
}
