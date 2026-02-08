import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MathLayout } from '../../components/math/MathLayout';
import { Section } from '../../components/math/Section';
import { Eq } from '../../components/math/Eq';
import { Prose } from '../../components/math/Prose';
import { InteractiveDemo } from '../../components/math/InteractiveDemo';
import { ParameterSlider } from '../../components/shared/ParameterSlider';

/* ─────────────────────────── helpers ─────────────────────────── */

/** Deterministic hash for a word -> seed for pseudo-random embedding */
function hashWord(word: string): number {
  let h = 0;
  for (let i = 0; i < word.length; i++) {
    h = (Math.imul(31, h) + word.charCodeAt(i)) | 0;
  }
  return h;
}

/** Seeded pseudo-random number generator (mulberry32) */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a consistent embedding vector for a word */
function wordEmbedding(word: string, dims: number): number[] {
  const rng = seededRandom(hashWord(word.toLowerCase()));
  return Array.from({ length: dims }, () => +(rng() * 2 - 1).toFixed(3));
}

/** Matrix multiply: A (m x n) * B (n x p) -> C (m x p) */
function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = B.length;
  const p = B[0].length;
  const C: number[][] = Array.from({ length: m }, () => new Array(p).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += A[i][k] * B[k][j];
      C[i][j] = +sum.toFixed(3);
    }
  }
  return C;
}

/** Transpose a matrix */
function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

/** Scale a matrix by scalar */
function scaleMatrix(A: number[][], s: number): number[][] {
  return A.map((row) => row.map((v) => +(v * s).toFixed(3)));
}

/** Row-wise softmax */
function softmaxRows(A: number[][]): number[][] {
  return A.map((row) => {
    const maxVal = Math.max(...row);
    const exps = row.map((v) => Math.exp(v - maxVal));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => +(e / sum).toFixed(3));
  });
}

/** ReLU element-wise */
function relu(A: number[][]): number[][] {
  return A.map((row) => row.map((v) => Math.max(0, v)));
}

/** Add two matrices element-wise */
function matAdd(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((v, j) => +(v + B[i][j]).toFixed(3)));
}

/** Layer normalization per row */
function layerNorm(A: number[][]): number[][] {
  return A.map((row) => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
    const std = Math.sqrt(variance + 1e-5);
    return row.map((v) => +((v - mean) / std).toFixed(3));
  });
}

/** Format number for display */
function fmt(n: number): string {
  return n >= 0 ? ` ${n.toFixed(2)}` : n.toFixed(2);
}

/* ───────────────────── shared sub-components ───────────────────── */

