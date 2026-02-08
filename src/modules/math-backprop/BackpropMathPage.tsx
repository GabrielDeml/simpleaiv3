import { useState, useRef, useEffect, useCallback } from 'react';
import { MathLayout } from '../../components/math/MathLayout';
import { Section } from '../../components/math/Section';
import { Eq } from '../../components/math/Eq';
import { Prose } from '../../components/math/Prose';
import { InteractiveDemo } from '../../components/math/InteractiveDemo';
import { ParameterSlider } from '../../components/shared/ParameterSlider';

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const sigmoidDeriv = (s: number) => s * (1 - s); // derivative given sigmoid *output*
const fmt = (v: number, d = 4) => v.toFixed(d);

const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceLighter: '#334155',
  border: '#475569',
  text: '#f1f5f9',
  muted: '#94a3b8',
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
};

/* ------------------------------------------------------------------ */
/*  Section 1 — Why Backpropagation?                                   */
/* ------------------------------------------------------------------ */

function WhyBackprop() {
  return (
    <Section title="1. Why Backpropagation?">
      <Prose>
        <p>
          A neural network can have millions of weights. When the network makes a wrong prediction,
          we face the <strong className="text-text">credit assignment problem</strong>: which
          weights were responsible for the error, and how much should each one change?
        </p>
        <p>
          We could try changing each weight one at a time and measuring whether the loss goes up or
          down — but with millions of weights that would be impossibly slow.{' '}
          <strong className="text-text">Backpropagation</strong> solves this by computing
          <em> every </em> gradient in a single backward sweep through the network, using the{' '}
          <strong className="text-text">chain rule</strong> of calculus.
        </p>
        <p>
          The key insight: because a neural network is just a composition of simple differentiable
          operations, we can decompose the total derivative of the loss with respect to any weight
          into a product of local derivatives — each one trivially easy to compute.
        </p>
      </Prose>
      <Eq block>
        <span className="text-amber-400">dLoss/dWeight</span>
        {' = '}
        <span className="text-text-muted">local gradient</span>
        {' × '}
        <span className="text-text-muted">local gradient</span>
        {' × '}
        <span className="text-text-muted">... (chain rule)</span>
      </Eq>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 2 — The Chain Rule Interactive                             */
/* ------------------------------------------------------------------ */

function ChainRuleDemo() {
  const [x, setX] = useState(2);

  // f(g(x)) where g(x) = x^2 and f(u) = sin(u)
  const gx = x * x;
  const fgx = Math.sin(gx);
  const gPrime = 2 * x; // dg/dx = 2x
  const fPrime = Math.cos(gx); // df/du = cos(u) evaluated at u=g(x)
  const dfdx = fPrime * gPrime; // chain rule

  return (
    <Section title="2. The Chain Rule — Foundation of Backprop">
      <Prose>
        <p>
          Backpropagation is the chain rule applied systematically. If <Eq>y = f(g(x))</Eq>, then:
        </p>
      </Prose>
      <Eq block>
        <span className="text-amber-400">dy/dx</span>
        {' = '}
        <span className="text-primary-light">f'(g(x))</span>
        {' × '}
        <span className="text-green-400">g'(x)</span>
      </Eq>
      <Prose>
        <p>
          Adjust <Eq>x</Eq> below and watch how the total derivative decomposes into two local
          derivatives multiplied together.
        </p>
      </Prose>

      <InteractiveDemo title="Interactive Chain Rule">
        <ParameterSlider
          label="x"
          value={x}
          min={-3}
          max={3}
          step={0.1}
          onChange={setX}
          format={(v) => v.toFixed(1)}
        />

        {/* Visual: two function boxes chained */}
        <div className="mt-6">
          <svg viewBox="0 0 600 120" className="w-full" style={{ maxHeight: 120 }}>
            {/* x input */}
            <rect
              x={10}
              y={35}
              width={70}
              height={50}
              rx={8}
              fill={COLORS.surface}
              stroke={COLORS.border}
              strokeWidth={1.5}
            />
            <text
              x={45}
              y={65}
              textAnchor="middle"
              fill={COLORS.text}
              fontSize={14}
              fontFamily="monospace"
            >
              x={fmt(x, 1)}
            </text>

            {/* Arrow x -> g */}
            <line
              x1={80}
              y1={60}
              x2={140}
              y2={60}
              stroke={COLORS.border}
              strokeWidth={1.5}
              markerEnd="url(#arrowG)"
            />
            <text x={110} y={52} textAnchor="middle" fill={COLORS.muted} fontSize={10}>
              input
            </text>

            {/* g(x) box */}
            <rect
              x={140}
              y={25}
              width={120}
              height={70}
              rx={8}
              fill={COLORS.surface}
              stroke={COLORS.green}
              strokeWidth={1.5}
            />
            <text
              x={200}
              y={52}
              textAnchor="middle"
              fill={COLORS.green}
              fontSize={13}
              fontFamily="monospace"
            >
              g(x) = x²
            </text>
            <text
              x={200}
              y={72}
              textAnchor="middle"
              fill={COLORS.text}
              fontSize={12}
              fontFamily="monospace"
            >
              = {fmt(gx, 2)}
            </text>
            <text
              x={200}
              y={110}
              textAnchor="middle"
              fill={COLORS.green}
              fontSize={11}
              fontFamily="monospace"
            >
              g'(x)=2x = {fmt(gPrime, 2)}
            </text>

            {/* Arrow g -> f */}
            <line
              x1={260}
              y1={60}
              x2={320}
              y2={60}
              stroke={COLORS.border}
              strokeWidth={1.5}
              markerEnd="url(#arrowG)"
            />
            <text x={290} y={52} textAnchor="middle" fill={COLORS.muted} fontSize={10}>
              u={fmt(gx, 2)}
            </text>

            {/* f(u) box */}
            <rect
              x={320}
              y={25}
              width={130}
              height={70}
              rx={8}
              fill={COLORS.surface}
              stroke={COLORS.primaryLight}
              strokeWidth={1.5}
            />
            <text
              x={385}
              y={52}
              textAnchor="middle"
              fill={COLORS.primaryLight}
              fontSize={13}
              fontFamily="monospace"
            >
              f(u) = sin(u)
            </text>
            <text
              x={385}
              y={72}
              textAnchor="middle"
              fill={COLORS.text}
              fontSize={12}
              fontFamily="monospace"
            >
              = {fmt(fgx, 4)}
            </text>
            <text
              x={385}
              y={110}
              textAnchor="middle"
              fill={COLORS.primaryLight}
              fontSize={11}
              fontFamily="monospace"
            >
              f'(u)=cos(u) = {fmt(fPrime, 4)}
            </text>

            {/* Arrow f -> output */}
            <line
              x1={450}
              y1={60}
              x2={510}
              y2={60}
              stroke={COLORS.border}
              strokeWidth={1.5}
              markerEnd="url(#arrowG)"
            />

            {/* Output */}
            <rect
              x={510}
              y={35}
              width={80}
              height={50}
              rx={8}
              fill={COLORS.surface}
              stroke={COLORS.amber}
              strokeWidth={1.5}
            />
            <text x={550} y={55} textAnchor="middle" fill={COLORS.muted} fontSize={10}>
              dy/dx =
            </text>
            <text
              x={550}
              y={72}
              textAnchor="middle"
              fill={COLORS.amber}
              fontSize={13}
              fontFamily="monospace"
            >
              {fmt(dfdx, 4)}
            </text>

            <defs>
              <marker id="arrowG" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" fill={COLORS.border} />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-surface border border-white/[0.06]">
          <p className="font-mono text-sm text-text">
            <span className="text-amber-400">dy/dx</span>
            {' = '}
            <span className="text-primary-light">{fmt(fPrime, 4)}</span>
            {' × '}
            <span className="text-green-400">{fmt(gPrime, 2)}</span>
            {' = '}
            <span className="text-amber-400">{fmt(dfdx, 4)}</span>
          </p>
          <p className="text-xs text-text-muted mt-1">
            The total derivative is the product of the two local derivatives — this is exactly what
            backpropagation does at every node.
          </p>
        </div>
      </InteractiveDemo>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 3 — Computation Graph (SVG interactive)                   */
/* ------------------------------------------------------------------ */

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  fwdValue?: number;
  gradValue?: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

function buildGraph() {
  // Simple computation: z = w1*x1 + w2*x2, a = sigmoid(z), L = 0.5*(a - t)^2
  const x1 = 1.0,
    x2 = 0.5,
    w1 = 0.3,
    w2 = -0.2,
    b = 0.1,
    t = 1.0;

  const p1 = w1 * x1; // mul node 1
  const p2 = w2 * x2; // mul node 2
  const z = p1 + p2 + b; // sum node
  const a = sigmoid(z); // activation node
  const L = 0.5 * (a - t) ** 2; // loss node

  // Backward pass
  const dL_dL = 1.0;
  const dL_da = a - t;
  const dL_dz = dL_da * sigmoidDeriv(a);
  const dL_dw1 = dL_dz * x1;
  const dL_dw2 = dL_dz * x2;
  const dL_db = dL_dz * 1;
  const dL_dp1 = dL_dz;
  const dL_dp2 = dL_dz;

  const nodes: GraphNode[] = [
    { id: 'x1', label: 'x₁', x: 40, y: 40, fwdValue: x1, gradValue: dL_dz * w1 },
    { id: 'x2', label: 'x₂', x: 40, y: 170, fwdValue: x2, gradValue: dL_dz * w2 },
    { id: 'w1', label: 'w₁', x: 40, y: 105, fwdValue: w1, gradValue: dL_dw1 },
    { id: 'w2', label: 'w₂', x: 40, y: 235, fwdValue: w2, gradValue: dL_dw2 },
    { id: 'mul1', label: 'w₁·x₁', x: 190, y: 70, fwdValue: p1, gradValue: dL_dp1 },
    { id: 'mul2', label: 'w₂·x₂', x: 190, y: 200, fwdValue: p2, gradValue: dL_dp2 },
    { id: 'b', label: 'b', x: 190, y: 135, fwdValue: b, gradValue: dL_db },
    { id: 'sum', label: 'Σ', x: 350, y: 135, fwdValue: z, gradValue: dL_dz },
    { id: 'act', label: 'σ', x: 480, y: 135, fwdValue: a, gradValue: dL_da },
    { id: 'loss', label: 'Loss', x: 610, y: 135, fwdValue: L, gradValue: dL_dL },
  ];

  const edges: GraphEdge[] = [
    { from: 'x1', to: 'mul1' },
    { from: 'w1', to: 'mul1' },
    { from: 'x2', to: 'mul2' },
    { from: 'w2', to: 'mul2' },
    { from: 'mul1', to: 'sum' },
    { from: 'mul2', to: 'sum' },
    { from: 'b', to: 'sum' },
    { from: 'sum', to: 'act' },
    { from: 'act', to: 'loss' },
  ];

  return { nodes, edges };
}

// Topological order for forward/backward
const FWD_ORDER = ['x1', 'x2', 'w1', 'w2', 'b', 'mul1', 'mul2', 'sum', 'act', 'loss'];
const BWD_ORDER = [...FWD_ORDER].reverse();

function ComputationGraphDemo() {
  const { nodes, edges } = buildGraph();
  const [mode, setMode] = useState<'idle' | 'forward' | 'backward'>('idle');
  const [step, setStep] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeOrder = mode === 'forward' ? FWD_ORDER : mode === 'backward' ? BWD_ORDER : [];
  const highlightedIds = new Set(activeOrder.slice(0, step + 1));

  const startPass = (m: 'forward' | 'backward') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(m);
    setStep(-1);
    const order = m === 'forward' ? FWD_ORDER : BWD_ORDER;
    let s = -1;
    timerRef.current = setInterval(() => {
      s += 1;
      if (s >= order.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      setStep(s);
    }, 500);
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setMode('idle');
    setStep(-1);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const nodeR = 28;

  const getNodeColor = (n: GraphNode) => {
    if (!highlightedIds.has(n.id)) return COLORS.surface;
    if (mode === 'forward') return COLORS.primary;
    return '#92400e'; // dark amber for backward
  };

  const getStrokeColor = (n: GraphNode) => {
    if (!highlightedIds.has(n.id)) return COLORS.border;
    if (mode === 'forward') return COLORS.primaryLight;
    return COLORS.amber;
  };

  return (
    <Section title="3. Computation Graphs">
      <Prose>
        <p>
          A neural network is a <strong className="text-text">computation graph</strong> — a
          directed acyclic graph where each node performs one simple operation. The forward pass
          computes values left-to-right; the backward pass propagates gradients right-to-left.
        </p>
      </Prose>

      <InteractiveDemo title="Animated Computation Graph">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => startPass('forward')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/20 text-primary-light border border-primary/30 hover:bg-primary/30 transition-colors"
          >
            Forward Pass
          </button>
          <button
            onClick={() => startPass('backward')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
          >
            Backward Pass
          </button>
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-lighter text-text-muted border border-white/[0.06] hover:bg-surface-light transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox="0 0 700 280" className="w-full" style={{ minWidth: 500 }}>
            <rect width={700} height={280} fill={COLORS.bg} rx={8} />

            {/* Edges */}
            {edges.map((e) => {
              const f = nodeMap[e.from];
              const t = nodeMap[e.to];
              const highlighted = highlightedIds.has(e.from) && highlightedIds.has(e.to);
              return (
                <line
                  key={`${e.from}-${e.to}`}
                  x1={f.x + nodeR}
                  y1={f.y}
                  x2={t.x - nodeR}
                  y2={t.y}
                  stroke={
                    highlighted
                      ? mode === 'forward'
                        ? COLORS.primaryLight
                        : COLORS.amber
                      : COLORS.border
                  }
                  strokeWidth={highlighted ? 2 : 1}
                  opacity={highlighted ? 1 : 0.4}
                  style={{ transition: 'stroke 0.3s ease, strokeWidth 0.3s ease' }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={nodeR}
                  fill={getNodeColor(n)}
                  stroke={getStrokeColor(n)}
                  strokeWidth={highlightedIds.has(n.id) ? 2.5 : 1.5}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text
                  x={n.x}
                  y={n.y - 4}
                  textAnchor="middle"
                  fill={COLORS.text}
                  fontSize={11}
                  fontWeight={600}
                >
                  {n.label}
                </text>
                {/* Forward value */}
                {highlightedIds.has(n.id) && mode === 'forward' && n.fwdValue !== undefined && (
                  <text
                    x={n.x}
                    y={n.y + 12}
                    textAnchor="middle"
                    fill={COLORS.primaryLight}
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    {fmt(n.fwdValue, 3)}
                  </text>
                )}
                {/* Gradient value */}
                {highlightedIds.has(n.id) && mode === 'backward' && n.gradValue !== undefined && (
                  <text
                    x={n.x}
                    y={n.y + 12}
                    textAnchor="middle"
                    fill={COLORS.amber}
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    ∂={fmt(n.gradValue, 4)}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
        <p className="text-xs text-text-muted mt-2">
          {mode === 'idle' &&
            'Click a button to animate the forward or backward pass through the graph.'}
          {mode === 'forward' && 'Blue highlights show values propagating forward (left to right).'}
          {mode === 'backward' &&
            'Amber highlights show gradients flowing backward (right to left).'}
        </p>
      </InteractiveDemo>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 4 — Step-by-Step Forward Pass                              */
/* ------------------------------------------------------------------ */

function ForwardPassSection() {
  // Concrete numerical example
  const x1 = 1.0,
    x2 = 0.5;
  const w11 = 0.3,
    w12 = -0.2,
    b1 = 0.1;
  const w21 = 0.5,
    w22 = 0.1,
    b2 = -0.1;
  const t1 = 1.0,
    t2 = 0.0;

  const z1 = w11 * x1 + w12 * x2 + b1;
  const a1 = sigmoid(z1);
  const z2 = w21 * x1 + w22 * x2 + b2;
  const a2 = sigmoid(z2);
  const L1 = 0.5 * (a1 - t1) ** 2;
  const L2 = 0.5 * (a2 - t2) ** 2;
  const L = L1 + L2;

  const steps = [
    {
      label: 'Neuron 1 — weighted sum',
      eq: `z₁ = w₁₁·x₁ + w₁₂·x₂ + b₁ = ${fmt(w11)}·${fmt(x1)} + ${fmt(w12, 1)}·${fmt(x2)} + ${fmt(b1)} = ${fmt(z1)}`,
    },
    {
      label: 'Neuron 1 — activation',
      eq: `a₁ = σ(z₁) = σ(${fmt(z1)}) = ${fmt(a1)}`,
    },
    {
      label: 'Neuron 2 — weighted sum',
      eq: `z₂ = w₂₁·x₁ + w₂₂·x₂ + b₂ = ${fmt(w21)}·${fmt(x1)} + ${fmt(w22)}·${fmt(x2)} + ${fmt(b2, 1)} = ${fmt(z2)}`,
    },
    {
      label: 'Neuron 2 — activation',
      eq: `a₂ = σ(z₂) = σ(${fmt(z2)}) = ${fmt(a2)}`,
    },
    {
      label: 'Loss — Squared Error Loss',
      eq: `L = ½(a₁-t₁)² + ½(a₂-t₂)² = ½(${fmt(a1)}-${fmt(t1)})² + ½(${fmt(a2)}-${fmt(t2)})² = ${fmt(L)}`,
    },
  ];

  const [visibleStep, setVisibleStep] = useState(0);

  return (
    <Section title="4. Step-by-Step Forward Pass">
      <Prose>
        <p>
          Let us trace a concrete example through the network. We have two inputs, two output
          neurons with sigmoid activations, and squared error loss.
        </p>
      </Prose>

      <div className="p-4 rounded-lg bg-surface-light border border-white/[0.06] font-mono text-sm space-y-1 mb-4">
        <p className="text-text-muted">
          Inputs:{' '}
          <span className="text-primary-light">
            x = [{x1}, {x2}]
          </span>
        </p>
        <p className="text-text-muted">
          Weights 1:{' '}
          <span className="text-text">
            w₁ = [{w11}, {w12}]
          </span>
          , b₁ = {b1}
        </p>
        <p className="text-text-muted">
          Weights 2:{' '}
          <span className="text-text">
            w₂ = [{w21}, {w22}]
          </span>
          , b₂ = {b2}
        </p>
        <p className="text-text-muted">
          Targets:{' '}
          <span className="text-green-400">
            t = [{t1}, {t2}]
          </span>
        </p>
      </div>

      <InteractiveDemo title="Step Through Forward Pass">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setVisibleStep(Math.max(0, visibleStep - 1))}
            disabled={visibleStep === 0}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-lighter text-text-muted border border-white/[0.06] hover:bg-surface-light transition-colors disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setVisibleStep(Math.min(steps.length - 1, visibleStep + 1))}
            disabled={visibleStep === steps.length - 1}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/20 text-primary-light border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-40"
          >
            Next Step
          </button>
          <span className="text-xs text-text-muted self-center ml-2">
            Step {visibleStep + 1} of {steps.length}
          </span>
        </div>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                i <= visibleStep
                  ? i === visibleStep
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-surface border-white/[0.06]'
                  : 'bg-surface/30 border-transparent opacity-25'
              }`}
            >
              <p className="text-xs text-text-muted mb-1 font-semibold">{s.label}</p>
              <p className="font-mono text-sm text-text">{s.eq}</p>
            </div>
          ))}
        </div>
      </InteractiveDemo>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 5 — Step-by-Step Backward Pass (THE KEY DEMO)             */
/* ------------------------------------------------------------------ */

interface BackpropStep {
  nodeLabel: string;
  highlightId: string;
  expression: string;
  numerical: string;
  explanation: string;
}

function buildBackpropSteps() {
  const x1 = 1.0,
    x2 = 0.5;
  const w1 = 0.3,
    w2 = -0.2,
    b = 0.1;
  const t = 1.0;

  const p1 = w1 * x1;
  const p2 = w2 * x2;
  const z = p1 + p2 + b;
  const a = sigmoid(z);
  const L = 0.5 * (a - t) ** 2;

  const dL_dL = 1.0;
  const dL_da = a - t;
  const da_dz = sigmoidDeriv(a);
  const dL_dz = dL_da * da_dz;
  const dL_dw1 = dL_dz * x1;
  const dL_dw2 = dL_dz * x2;
  const dL_db = dL_dz;

  const steps: BackpropStep[] = [
    {
      nodeLabel: 'Loss',
      highlightId: 'loss',
      expression: '∂L/∂L = 1',
      numerical: `${fmt(dL_dL)}`,
      explanation:
        'We start at the loss node. The gradient of anything with respect to itself is 1.',
    },
    {
      nodeLabel: 'Activation output',
      highlightId: 'act',
      expression: '∂L/∂a = (a - t)',
      numerical: `(${fmt(a)} - ${fmt(t)}) = ${fmt(dL_da)}`,
      explanation: `The derivative of L = ½(a-t)² with respect to a. Since a=${fmt(a)} and target=${fmt(t)}, the prediction is too low, giving a negative gradient.`,
    },
    {
      nodeLabel: 'Pre-activation (z)',
      highlightId: 'sum',
      expression: "∂L/∂z = ∂L/∂a · σ'(z) = ∂L/∂a · a(1-a)",
      numerical: `${fmt(dL_da)} × ${fmt(a)}·(1-${fmt(a)}) = ${fmt(dL_da)} × ${fmt(da_dz)} = ${fmt(dL_dz)}`,
      explanation: 'Chain rule! Multiply the upstream gradient by the local derivative of sigmoid.',
    },
    {
      nodeLabel: 'Weight w₁',
      highlightId: 'w1',
      expression: '∂L/∂w₁ = ∂L/∂z · x₁',
      numerical: `${fmt(dL_dz)} × ${fmt(x1)} = ${fmt(dL_dw1)}`,
      explanation: `Since z = w₁·x₁ + ..., the derivative of z with respect to w₁ is just x₁. We multiply by the upstream gradient from z.`,
    },
    {
      nodeLabel: 'Weight w₂',
      highlightId: 'w2',
      expression: '∂L/∂w₂ = ∂L/∂z · x₂',
      numerical: `${fmt(dL_dz)} × ${fmt(x2)} = ${fmt(dL_dw2)}`,
      explanation: `Similarly for w₂ — the local gradient is x₂ = ${fmt(x2)}.`,
    },
    {
      nodeLabel: 'Bias b',
      highlightId: 'b',
      expression: '∂L/∂b = ∂L/∂z · 1',
      numerical: `${fmt(dL_dz)} × 1 = ${fmt(dL_db)}`,
      explanation:
        'The derivative of z with respect to the bias is always 1, so the gradient passes straight through.',
    },
  ];

  return { steps, nodeValues: { x1, x2, w1, w2, b, p1, p2, z, a, L } };
}

function BackwardPassDemo() {
  const { steps } = buildBackpropSteps();
  const [currentStep, setCurrentStep] = useState(0);

  const { nodes, edges } = buildGraph();
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const nodeR = 28;

  const highlightedIds = new Set(steps.slice(0, currentStep + 1).map((s) => s.highlightId));
  const currentId = steps[currentStep].highlightId;

  return (
    <Section title="5. Step-by-Step Backward Pass">
      <Prose>
        <p>
          This is the core of backpropagation. Step through each node and watch the gradient flow
          backward through the graph. At each step, the{' '}
          <strong className="text-amber-400">chain rule</strong> multiplies the upstream gradient by
          the local derivative.
        </p>
      </Prose>

      <InteractiveDemo title="Backpropagation Debugger">
        {/* Controls */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-lighter text-text-muted border border-white/[0.06] hover:bg-surface-light transition-colors disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-40"
          >
            Next Gradient
          </button>
          <button
            onClick={() => setCurrentStep(0)}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-lighter text-text-muted border border-white/[0.06] hover:bg-surface-light transition-colors"
          >
            Reset
          </button>
          <span className="text-xs text-text-muted self-center ml-2">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Graph SVG */}
        <div className="overflow-x-auto mb-4">
          <svg viewBox="0 0 700 280" className="w-full" style={{ minWidth: 500 }}>
            <rect width={700} height={280} fill={COLORS.bg} rx={8} />

            {/* Edges */}
            {edges.map((e) => {
              const f = nodeMap[e.from];
              const t = nodeMap[e.to];
              const bothHighlighted = highlightedIds.has(e.from) && highlightedIds.has(e.to);
              return (
                <line
                  key={`${e.from}-${e.to}`}
                  x1={f.x + nodeR}
                  y1={f.y}
                  x2={t.x - nodeR}
                  y2={t.y}
                  stroke={bothHighlighted ? COLORS.amber : COLORS.border}
                  strokeWidth={bothHighlighted ? 2 : 1}
                  opacity={bothHighlighted ? 0.9 : 0.3}
                  style={{ transition: 'all 0.3s ease' }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const isHighlighted = highlightedIds.has(n.id);
              const isCurrent = n.id === currentId;

              return (
                <g key={n.id}>
                  {/* Glow ring for current node */}
                  {isCurrent && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={nodeR + 6}
                      fill="none"
                      stroke={COLORS.amber}
                      strokeWidth={2}
                      opacity={0.5}
                      style={{ filter: 'blur(3px)' }}
                    />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={nodeR}
                    fill={
                      isCurrent ? '#92400e' : isHighlighted ? COLORS.surfaceLighter : COLORS.surface
                    }
                    stroke={isCurrent ? COLORS.amber : isHighlighted ? COLORS.amber : COLORS.border}
                    strokeWidth={isCurrent ? 2.5 : isHighlighted ? 2 : 1.5}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text
                    x={n.x}
                    y={n.y - 4}
                    textAnchor="middle"
                    fill={COLORS.text}
                    fontSize={11}
                    fontWeight={600}
                  >
                    {n.label}
                  </text>
                  {/* Show forward value */}
                  <text
                    x={n.x}
                    y={n.y + 10}
                    textAnchor="middle"
                    fill={COLORS.primaryLight}
                    fontSize={8}
                    fontFamily="monospace"
                  >
                    {n.fwdValue !== undefined ? fmt(n.fwdValue, 3) : ''}
                  </text>
                  {/* Show gradient value if revealed */}
                  {isHighlighted && n.gradValue !== undefined && (
                    <text
                      x={n.x}
                      y={n.y + nodeR + 14}
                      textAnchor="middle"
                      fill={COLORS.amber}
                      fontSize={9}
                      fontFamily="monospace"
                      fontWeight={700}
                    >
                      ∂L={fmt(n.gradValue, 4)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Current step detail card */}
        <div className="p-4 rounded-lg bg-surface border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">
              {steps[currentStep].nodeLabel}
            </span>
          </div>
          <p className="font-mono text-sm text-text">{steps[currentStep].expression}</p>
          <p className="font-mono text-sm text-amber-400">{steps[currentStep].numerical}</p>
          <p className="text-xs text-text-muted leading-relaxed">
            {steps[currentStep].explanation}
          </p>
        </div>

        {/* Timeline of all steps */}
        <div className="mt-4 grid gap-1.5">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`text-left p-2 rounded-md border text-xs transition-all ${
                i === currentStep
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : i < currentStep
                    ? 'bg-surface border-white/[0.06] text-text-muted'
                    : 'bg-surface/30 border-transparent text-text-muted/50'
              }`}
            >
              <span className="font-mono font-semibold">{i + 1}.</span> {s.nodeLabel}:{' '}
              <span className="font-mono">{s.expression}</span>
            </button>
          ))}
        </div>
      </InteractiveDemo>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 6 — Gradient Flow Canvas Visualization                    */
/* ------------------------------------------------------------------ */

const GRAD_LAYER_SIZES = [2, 3, 2, 1] as const;
const GRAD_INPUT = [1.0, 0.5];
const GRAD_TARGET = 0.8;

function GradientFlowVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [adjustW, setAdjustW] = useState(0.3);

  const forwardAndBack = useCallback((w1Override: number) => {
    // Initialize weights with a seed pattern
    const weights: number[][][] = [];
    const biases: number[][] = [];

    // Layer 0->1: 2x3
    weights.push([
      [w1Override, 0.5, -0.3],
      [0.2, -0.4, 0.6],
    ]);
    biases.push([0.1, -0.1, 0.05]);

    // Layer 1->2: 3x2
    weights.push([
      [0.4, -0.2],
      [0.3, 0.5],
      [-0.1, 0.2],
    ]);
    biases.push([0.0, 0.1]);

    // Layer 2->3: 2x1
    weights.push([[0.6], [-0.3]]);
    biases.push([0.05]);

    // Forward pass
    const activations: number[][] = [GRAD_INPUT];
    let current = GRAD_INPUT;

    for (let l = 0; l < weights.length; l++) {
      const next: number[] = [];
      for (let j = 0; j < GRAD_LAYER_SIZES[l + 1]; j++) {
        let sum = biases[l][j];
        for (let i = 0; i < current.length; i++) {
          sum += current[i] * weights[l][i][j];
        }
        next.push(sigmoid(sum));
      }
      activations.push(next);
      current = next;
    }

    const output = activations[activations.length - 1][0];
    const loss = 0.5 * (output - GRAD_TARGET) ** 2;

    // Backward pass: compute gradient for each weight
    const deltas: number[][] = [];
    // Output layer delta
    const outDelta = (output - GRAD_TARGET) * sigmoidDeriv(output);
    deltas[weights.length - 1] = [outDelta];

    for (let l = weights.length - 2; l >= 0; l--) {
      const layerDeltas: number[] = [];
      for (let j = 0; j < GRAD_LAYER_SIZES[l + 1]; j++) {
        let errSum = 0;
        for (let k = 0; k < GRAD_LAYER_SIZES[l + 2]; k++) {
          errSum += deltas[l + 1][k] * weights[l + 1][j][k];
        }
        layerDeltas.push(errSum * sigmoidDeriv(activations[l + 1][j]));
      }
      deltas[l] = layerDeltas;
    }

    // Weight gradients
    const weightGrads: number[][][] = [];
    for (let l = 0; l < weights.length; l++) {
      const lg: number[][] = [];
      for (let i = 0; i < GRAD_LAYER_SIZES[l]; i++) {
        const row: number[] = [];
        for (let j = 0; j < GRAD_LAYER_SIZES[l + 1]; j++) {
          row.push(activations[l][i] * deltas[l][j]);
        }
        lg.push(row);
      }
      weightGrads.push(lg);
    }

    return { activations, weights, weightGrads, loss, output };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 650,
      h = 320;
    const targetW = w * dpr;
    const targetH = h * dpr;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { activations, weightGrads, loss, output } = forwardAndBack(adjustW);

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Layout
    const layerX = [90, 230, 400, 550];
    const neuronPositions: { x: number; y: number }[][] = [];

    for (let l = 0; l < GRAD_LAYER_SIZES.length; l++) {
      const positions: { x: number; y: number }[] = [];
      const n = GRAD_LAYER_SIZES[l];
      const totalH = (n - 1) * 70;
      const startY = h / 2 - totalH / 2;
      for (let i = 0; i < n; i++) {
        positions.push({ x: layerX[l], y: startY + i * 70 });
      }
      neuronPositions.push(positions);
    }

    // Find max gradient for normalization
    let maxGrad = 0;
    for (const lg of weightGrads) {
      for (const row of lg) {
        for (const g of row) {
          maxGrad = Math.max(maxGrad, Math.abs(g));
        }
      }
    }
    if (maxGrad === 0) maxGrad = 1;

    // Draw connections
    for (let l = 0; l < weightGrads.length; l++) {
      for (let i = 0; i < GRAD_LAYER_SIZES[l]; i++) {
        for (let j = 0; j < GRAD_LAYER_SIZES[l + 1]; j++) {
          const from = neuronPositions[l][i];
          const to = neuronPositions[l + 1][j];
          const grad = Math.abs(weightGrads[l][i][j]);
          const intensity = Math.min(grad / maxGrad, 1);

          // Color interpolation: blue (low) -> red (high)
          const r = Math.round(59 + intensity * (239 - 59));
          const g = Math.round(130 - intensity * 130);
          const b = Math.round(246 - intensity * (246 - 68));
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = 1 + intensity * 3;
          ctx.globalAlpha = 0.3 + intensity * 0.7;

          ctx.beginPath();
          ctx.moveTo(from.x + 18, from.y);
          ctx.lineTo(to.x - 18, to.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Draw neurons
    for (let l = 0; l < GRAD_LAYER_SIZES.length; l++) {
      for (let i = 0; i < GRAD_LAYER_SIZES[l]; i++) {
        const pos = neuronPositions[l][i];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.surface;
        ctx.fill();
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = COLORS.text;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activations[l][i].toFixed(3), pos.x, pos.y);
      }
    }

    // Layer labels
    const labels = ['Input', 'Hidden 1', 'Hidden 2', 'Output'];
    ctx.font = '11px sans-serif';
    ctx.fillStyle = COLORS.muted;
    for (let l = 0; l < labels.length; l++) {
      ctx.textAlign = 'center';
      ctx.fillText(labels[l], layerX[l], h - 15);
    }

    // Loss display
    ctx.fillStyle = COLORS.amber;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Loss: ${loss.toFixed(6)}`, w - 20, 25);
    ctx.fillStyle = COLORS.primaryLight;
    ctx.fillText(`Output: ${output.toFixed(4)}`, w - 20, 42);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '11px monospace';
    ctx.fillText(`Target: ${GRAD_TARGET}`, w - 20, 57);

    // Legend
    ctx.textAlign = 'left';
    ctx.font = '10px sans-serif';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText('Connection color = gradient magnitude:', 15, h - 35);
    const gw = 100;
    for (let px = 0; px < gw; px++) {
      const t = px / gw;
      const r = Math.round(59 + t * (239 - 59));
      const g = Math.round(130 - t * 130);
      const b = Math.round(246 - t * (246 - 68));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(15 + px * 1.5, h - 22, 1.5, 8);
    }
    ctx.fillStyle = COLORS.primaryLight;
    ctx.fillText('low', 15, h - 8);
    ctx.fillStyle = COLORS.red;
    ctx.textAlign = 'right';
    ctx.fillText('high', 15 + gw * 1.5, h - 8);
  }, [adjustW, forwardAndBack]);

  return (
    <Section title="6. Gradient Flow Visualization">
      <Prose>
        <p>
          After backpropagation, every connection in the network has a gradient. The gradient tells
          us how sensitive the loss is to that weight — larger gradients mean the weight has more
          influence on the error.
        </p>
        <p>
          Adjust <Eq>w₁₁</Eq> (the first weight, input 1 to hidden 1) and watch how the loss
          changes. The gradient IS this sensitivity.
        </p>
      </Prose>

      <InteractiveDemo title="Gradient Magnitude Heatmap">
        <ParameterSlider
          label="w₁₁ (first weight)"
          value={adjustW}
          min={-2}
          max={2}
          step={0.05}
          onChange={setAdjustW}
          format={(v) => v.toFixed(2)}
        />
        <div className="mt-4">
          <canvas
            ref={canvasRef}
            className="w-full border border-white/[0.06] rounded-lg"
            style={{ maxWidth: 650, aspectRatio: `${650}/${320}` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2">
          Red connections have large gradients (high sensitivity). Blue connections have small
          gradients (low sensitivity). Drag the weight slider to see the loss change in real time.
        </p>
      </InteractiveDemo>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 7 — Vanishing Gradient Problem                            */
/* ------------------------------------------------------------------ */

function VanishingGradientSection() {
  const [numLayers, setNumLayers] = useState(6);
  const sigmoidCanvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate gradient magnitude through layers
  // Sigmoid derivative max = 0.25, so gradient shrinks by ~0.25x each layer
  const gradientMagnitudes: number[] = [];
  let grad = 1.0;
  for (let i = 0; i < numLayers; i++) {
    gradientMagnitudes.push(grad);
    // Multiply by typical sigmoid derivative * typical weight magnitude
    grad *= 0.25;
  }
  gradientMagnitudes.reverse(); // from input layer to output layer

  // Sigmoid saturation canvas
  useEffect(() => {
    const canvas = sigmoidCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 500,
      h = 220;
    const targetW = w * dpr;
    const targetH = h * dpr;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const pad = 50;
    const plotW = w - 2 * pad;
    const plotH = h - 2 * pad;

    // Axes
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + plotH);
    ctx.lineTo(pad + plotW, pad + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = COLORS.muted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('z (input to sigmoid)', w / 2, h - 8);
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('value', 0, 0);
    ctx.restore();

    // x range: -6 to 6
    const xMin = -6,
      xMax = 6;
    const toCanvasX = (xv: number) => pad + ((xv - xMin) / (xMax - xMin)) * plotW;
    const toCanvasY = (yv: number) => pad + plotH - yv * plotH;

    // x-axis ticks
    ctx.fillStyle = COLORS.muted;
    ctx.font = '9px monospace';
    for (let xv = -6; xv <= 6; xv += 2) {
      const cx = toCanvasX(xv);
      ctx.fillText(String(xv), cx, pad + plotH + 14);
      ctx.beginPath();
      ctx.moveTo(cx, pad + plotH);
      ctx.lineTo(cx, pad + plotH + 3);
      ctx.strokeStyle = COLORS.border;
      ctx.stroke();
    }

    // Draw sigmoid curve
    ctx.beginPath();
    ctx.strokeStyle = COLORS.primaryLight;
    ctx.lineWidth = 2;
    for (let px = 0; px <= plotW; px++) {
      const xv = xMin + (px / plotW) * (xMax - xMin);
      const yv = sigmoid(xv);
      const cx = pad + px;
      const cy = toCanvasY(yv);
      if (px === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw sigmoid derivative curve
    ctx.beginPath();
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 2;
    for (let px = 0; px <= plotW; px++) {
      const xv = xMin + (px / plotW) * (xMax - xMin);
      const s = sigmoid(xv);
      const yv = sigmoidDeriv(s);
      const cx = pad + px;
      const cy = toCanvasY(yv);
      if (px === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Saturation zones (shading)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(pad, pad, toCanvasX(-3) - pad, plotH);
    ctx.fillRect(toCanvasX(3), pad, pad + plotW - toCanvasX(3), plotH);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(toCanvasX(-3), pad, toCanvasX(3) - toCanvasX(-3), plotH);

    // Labels for zones
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.red;
    ctx.fillText('Saturated', (pad + toCanvasX(-3)) / 2, pad + 15);
    ctx.fillText('grad ≈ 0', (pad + toCanvasX(-3)) / 2, pad + 28);
    ctx.fillText('Saturated', (toCanvasX(3) + pad + plotW) / 2, pad + 15);
    ctx.fillText('grad ≈ 0', (toCanvasX(3) + pad + plotW) / 2, pad + 28);
    ctx.fillStyle = COLORS.green;
    ctx.fillText('Active zone', w / 2, pad + 15);

    // Legend
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.primaryLight;
    ctx.fillText('--- sigmoid(z)', pad + 10, pad + plotH - 30);
    ctx.fillStyle = COLORS.amber;
    ctx.fillText("--- sigmoid'(z)", pad + 10, pad + plotH - 16);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText('max derivative = 0.25', pad + 130, pad + plotH - 16);
  }, []);

  return (
    <Section title="7. The Vanishing Gradient Problem">
      <Prose>
        <p>
          In deep networks with sigmoid activations, gradients can shrink exponentially as they flow
          backward through layers. The maximum derivative of sigmoid is only <Eq>0.25</Eq>, so each
          layer multiplies the gradient by at most 0.25. After several layers, the gradient
          effectively vanishes.
        </p>
      </Prose>

      <Eq block>
        <span className="text-amber-400">∂L/∂w₁</span>
        {' = '}
        <span className="text-text-muted">σ'·</span>
        <span className="text-text-muted">σ'·</span>
        <span className="text-text-muted">σ'·...·</span>
        <span className="text-text-muted">σ'</span>
        {' ≤ '}
        <span className="text-red-400">0.25⁽ⁿ⁻¹⁾</span>
        {' (shrinks exponentially)'}
      </Eq>

      <InteractiveDemo title="Gradient Magnitude by Layer">
        <ParameterSlider
          label="Number of layers"
          value={numLayers}
          min={2}
          max={12}
          step={1}
          onChange={setNumLayers}
          format={(v) => String(v)}
        />

        <div className="mt-4 space-y-2">
          {gradientMagnitudes.map((mag, i) => {
            const isFirst = i === 0;
            const isLast = i === gradientMagnitudes.length - 1;
            const barWidth = Math.max(
              (mag / gradientMagnitudes[gradientMagnitudes.length - 1]) * 100,
              0.5,
            );
            const intensity = Math.min(mag / gradientMagnitudes[gradientMagnitudes.length - 1], 1);

            // Color: red for vanished, green for healthy
            const r = Math.round(239 * (1 - intensity) + 16 * intensity);
            const g = Math.round(68 * (1 - intensity) + 185 * intensity);
            const b = Math.round(68 * (1 - intensity) + 129 * intensity);

            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-20 text-right font-mono shrink-0">
                  {isFirst ? 'Layer 1' : isLast ? `Layer ${numLayers}` : `Layer ${i + 1}`}
                  {isFirst && <span className="text-text-muted/60"> (input)</span>}
                  {isLast && <span className="text-text-muted/60"> (output)</span>}
                </span>
                <div className="flex-1 h-5 bg-surface rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: `rgb(${r},${g},${b})`,
                      minWidth: 2,
                    }}
                  />
                </div>
                <span className="text-xs font-mono w-24 text-text-muted shrink-0">
                  {mag < 0.0001 ? mag.toExponential(1) : mag.toFixed(6)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-text-muted mt-3">
          Notice how the gradient at early layers becomes vanishingly small. With {numLayers}{' '}
          layers, the first layer receives a gradient that is{' '}
          <strong className="text-text">
            0.25^{numLayers - 1} = {(0.25 ** (numLayers - 1)).toExponential(2)}
          </strong>{' '}
          times the output gradient. This is why deep sigmoid networks are nearly impossible to
          train.
        </p>
      </InteractiveDemo>

      <InteractiveDemo title="Sigmoid Saturation">
        <canvas
          ref={sigmoidCanvasRef}
          className="w-full border border-white/[0.06] rounded-lg"
          style={{ maxWidth: 500, aspectRatio: `${500}/${220}` }}
        />
        <Prose>
          <p>
            The sigmoid function squashes its input to (0, 1). When the input is far from zero (the
            red saturation zones), the derivative is nearly zero. This means the gradient signal
            effectively dies at saturated neurons, unable to pass useful information backward.
          </p>
          <p>
            Modern networks use <strong className="text-text">ReLU</strong> and its variants (Leaky
            ReLU, GELU) which have a derivative of 1 for positive inputs, avoiding this saturation
            problem entirely.
          </p>
        </Prose>
      </InteractiveDemo>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */

export default function BackpropMathPage() {
  return (
    <MathLayout
      title="Backpropagation"
      subtitle="How neural networks learn — the chain rule applied to computation graphs, explained step by step with real numbers."
    >
      <WhyBackprop />
      <ChainRuleDemo />
      <ComputationGraphDemo />
      <ForwardPassSection />
      <BackwardPassDemo />
      <GradientFlowVisualization />
      <VanishingGradientSection />
    </MathLayout>
  );
}