/** Renders a labeled matrix as a table */
function MatrixDisplay({
  label,
  data,
  rowLabels,
  colLabels,
  highlight,
}: {
  label: string;
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  highlight?: { row?: number; col?: number };
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</div>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          {colLabels && (
            <thead>
              <tr>
                {rowLabels && <th className="p-1" />}
                {colLabels.map((c, i) => (
                  <th
                    key={i}
                    className="p-1.5 text-[10px] text-text-muted font-mono font-normal text-center"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri}>
                {rowLabels && (
                  <td className="pr-2 text-[10px] text-text-muted font-mono whitespace-nowrap">
                    {rowLabels[ri]}
                  </td>
                )}
                {row.map((val, ci) => {
                  const isHighlighted =
                    highlight &&
                    (highlight.row === ri || highlight.row === undefined) &&
                    (highlight.col === ci || highlight.col === undefined);
                  return (
                    <td
                      key={ci}
                      className={`p-1.5 text-xs font-mono text-center border border-white/[0.06] ${
                        isHighlighted
                          ? 'bg-primary/20 ring-1 ring-primary text-text'
                          : 'bg-surface-light text-text-muted'
                      }`}
                    >
                      {fmt(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Step navigation buttons */
function StepNav({
  step,
  total,
  onPrev,
  onNext,
}: {
  step: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={onPrev}
        disabled={step === 0}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-lighter text-text-muted
          hover:bg-surface-lighter/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        &larr; Previous
      </button>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === step ? 'bg-primary' : 'bg-surface-lighter'
            }`}
          />
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={step === total - 1}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white
          hover:bg-primary-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next &rarr;
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 1: Architecture Overview
   ═══════════════════════════════════════════════════════════════════ */

const ARCH_BLOCKS = [
  { id: 'input', label: 'Input\nEmbedding', x: 160, y: 20, w: 120, h: 48, color: '#2563eb' },
  { id: 'pos', label: 'Positional\nEncoding', x: 160, y: 88, w: 120, h: 48, color: '#8b5cf6' },
  { id: 'mha', label: 'Multi-Head\nAttention', x: 160, y: 156, w: 120, h: 48, color: '#10b981' },
  { id: 'addnorm1', label: 'Add & Norm', x: 160, y: 224, w: 120, h: 36, color: '#f59e0b' },
  { id: 'ffn', label: 'Feed-Forward\nNetwork', x: 160, y: 280, w: 120, h: 48, color: '#ef4444' },
  { id: 'addnorm2', label: 'Add & Norm', x: 160, y: 348, w: 120, h: 36, color: '#f59e0b' },
  { id: 'output', label: 'Output', x: 160, y: 404, w: 120, h: 40, color: '#2563eb' },
] as const;

const BLOCK_DESCRIPTIONS: Record<string, string> = {
  input:
    'Token embeddings convert each input token (word or subword) into a dense vector of numbers. This learned lookup table maps discrete tokens to continuous vector representations.',
  pos: 'Positional encodings inject information about the order of tokens. Since attention has no inherent notion of position, these sinusoidal signals let the model know which token is first, second, etc.',
  mha: 'Multi-Head Attention is the core mechanism. Each head learns to attend to different aspects of the input. Queries, Keys, and Values are computed, attention scores calculated, and the results combined.',
  addnorm1:
    'A residual connection adds the attention output back to the input, then Layer Normalization stabilizes the values. This helps gradients flow and makes training stable.',
  ffn: 'A two-layer feed-forward network with a ReLU activation. It independently transforms each token position, expanding to a wider hidden dimension and projecting back.',
  addnorm2:
    'Another residual connection plus normalization after the feed-forward network. The encoder stacks N of these blocks.',
  output:
    'The final output is a sequence of contextualized embeddings. For generation tasks, a linear layer + softmax predicts the next token probability distribution.',
};

function ArchitectureOverview() {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  return (
    <InteractiveDemo title="Transformer Encoder Architecture">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* SVG diagram */}
        <div className="flex-shrink-0">
          <svg width="440" height="460" viewBox="0 0 440 460" className="mx-auto">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
            </defs>

            {/* Encoder bracket */}
            <rect
              x="140"
              y="136"
              width="160"
              height="264"
              rx="12"
              fill="none"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text x="310" y="270" fill="#475569" fontSize="10" fontFamily="monospace">
              x N
            </text>

            {/* Arrows between blocks */}
            {ARCH_BLOCKS.slice(0, -1).map((block, i) => {
              const next = ARCH_BLOCKS[i + 1];
              return (
                <line
                  key={`arrow-${i}`}
                  x1={block.x + block.w / 2}
                  y1={block.y + block.h}
                  x2={next.x + next.w / 2}
                  y2={next.y}
                  stroke="#475569"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              );
            })}

            {/* Residual connection arcs */}
            <path
              d="M 148 170 Q 110 200 148 236"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="3 3"
              markerEnd="url(#arrow)"
            />
            <path
              d="M 148 296 Q 110 326 148 356"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="3 3"
              markerEnd="url(#arrow)"
            />

            {/* Blocks */}
            {ARCH_BLOCKS.map((block) => {
              const isActive = activeBlock === block.id;
              return (
                <g
                  key={block.id}
                  onClick={() => setActiveBlock(isActive ? null : block.id)}
                  className="cursor-pointer"
                >
                  <rect
                    x={block.x}
                    y={block.y}
                    width={block.w}
                    height={block.h}
                    rx="8"
                    fill={isActive ? `${block.color}33` : '#1e293b'}
                    stroke={isActive ? block.color : '#475569'}
                    strokeWidth={isActive ? 2 : 1}
                    filter={isActive ? 'url(#glow)' : undefined}
                  />
                  {block.label.split('\n').map((line, li) => (
                    <text
                      key={li}
                      x={block.x + block.w / 2}
                      y={
                        block.y + block.h / 2 + (li - (block.label.split('\n').length - 1) / 2) * 14
                      }
                      fill={isActive ? block.color : '#94a3b8'}
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none select-none"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Description panel */}
        <div className="flex-1 min-w-0">
          {activeBlock ? (
            <div className="p-4 rounded-lg bg-surface-light border border-white/[0.06]">
              <div
                className="text-sm font-semibold mb-2"
                style={{ color: ARCH_BLOCKS.find((b) => b.id === activeBlock)?.color }}
              >
                {ARCH_BLOCKS.find((b) => b.id === activeBlock)?.label.replace('\n', ' ')}
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {BLOCK_DESCRIPTIONS[activeBlock]}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-surface-light/50 border border-white/[0.06] border-dashed">
              <p className="text-sm text-text-muted italic">
                Click on any block in the diagram to learn more about it.
              </p>
            </div>
          )}
        </div>
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 2: Token Embeddings
   ═══════════════════════════════════════════════════════════════════ */

const EMBED_DIMS = 6;

function TokenEmbeddingsDemo() {
  const [sentence, setSentence] = useState('The cat sat');
  const tokens = useMemo(
    () =>
      sentence
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0)
        .slice(0, 8),
    [sentence],
  );

  const embeddings = useMemo(() => tokens.map((t) => wordEmbedding(t, EMBED_DIMS)), [tokens]);

  const colLabels = Array.from({ length: EMBED_DIMS }, (_, i) => `d${i}`);

  return (
    <InteractiveDemo title="Token Embedding Lookup">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="token-embed-input" className="text-xs text-text-muted">
            Input sentence:
          </label>
          <input
            id="token-embed-input"
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-surface-light border border-white/[0.06]
              text-text focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Type a sentence..."
          />
        </div>

        {/* Token chips */}
        <div className="flex flex-wrap gap-2">
          {tokens.map((t, i) => (
            <span
              key={i}
              className="px-2.5 py-1 text-xs font-mono rounded-md bg-primary/10 text-primary-light border border-primary/20"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Embedding matrix */}
        {tokens.length > 0 && (
          <MatrixDisplay
            label={`Embedding Matrix (${tokens.length} x ${EMBED_DIMS})`}
            data={embeddings}
            rowLabels={tokens.map((t) => `"${t}"`)}
            colLabels={colLabels}
          />
        )}

        <p className="text-[11px] text-text-muted italic">
          Each word maps to a unique vector (seeded by word hash). In a real Transformer these are
          learned during training and are typically 512 or 768 dimensions.
        </p>
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 3: Positional Encoding
   ═══════════════════════════════════════════════════════════════════ */

function PositionalEncodingDemo() {
  const [dModel, setDModel] = useState(32);
  const [seqLen] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{ pos: number; dim: number; value: number } | null>(
    null,
  );

  const peMatrix = useMemo(() => {
    const mat: number[][] = [];
    for (let pos = 0; pos < seqLen; pos++) {
      const row: number[] = [];
      for (let i = 0; i < dModel; i++) {
        const dimIdx = Math.floor(i / 2);
        const angle = pos / Math.pow(10000, (2 * dimIdx) / dModel);
        row.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
      }
      mat.push(row);
    }
    return mat;
  }, [dModel, seqLen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cellW = Math.max(8, Math.floor(480 / dModel));
    const cellH = 14;
    const width = cellW * dModel;
    const height = cellH * seqLen;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.maxWidth = '100%';
    canvas.style.aspectRatio = `${width}/${height}`;
    ctx.scale(dpr, dpr);

    for (let pos = 0; pos < seqLen; pos++) {
      for (let dim = 0; dim < dModel; dim++) {
        const val = peMatrix[pos][dim]; // -1 to 1
        // Map to color: blue for negative, red for positive
        const t = (val + 1) / 2; // 0 to 1
        const r = Math.round(37 + t * (59 - 37) + t * 150);
        const g = Math.round(99 + (1 - Math.abs(val)) * 50);
        const b = Math.round(235 - t * 150);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(dim * cellW, pos * cellH, cellW - 1, cellH - 1);
      }
    }
  }, [peMatrix, dModel, seqLen]);

  const handleCanvasHover = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cellW = Math.max(8, Math.floor(480 / dModel));
      const cellH = 14;
      const cssW = cellW * dModel;
      const cssH = cellH * seqLen;
      // Account for responsive scaling (maxWidth: 100% may shrink the canvas)
      const scaleX = cssW / rect.width;
      const scaleY = cssH / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const dim = Math.floor(x / cellW);
      const pos = Math.floor(y / cellH);
      if (dim >= 0 && dim < dModel && pos >= 0 && pos < seqLen) {
        setHoverInfo({ pos, dim, value: peMatrix[pos][dim] });
      } else {
        setHoverInfo(null);
      }
    },
    [dModel, seqLen, peMatrix],
  );

  return (
    <InteractiveDemo title="Sinusoidal Positional Encoding Heatmap">
      <div className="space-y-4">
        <ParameterSlider
          label="d_model (embedding dimensions)"
          value={dModel}
          min={8}
          max={64}
          step={8}
          onChange={setDModel}
        />

        <div className="relative overflow-x-auto">
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasHover}
            onMouseLeave={() => setHoverInfo(null)}
            className="rounded-lg cursor-crosshair"
          />
          {/* Axis labels */}
          <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
            <span>dim 0</span>
            <span>Dimension &rarr;</span>
            <span>dim {dModel - 1}</span>
          </div>
          <div
            className="absolute left-[-4px] top-0 bottom-0 flex flex-col justify-between text-[10px] text-text-muted font-mono"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            <span>pos 0</span>
            <span>Position</span>
            <span>pos {seqLen - 1}</span>
          </div>
        </div>

        {hoverInfo && (
          <div className="text-xs font-mono text-text-muted bg-surface-light rounded-md px-3 py-2 border border-white/[0.06]">
            Position {hoverInfo.pos}, Dimension {hoverInfo.dim}:{' '}
            <span className="text-primary-light">{hoverInfo.value.toFixed(4)}</span>
          </div>
        )}

        <div className="flex gap-4 items-center text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(37, 99, 235)' }} />
            Negative (sin/cos &lt; 0)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(150, 120, 120)' }} />
            Near zero
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgb(235, 99, 37)' }} />
            Positive (sin/cos &gt; 0)
          </span>
        </div>

        <p className="text-[11px] text-text-muted italic">
          Low-index dimensions oscillate slowly (long wavelength), while high-index dimensions
          oscillate rapidly. This creates a unique "fingerprint" for each position that the model
          can use to determine relative and absolute positions.
        </p>
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 4: Self-Attention Step-Through
   ═══════════════════════════════════════════════════════════════════ */

// Fixed small weight matrices for demonstration
const DEMO_TOKENS = ['The', 'cat', 'sat'];
const D_MODEL = 4;
const D_K = 4;

const W_Q: number[][] = [
  [0.1, 0.2, -0.1, 0.3],
  [0.2, -0.1, 0.3, 0.1],
  [-0.1, 0.3, 0.2, -0.2],
  [0.3, 0.1, -0.2, 0.2],
];
const W_K: number[][] = [
  [0.2, -0.1, 0.1, 0.2],
  [-0.1, 0.2, 0.3, -0.1],
  [0.3, 0.1, -0.1, 0.3],
  [0.1, 0.3, 0.2, 0.1],
];
const W_V: number[][] = [
  [-0.1, 0.3, 0.1, 0.2],
  [0.2, 0.1, -0.2, 0.3],
  [0.1, -0.1, 0.3, 0.1],
  [0.3, 0.2, 0.1, -0.1],
];

function SelfAttentionDemo() {
  const [step, setStep] = useState(0);

  const X = useMemo(() => DEMO_TOKENS.map((t) => wordEmbedding(t, D_MODEL)), []);

  const Q = useMemo(() => matMul(X, W_Q), [X]);
  const K = useMemo(() => matMul(X, W_K), [X]);
  const V = useMemo(() => matMul(X, W_V), [X]);
  const QKt = useMemo(() => matMul(Q, transpose(K)), [Q, K]);
  const scaled = useMemo(() => scaleMatrix(QKt, 1 / Math.sqrt(D_K)), [QKt]);
  const attnWeights = useMemo(() => softmaxRows(scaled), [scaled]);
  const output = useMemo(() => matMul(attnWeights, V), [attnWeights, V]);

  const STEPS = [
    {
      title: 'Step 1: Input Matrix X',
      desc: 'We start with our token embeddings arranged as rows of a matrix.',
      content: (
        <MatrixDisplay
          label={`X (${DEMO_TOKENS.length} x ${D_MODEL})`}
          data={X}
          rowLabels={DEMO_TOKENS.map((t) => `"${t}"`)}
          colLabels={Array.from({ length: D_MODEL }, (_, i) => `d${i}`)}
        />
      ),
    },
    {
      title: 'Step 2: Compute Q, K, V',
      desc: 'Multiply X by three learned weight matrices to get Queries, Keys, and Values.',
      content: (
        <div className="space-y-4">
          <Eq block>
            <span className="text-accent-green">Q</span> = X &middot; W<sub>Q</sub> &nbsp;&nbsp;
            <span className="text-accent-amber">K</span> = X &middot; W<sub>K</sub> &nbsp;&nbsp;
            <span className="text-accent-red">V</span> = X &middot; W<sub>V</sub>
          </Eq>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MatrixDisplay label="Q (Queries)" data={Q} rowLabels={DEMO_TOKENS} />
            <MatrixDisplay label="K (Keys)" data={K} rowLabels={DEMO_TOKENS} />
            <MatrixDisplay label="V (Values)" data={V} rowLabels={DEMO_TOKENS} />
          </div>
        </div>
      ),
    },
    {
      title: 'Step 3: Attention Scores (Q * K^T)',
      desc: 'Dot product of every query with every key. High scores mean high relevance.',
      content: (
        <div className="space-y-4">
          <Eq block>
            Scores = Q &middot; K<sup>T</sup>
          </Eq>
          <MatrixDisplay
            label={`Q * K^T (${DEMO_TOKENS.length} x ${DEMO_TOKENS.length})`}
            data={QKt}
            rowLabels={DEMO_TOKENS.map((t) => `q:"${t}"`)}
            colLabels={DEMO_TOKENS.map((t) => `k:"${t}"`)}
          />
        </div>
      ),
    },
    {
      title: 'Step 4: Scale by sqrt(d_k)',
      desc: `Divide scores by sqrt(${D_K}) = ${Math.sqrt(D_K).toFixed(2)} to prevent large values from pushing softmax into extreme regions.`,
      content: (
        <div className="space-y-4">
          <Eq block>
            Scaled = Scores / &radic;d<sub>k</sub> = Scores / {Math.sqrt(D_K).toFixed(2)}
          </Eq>
          <MatrixDisplay
            label="Scaled Scores"
            data={scaled}
            rowLabels={DEMO_TOKENS.map((t) => `q:"${t}"`)}
            colLabels={DEMO_TOKENS.map((t) => `k:"${t}"`)}
          />
        </div>
      ),
    },
    {
      title: 'Step 5: Softmax (Attention Weights)',
      desc: 'Apply softmax row-wise so each row sums to 1. These are the attention weights.',
      content: (
        <div className="space-y-4">
          <Eq block>Weights = softmax(Scaled)</Eq>
          <MatrixDisplay
            label="Attention Weights (each row sums to 1)"
            data={attnWeights}
            rowLabels={DEMO_TOKENS.map((t) => `q:"${t}"`)}
            colLabels={DEMO_TOKENS.map((t) => `k:"${t}"`)}
          />
          {/* Visual weight bars */}
          <div className="space-y-2 mt-3">
            {DEMO_TOKENS.map((qt, qi) => (
              <div key={qi} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-text-muted w-12 text-right">
                  "{qt}"
                </span>
                <div className="flex gap-1 flex-1">
                  {DEMO_TOKENS.map((kt, ki) => (
                    <div
                      key={ki}
                      className="rounded-sm flex items-center justify-center text-[9px] font-mono"
                      style={{
                        width: `${Math.max(attnWeights[qi][ki] * 100, 10)}%`,
                        height: 24,
                        backgroundColor: `rgba(37, 99, 235, ${0.15 + attnWeights[qi][ki] * 0.7})`,
                        color: attnWeights[qi][ki] > 0.4 ? '#f1f5f9' : '#94a3b8',
                      }}
                    >
                      {kt}: {(attnWeights[qi][ki] * 100).toFixed(0)}%
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Step 6: Weighted Sum (Output)',
      desc: 'Multiply attention weights by Values. Each output row is a weighted mix of all value vectors.',
      content: (
        <div className="space-y-4">
          <Eq block>Output = Weights &middot; V</Eq>
          <MatrixDisplay
            label="Self-Attention Output"
            data={output}
            rowLabels={DEMO_TOKENS}
            colLabels={Array.from({ length: D_MODEL }, (_, i) => `d${i}`)}
          />
          <p className="text-[11px] text-text-muted">
            Each token's output is now a weighted combination of all tokens' values, weighted by how
            much attention that token pays to every other token.
          </p>
        </div>
      ),
    },
  ];

  return (
    <InteractiveDemo title="Self-Attention Step-by-Step with Real Numbers">
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-surface-light border border-white/[0.06]">
          <div className="text-sm font-semibold text-text mb-1">{STEPS[step].title}</div>
          <p className="text-xs text-text-muted">{STEPS[step].desc}</p>
        </div>
        {STEPS[step].content}
        <StepNav
          step={step}
          total={STEPS.length}
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        />
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 5: Attention Heatmap
   ═══════════════════════════════════════════════════════════════════ */

type AttentionPattern = 'uniform' | 'positional' | 'content-based';

function generateAttentionPattern(tokens: string[], pattern: AttentionPattern): number[][] {
  const n = tokens.length;

  if (pattern === 'uniform') {
    return Array.from({ length: n }, () => Array.from({ length: n }, () => +(1 / n).toFixed(3)));
  }

  if (pattern === 'positional') {
    const raw = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => Math.exp(-Math.abs(i - j) * 0.8)),
    );
    return softmaxRows(raw.map((r) => r.map((v) => Math.log(v + 1e-8))));
  }

  // content-based: simulate semantic similarity via word hash similarity
  const embs = tokens.map((t) => wordEmbedding(t, 8));
  const raw = embs.map((q) =>
    embs.map((k) => {
      let dot = 0;
      for (let i = 0; i < q.length; i++) dot += q[i] * k[i];
      return dot;
    }),
  );
  return softmaxRows(raw);
}

function AttentionHeatmap() {
  const SENTENCES = [
    'The cat sat on mat',
    'I love deep learning',
    'King queen prince princess',
    'The big red dog ran',
  ];
  const [sentIdx, setSentIdx] = useState(0);
  const [pattern, setPattern] = useState<AttentionPattern>('content-based');
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- SENTENCES is a module-level constant
  const tokens = useMemo(() => SENTENCES[sentIdx].split(' '), [sentIdx]);
  const weights = useMemo(() => generateAttentionPattern(tokens, pattern), [tokens, pattern]);

  return (
    <InteractiveDemo title="Attention Heatmap Visualization">
      <div className="space-y-4">
        {/* Controls row */}
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Sentence</span>
            <div className="flex flex-wrap gap-1.5">
              {SENTENCES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSentIdx(i)}
                  className={`px-2 py-1 text-[10px] font-mono rounded-md border transition-colors ${
                    i === sentIdx
                      ? 'bg-primary/20 border-primary text-primary-light'
                      : 'bg-surface-light border-white/[0.06] text-text-muted hover:bg-surface-lighter'
                  }`}
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Attention Pattern
          </span>
          <div className="flex gap-2">
            {(['uniform', 'positional', 'content-based'] as AttentionPattern[]).map((p) => (
              <button
                key={p}
                onClick={() => setPattern(p)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  pattern === p
                    ? 'bg-primary/20 border-primary text-primary-light'
                    : 'bg-surface-light border-white/[0.06] text-text-muted hover:bg-surface-lighter'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Column labels */}
            <div className="flex" style={{ marginLeft: 72 }}>
              {tokens.map((t, i) => (
                <div
                  key={i}
                  className="text-[10px] font-mono text-text-muted text-center"
                  style={{ width: 56 }}
                >
                  {t}
                </div>
              ))}
            </div>
            <div className="text-[9px] text-text-muted text-center mb-1" style={{ marginLeft: 72 }}>
              Keys &rarr;
            </div>

            {/* Rows */}
            {tokens.map((qt, ri) => (
              <div key={ri} className="flex items-center">
                <div className="w-[72px] text-[10px] font-mono text-text-muted text-right pr-2 flex-shrink-0">
                  {ri === 0 && <span className="text-[9px] block text-right">&darr; Queries</span>}
                  {qt}
                </div>
                {tokens.map((_, ci) => {
                  const w = weights[ri][ci];
                  const isHovered = hoverCell?.r === ri && hoverCell?.c === ci;
                  return (
                    <div
                      key={ci}
                      onMouseEnter={() => setHoverCell({ r: ri, c: ci })}
                      onMouseLeave={() => setHoverCell(null)}
                      className={`flex items-center justify-center transition-all duration-150 cursor-crosshair ${
                        isHovered ? 'ring-2 ring-primary-light z-10 scale-110' : ''
                      }`}
                      style={{
                        width: 56,
                        height: 40,
                        backgroundColor: `rgba(37, 99, 235, ${0.05 + w * 0.75})`,
                        margin: 1,
                        borderRadius: 4,
                      }}
                    >
                      <span
                        className="text-[10px] font-mono"
                        style={{
                          color: w > 0.35 ? '#f1f5f9' : '#94a3b8',
                        }}
                      >
                        {w.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {hoverCell && (
          <div className="text-xs font-mono bg-surface-light rounded-md px-3 py-2 border border-white/[0.06]">
            <span className="text-primary-light">"{tokens[hoverCell.r]}"</span> attends to{' '}
            <span className="text-primary-light">"{tokens[hoverCell.c]}"</span> with weight{' '}
            <span className="text-accent-green font-bold">
              {(weights[hoverCell.r][hoverCell.c] * 100).toFixed(1)}%
            </span>
          </div>
        )}

        <p className="text-[11px] text-text-muted italic">
          <strong>Uniform:</strong> every token attends equally. <strong>Positional:</strong> nearby
          tokens get more attention. <strong>Content-based:</strong> attention driven by embedding
          similarity (simulated).
        </p>
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 6: Multi-Head Attention
   ═══════════════════════════════════════════════════════════════════ */

function MultiHeadDemo() {
  const [activeHead, setActiveHead] = useState(0);
  const NUM_HEADS = 4;
  const tokens = ['The', 'cat', 'sat', 'on'];

  // Generate different attention patterns for each head
  const headWeights = useMemo(() => {
    return Array.from({ length: NUM_HEADS }, (_, h) => {
      const rng = seededRandom(42 + h * 1000);
      const raw = Array.from({ length: tokens.length }, () =>
        Array.from({ length: tokens.length }, () => rng() * 2 - 0.5),
      );
      return softmaxRows(raw);
    });
  }, []);

  const headLabels = ['Head 1: Position', 'Head 2: Syntax', 'Head 3: Semantics', 'Head 4: Global'];
  const headColors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <InteractiveDemo title="Multi-Head Attention (4 Heads)">
      <div className="space-y-4">
        {/* Head selector */}
        <div className="flex gap-2 flex-wrap">
          {headLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setActiveHead(i)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                activeHead === i
                  ? 'border-opacity-100 text-white'
                  : 'border-white/[0.06] bg-surface-light text-text-muted hover:bg-surface-lighter'
              }`}
              style={
                activeHead === i
                  ? {
                      backgroundColor: `${headColors[i]}33`,
                      borderColor: headColors[i],
                      color: headColors[i],
                    }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mini heatmaps side by side */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {headWeights.map((hw, h) => (
            <button
              type="button"
              key={h}
              onClick={() => setActiveHead(h)}
              className={`p-2 rounded-lg border cursor-pointer transition-all text-left ${
                activeHead === h ? 'ring-2' : 'border-white/[0.06]'
              }`}
              style={
                activeHead === h
                  ? { borderColor: headColors[h], boxShadow: `0 0 12px ${headColors[h]}22` }
                  : undefined
              }
            >
              <div className="text-[9px] font-semibold text-text-muted mb-1 text-center">
                Head {h + 1}
              </div>
              <div
                className="grid gap-[2px]"
                style={{ gridTemplateColumns: `repeat(${tokens.length}, 1fr)` }}
              >
                {hw.flat().map((w, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[2px]"
                    style={{
                      backgroundColor: `${headColors[h]}`,
                      opacity: 0.1 + w * 0.8,
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Detailed view of active head */}
        <div className="overflow-x-auto">
          <table className="border-collapse mx-auto">
            <thead>
              <tr>
                <th className="p-1" />
                {tokens.map((t, i) => (
                  <th key={i} className="p-1.5 text-[10px] font-mono text-text-muted text-center">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.map((qt, ri) => (
                <tr key={ri}>
                  <td className="pr-2 text-[10px] font-mono text-text-muted">{qt}</td>
                  {tokens.map((_, ci) => {
                    const w = headWeights[activeHead][ri][ci];
                    return (
                      <td
                        key={ci}
                        className="p-1.5 text-[10px] font-mono text-center border border-white/[0.04]"
                        style={{
                          backgroundColor: `${headColors[activeHead]}${Math.round(
                            (0.05 + w * 0.75) * 255,
                          )
                            .toString(16)
                            .padStart(2, '0')}`,
                          color: w > 0.35 ? '#f1f5f9' : '#94a3b8',
                        }}
                      >
                        {w.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Eq block>
          <span className="text-text-muted text-sm">
            MultiHead = Concat(head<sub>1</sub>, ..., head<sub>h</sub>) &middot; W<sup>O</sup>
          </span>
        </Eq>

        <p className="text-[11px] text-text-muted">
          Each head produces a different attention pattern, capturing different relationships. The
          outputs are concatenated and projected through W<sup>O</sup> to get the final result.
        </p>
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 7: Feed-Forward Network
   ═══════════════════════════════════════════════════════════════════ */

function VectorBar({
  values,
  label,
  color,
  maxAbs,
}: {
  values: number[];
  label: string;
  color: string;
  maxAbs: number;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
        {label} ({values.length} dims)
      </div>
      <div className="flex gap-1">
        {values.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5" style={{ flex: 1 }}>
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: Math.max(4, (Math.abs(v) / maxAbs) * 40),
                backgroundColor: v >= 0 ? color : '#ef4444',
                opacity: 0.3 + (Math.abs(v) / maxAbs) * 0.7,
              }}
            />
            <span className="text-[8px] font-mono text-text-muted">{v.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedForwardDemo() {
  const [inputVec, setInputVec] = useState([0.5, -0.3, 0.8, -0.1]);
  const D_FF = 8; // expansion factor of 2x

  // Simple weight matrices for demo
  const W1 = useMemo(() => {
    const rng = seededRandom(777);
    return Array.from({ length: D_MODEL }, () =>
      Array.from({ length: D_FF }, () => +(rng() * 1.5 - 0.75).toFixed(3)),
    );
  }, []);

  const b1 = useMemo(() => {
    const rng = seededRandom(888);
    return Array.from({ length: D_FF }, () => +(rng() * 0.2 - 0.1).toFixed(3));
  }, []);

  const W2 = useMemo(() => {
    const rng = seededRandom(999);
    return Array.from({ length: D_FF }, () =>
      Array.from({ length: D_MODEL }, () => +(rng() * 1.5 - 0.75).toFixed(3)),
    );
  }, []);

  const b2 = useMemo(() => {
    const rng = seededRandom(1111);
    return Array.from({ length: D_MODEL }, () => +(rng() * 0.2 - 0.1).toFixed(3));
  }, []);

  const hidden = useMemo(() => {
    const xW1 = matMul([inputVec], W1)[0];
    return xW1.map((v, i) => +(v + b1[i]).toFixed(3));
  }, [inputVec, W1, b1]);

  const afterRelu = useMemo(() => hidden.map((v) => Math.max(0, v)), [hidden]);

  const outputVec = useMemo(() => {
    const hW2 = matMul([afterRelu], W2)[0];
    return hW2.map((v, i) => +(v + b2[i]).toFixed(3));
  }, [afterRelu, W2, b2]);

  const maxAbs = Math.max(
    ...inputVec.map(Math.abs),
    ...hidden.map(Math.abs),
    ...afterRelu.map(Math.abs),
    ...outputVec.map(Math.abs),
    0.01,
  );

  return (
    <InteractiveDemo title="Feed-Forward Network (Single Token)">
      <div className="space-y-5">
        <Eq block>
          FFN(x) = ReLU(x W<sub>1</sub> + b<sub>1</sub>) W<sub>2</sub> + b<sub>2</sub>
        </Eq>

        {/* Input sliders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {inputVec.map((v, i) => (
            <ParameterSlider
              key={i}
              label={`x[${i}]`}
              value={v}
              min={-1}
              max={1}
              step={0.1}
              onChange={(newVal) => {
                const next = [...inputVec];
                next[i] = +newVal.toFixed(1);
                setInputVec(next);
              }}
              format={(v) => v.toFixed(1)}
            />
          ))}
        </div>

        {/* Visual pipeline */}
        <div className="space-y-3">
          <VectorBar values={inputVec} label="Input x" color="#2563eb" maxAbs={maxAbs} />
          <div className="text-center text-text-muted text-xs">
            &darr; Linear (4 &rarr; 8) + bias
          </div>
          <VectorBar values={hidden} label="Hidden (pre-ReLU)" color="#8b5cf6" maxAbs={maxAbs} />
          <div className="text-center text-text-muted text-xs">
            &darr; ReLU (negative values &rarr; 0)
          </div>
          <VectorBar
            values={afterRelu}
            label="Hidden (post-ReLU)"
            color="#10b981"
            maxAbs={maxAbs}
          />
          <div className="text-center text-text-muted text-xs">
            &darr; Linear (8 &rarr; 4) + bias
          </div>
          <VectorBar values={outputVec} label="FFN Output" color="#f59e0b" maxAbs={maxAbs} />
        </div>

        <p className="text-[11px] text-text-muted italic">
          The FFN expands the representation to a wider hidden dimension (typically 4x), applies
          non-linearity, then compresses back. This happens independently at each token position.
        </p>
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 8: Layer Normalization
   ═══════════════════════════════════════════════════════════════════ */

function LayerNormDemo() {
  const [values, setValues] = useState([2.0, -1.0, 0.5, 3.5]);

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance + 1e-5);
  const normalized = values.map((v) => +((v - mean) / std).toFixed(3));

  return (
    <InteractiveDemo title="Layer Normalization">
      <div className="space-y-4">
        <Eq block>
          LayerNorm(x<sub>i</sub>) = &gamma; &middot; (x<sub>i</sub> - &mu;) / &sigma; + &beta;
        </Eq>

        {/* Sliders for input values */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {values.map((v, i) => (
            <ParameterSlider
              key={i}
              label={`x[${i}]`}
              value={v}
              min={-5}
              max={5}
              step={0.5}
              onChange={(newVal) => {
                const next = [...values];
                next[i] = +newVal.toFixed(1);
                setValues(next);
              }}
              format={(v) => v.toFixed(1)}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-xs font-mono">
          <span className="text-text-muted">
            &mu; = <span className="text-accent-amber">{mean.toFixed(3)}</span>
          </span>
          <span className="text-text-muted">
            &sigma; = <span className="text-accent-green">{std.toFixed(3)}</span>
          </span>
        </div>

        {/* Before/after comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Before Normalization
            </div>
            <div className="flex gap-2">
              {values.map((v, i) => {
                const maxAbs = Math.max(...values.map(Math.abs), 0.01);
                const height = (Math.abs(v) / maxAbs) * 60;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className="h-[64px] w-full flex items-end justify-center">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: Math.max(4, height),
                          backgroundColor: v >= 0 ? '#2563eb' : '#ef4444',
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-text-muted">{v.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              After Normalization
            </div>
            <div className="flex gap-2">
              {normalized.map((v, i) => {
                const maxAbs = Math.max(...normalized.map(Math.abs), 0.01);
                const height = (Math.abs(v) / maxAbs) * 60;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className="h-[64px] w-full flex items-end justify-center">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: Math.max(4, height),
                          backgroundColor: v >= 0 ? '#10b981' : '#ef4444',
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-text-muted">{v.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-text-muted italic">
          Layer normalization centers values around zero with unit variance. The learnable
          parameters &gamma; (scale) and &beta; (shift) allow the model to undo the normalization
          when needed. Here we show just the normalization step (&gamma;=1, &beta;=0). This
          stabilizes training by preventing values from growing too large or too small across layers.
        </p>
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section 9: Full Pipeline Animation
   ═══════════════════════════════════════════════════════════════════ */

const PIPELINE_STAGES = [
  { id: 'embed', label: 'Token Embedding', shape: '(3, 4)', color: '#2563eb' },
  { id: 'pos', label: '+ Positional Enc', shape: '(3, 4)', color: '#8b5cf6' },
  { id: 'qkv', label: 'Q, K, V Projection', shape: '3 x (3, 4)', color: '#10b981' },
  { id: 'attn', label: 'Attention Weights', shape: '(3, 3)', color: '#10b981' },
  { id: 'attn_out', label: 'Attention Output', shape: '(3, 4)', color: '#10b981' },
  { id: 'addnorm1', label: 'Add & LayerNorm', shape: '(3, 4)', color: '#f59e0b' },
  { id: 'ffn_expand', label: 'FFN Expand', shape: '(3, 8)', color: '#ef4444' },
  { id: 'ffn_relu', label: 'ReLU', shape: '(3, 8)', color: '#ef4444' },
  { id: 'ffn_proj', label: 'FFN Project', shape: '(3, 4)', color: '#ef4444' },
  { id: 'addnorm2', label: 'Add & LayerNorm', shape: '(3, 4)', color: '#f59e0b' },
  { id: 'output', label: 'Encoder Output', shape: '(3, 4)', color: '#2563eb' },
] as const;

function FullPipelineDemo() {
  const [activeStage, setActiveStage] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute actual data at each stage
  const tokens = DEMO_TOKENS;
  const X = useMemo(() => tokens.map((t) => wordEmbedding(t, D_MODEL)), [tokens]);

  const PE = useMemo(() => {
    const mat: number[][] = [];
    for (let pos = 0; pos < tokens.length; pos++) {
      const row: number[] = [];
      for (let i = 0; i < D_MODEL; i++) {
        const dimIdx = Math.floor(i / 2);
        const angle = pos / Math.pow(10000, (2 * dimIdx) / D_MODEL);
        row.push(+(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle)).toFixed(3));
      }
      mat.push(row);
    }
    return mat;
  }, [tokens.length]);

  const XplusPE = useMemo(() => matAdd(X, PE), [X, PE]);
  const Q = useMemo(() => matMul(XplusPE, W_Q), [XplusPE]);
  const K = useMemo(() => matMul(XplusPE, W_K), [XplusPE]);
  const V = useMemo(() => matMul(XplusPE, W_V), [XplusPE]);
  const attnScores = useMemo(
    () => softmaxRows(scaleMatrix(matMul(Q, transpose(K)), 1 / Math.sqrt(D_K))),
    [Q, K],
  );
  const attnOut = useMemo(() => matMul(attnScores, V), [attnScores, V]);
  const addNorm1 = useMemo(() => layerNorm(matAdd(XplusPE, attnOut)), [XplusPE, attnOut]);

  // FFN with simple matrices
  const W1ff = useMemo(() => {
    const rng = seededRandom(555);
    return Array.from({ length: D_MODEL }, () =>
      Array.from({ length: 8 }, () => +(rng() * 1.0 - 0.5).toFixed(3)),
    );
  }, []);
  const W2ff = useMemo(() => {
    const rng = seededRandom(666);
    return Array.from({ length: 8 }, () =>
      Array.from({ length: D_MODEL }, () => +(rng() * 1.0 - 0.5).toFixed(3)),
    );
  }, []);

  const ffnExpanded = useMemo(() => matMul(addNorm1, W1ff), [addNorm1, W1ff]);
  const ffnRelu = useMemo(() => relu(ffnExpanded), [ffnExpanded]);
  const ffnOut = useMemo(() => matMul(ffnRelu, W2ff), [ffnRelu, W2ff]);
  const addNorm2 = useMemo(() => layerNorm(matAdd(addNorm1, ffnOut)), [addNorm1, ffnOut]);

  const stageData: (number[][] | null)[] = [
    X,
    XplusPE,
    Q, // show Q as representative of QKV step
    attnScores,
    attnOut,
    addNorm1,
    ffnExpanded,
    ffnRelu,
    ffnOut,
    addNorm2,
    addNorm2,
  ];

  const runAnimation = useCallback(() => {
    setActiveStage(0);
    setIsRunning(true);
    let i = 0;
    const advance = () => {
      i++;
      if (i < PIPELINE_STAGES.length) {
        setActiveStage(i);
        timerRef.current = setTimeout(advance, 700);
      } else {
        setIsRunning(false);
      }
    };
    timerRef.current = setTimeout(advance, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <InteractiveDemo title="Full Encoder Pipeline — Animated Data Flow">
      <div className="space-y-4">
        <button
          onClick={runAnimation}
          disabled={isRunning}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white
            hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Pipeline'}
        </button>

        {/* Pipeline stages */}
        <div className="space-y-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const isActive = i === activeStage;
            const isPast = i < activeStage;
            return (
              <button
                type="button"
                key={stage.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer text-left w-full ${
                  isActive
                    ? 'bg-surface-lighter ring-1'
                    : isPast
                      ? 'bg-surface-light/50'
                      : 'bg-transparent'
                }`}
                style={
                  isActive
                    ? { outlineColor: stage.color, boxShadow: `0 0 12px ${stage.color}33` }
                    : undefined
                }
                onClick={() => {
                  if (!isRunning) setActiveStage(i);
                }}
              >
                {/* Stage indicator */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: isActive || isPast ? `${stage.color}33` : '#1e293b',
                    border: `2px solid ${isActive ? stage.color : isPast ? `${stage.color}88` : '#475569'}`,
                    color: isActive ? stage.color : isPast ? `${stage.color}cc` : '#475569',
                  }}
                >
                  {isPast && !isActive ? '✓' : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="text-xs font-medium transition-colors"
                    style={{ color: isActive ? stage.color : isPast ? '#f1f5f9' : '#94a3b8' }}
                  >
                    {stage.label}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                  {stage.shape}
                </span>
              </button>
            );
          })}
        </div>

        {/* Show matrix for current stage */}
        {activeStage >= 0 && stageData[activeStage] && (
          <div className="mt-3 p-3 rounded-lg bg-surface-light border border-white/[0.06]">
            <MatrixDisplay
              label={`${PIPELINE_STAGES[activeStage].label} — shape: ${PIPELINE_STAGES[activeStage].shape}`}
              data={stageData[activeStage]!}
              rowLabels={stageData[activeStage]!.length === tokens.length ? tokens : undefined}
            />
          </div>
        )}
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function TransformerMathPage() {
  return (
    <MathLayout
      title="The Transformer"
      subtitle="The architecture behind modern AI — self-attention, multi-head attention, and the math that makes language models work."
    >
      {/* ── Section 1: Big Picture ── */}
      <Section title="1. The Big Picture">
        <Prose>
          <p>
            The Transformer architecture, introduced in 2017, revolutionized natural language
            processing by replacing recurrence with <strong>self-attention</strong>. Instead of
            processing tokens one at a time, a Transformer looks at the entire sequence
            simultaneously, learning which tokens are relevant to each other.
          </p>
          <p>
            A Transformer encoder processes an input sequence through repeated blocks of multi-head
            attention and feed-forward networks, connected by residual connections and layer
            normalization. Let's explore each component with real numbers.
          </p>
        </Prose>
        <ArchitectureOverview />
      </Section>

      {/* ── Section 2: Token Embeddings ── */}
      <Section title="2. Token Embeddings">
        <Prose>
          <p>
            Before a Transformer can process text, each token must be converted into a numerical
            vector. An <strong>embedding layer</strong> acts as a learned lookup table: each token
            in the vocabulary maps to a dense vector of real numbers.
          </p>
          <p>
            The embedding dimension <Eq>d_model</Eq> is typically 512 or 768 in practice. Here we
            use {EMBED_DIMS} dimensions to keep things visible. The key insight: similar words end
            up with similar vectors after training.
          </p>
        </Prose>
        <TokenEmbeddingsDemo />
      </Section>

      {/* ── Section 3: Positional Encoding ── */}
      <Section title="3. Positional Encoding">
        <Prose>
          <p>
            Unlike RNNs, Transformers process all tokens in parallel with no inherent sense of
            order. <strong>Positional encodings</strong> are added to the embeddings to inject
            information about each token's position in the sequence.
          </p>
          <p>The original Transformer uses sinusoidal positional encodings:</p>
        </Prose>
        <Eq block>
          <span>
            PE<sub>(pos, 2i)</sub> = sin(pos / 10000<sup>2i/d</sup>)
          </span>
          <span className="mx-4 text-text-muted">,</span>
          <span>
            PE<sub>(pos, 2i+1)</sub> = cos(pos / 10000<sup>2i/d</sup>)
          </span>
        </Eq>
        <Prose>
          <p>
            Each dimension oscillates at a different frequency. Low dimensions have long wavelengths
            (slow variation across positions), while high dimensions have short wavelengths (rapid
            oscillation). This creates a unique positional "fingerprint" that the model can use to
            determine both absolute and relative token positions.
          </p>
        </Prose>
        <PositionalEncodingDemo />
      </Section>

      {/* ── Section 4: Self-Attention ── */}
      <Section title="4. Self-Attention Mechanism">
        <Prose>
          <p>
            Self-attention is the heart of the Transformer. For each token, it computes how much
            "attention" to pay to every other token in the sequence. Three projections are computed:
          </p>
          <p>
            <strong>Query (Q):</strong> "What am I looking for?"
            <br />
            <strong>Key (K):</strong> "What do I contain?"
            <br />
            <strong>Value (V):</strong> "What information do I provide?"
          </p>
          <p>The attention formula computes scaled dot-product attention:</p>
        </Prose>
        <Eq block>
          Attention(Q, K, V) = softmax(Q K<sup>T</sup> / &radic;d<sub>k</sub>) &middot; V
        </Eq>
        <Prose>
          <p>
            Walk through each step below with actual numbers. Notice how the matrix dimensions
            transform at each stage.
          </p>
        </Prose>
        <SelfAttentionDemo />
      </Section>

      {/* ── Section 5: Attention Heatmap ── */}
      <Section title="5. Attention Patterns Visualized">
        <Prose>
          <p>
            Attention weights form a matrix where each row shows how one token distributes its
            "focus" across all tokens. Different patterns emerge depending on the task: some heads
            attend to nearby words (positional), others to semantically related words
            (content-based), and some spread attention uniformly.
          </p>
        </Prose>
        <AttentionHeatmap />
      </Section>

      {/* ── Section 6: Multi-Head Attention ── */}
      <Section title="6. Multi-Head Attention">
        <Prose>
          <p>
            A single attention computation can only capture one type of relationship.{' '}
            <strong>Multi-head attention</strong> runs attention multiple times in parallel, each
            with different learned projection matrices. This lets the model simultaneously attend to
            information from different representation subspaces.
          </p>
          <p>
            With <Eq>h</Eq> heads and <Eq>d_model = 512</Eq>, each head operates on{' '}
            <Eq>d_k = d_model / h = 64</Eq> dimensions. The outputs from all heads are concatenated
            and projected back to <Eq>d_model</Eq> dimensions.
          </p>
        </Prose>
        <MultiHeadDemo />
      </Section>

      {/* ── Section 7: Feed-Forward Network ── */}
      <Section title="7. Feed-Forward Network">
        <Prose>
          <p>
            After attention, each token passes through a position-wise feed-forward network. This is
            a simple two-layer neural network applied independently to each token position:
          </p>
        </Prose>
        <Eq block>
          FFN(x) = max(0, x W<sub>1</sub> + b<sub>1</sub>) W<sub>2</sub> + b<sub>2</sub>
        </Eq>
        <Prose>
          <p>
            The inner dimension is typically 4x larger than <Eq>d_model</Eq> (e.g., 2048 for a
            512-dim model). The expansion-compression pattern lets the network learn complex
            transformations at each position.
          </p>
        </Prose>
        <FeedForwardDemo />
      </Section>

      {/* ── Section 8: Layer Normalization ── */}
      <Section title="8. Layer Normalization">
        <Prose>
          <p>
            Between each sub-layer, the Transformer applies <strong>layer normalization</strong>.
            Unlike batch normalization, layer norm normalizes across the feature dimension for each
            individual token. This keeps activations stable throughout the deep network.
          </p>
          <p>
            For each token vector, we compute the mean and standard deviation, then normalize so the
            features have zero mean and unit variance:
          </p>
        </Prose>
        <LayerNormDemo />
      </Section>

      {/* ── Section 9: Full Pipeline ── */}
      <Section title="9. Putting It All Together">
        <Prose>
          <p>
            Now let's watch data flow through the complete Transformer encoder block. Starting from
            token embeddings, the data passes through positional encoding, multi-head attention,
            add-and-normalize, the feed-forward network, and another add-and-normalize. Click "Run
            Pipeline" to animate the data flow and see the actual matrix values at each stage.
          </p>
        </Prose>
        <FullPipelineDemo />
        <Prose>
          <p>
            In a full Transformer, this encoder block is repeated <Eq>N</Eq> times (typically 6 or
            12 layers). Each layer refines the representations, building increasingly abstract and
            contextualized features. The decoder adds cross-attention to the encoder output and
            masked self-attention to prevent future token leakage during generation.
          </p>
        </Prose>
      </Section>
    </MathLayout>
  );
}
