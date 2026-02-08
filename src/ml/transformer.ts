import * as tf from '@tensorflow/tfjs';

/* ─────────────────────────── Config ─────────────────────────── */

export interface TransformerConfig {
  vocabSize: number;
  seqLen: number;
  dModel: number;
  numHeads: number;
  ffnDim: number;
}

export const DEFAULT_CONFIG: TransformerConfig = {
  vocabSize: 10,
  seqLen: 4,
  dModel: 32,
  numHeads: 2,
  ffnDim: 64,
};

/* ─────────────────────────── Weights ─────────────────────────── */

export interface TransformerWeights {
  wEmbed: tf.Variable;    // [vocabSize, dModel]
  wQ: tf.Variable;        // [dModel, dModel]
  wK: tf.Variable;        // [dModel, dModel]
  wV: tf.Variable;        // [dModel, dModel]
  wO: tf.Variable;        // [dModel, dModel]
  ffnW1: tf.Variable;     // [dModel, ffnDim]
  ffnB1: tf.Variable;     // [ffnDim]
  ffnW2: tf.Variable;     // [ffnDim, dModel]
  ffnB2: tf.Variable;     // [dModel]
  lnGamma1: tf.Variable;  // [dModel]
  lnBeta1: tf.Variable;   // [dModel]
  lnGamma2: tf.Variable;  // [dModel]
  lnBeta2: tf.Variable;   // [dModel]
  wOut: tf.Variable;      // [dModel, vocabSize]
  bOut: tf.Variable;      // [vocabSize]
}

function initWeight(shape: number[], scale: number = 0.02): tf.Variable {
  return tf.variable(tf.randomNormal(shape, 0, scale));
}

export function createWeights(config: TransformerConfig): TransformerWeights {
  const { vocabSize, dModel, ffnDim } = config;
  const scale = 1 / Math.sqrt(dModel);
  return {
    wEmbed: initWeight([vocabSize, dModel], scale),
    wQ: initWeight([dModel, dModel], scale),
    wK: initWeight([dModel, dModel], scale),
    wV: initWeight([dModel, dModel], scale),
    wO: initWeight([dModel, dModel], scale),
    ffnW1: initWeight([dModel, ffnDim], scale),
    ffnB1: tf.variable(tf.zeros([ffnDim])),
    ffnW2: initWeight([ffnDim, dModel], scale),
    ffnB2: tf.variable(tf.zeros([dModel])),
    lnGamma1: tf.variable(tf.ones([dModel])),
    lnBeta1: tf.variable(tf.zeros([dModel])),
    lnGamma2: tf.variable(tf.ones([dModel])),
    lnBeta2: tf.variable(tf.zeros([dModel])),
    wOut: initWeight([dModel, vocabSize], scale),
    bOut: tf.variable(tf.zeros([vocabSize])),
  };
}

export function getTrainableVars(w: TransformerWeights): tf.Variable[] {
  return [
    w.wEmbed, w.wQ, w.wK, w.wV, w.wO,
    w.ffnW1, w.ffnB1, w.ffnW2, w.ffnB2,
    w.lnGamma1, w.lnBeta1, w.lnGamma2, w.lnBeta2,
    w.wOut, w.bOut,
  ];
}

export function disposeWeights(w: TransformerWeights) {
  for (const v of getTrainableVars(w)) {
    v.dispose();
  }
}

/* ──────────────────── Positional Encoding ──────────────────── */

function sinusoidalPE(seqLen: number, dModel: number): tf.Tensor2D {
  return tf.tidy(() => {
    const positions = tf.range(0, seqLen).reshape([seqLen, 1]);          // [seqLen,1]
    const dims = tf.range(0, dModel).reshape([1, dModel]);               // [1,dModel]
    const dimPairs = tf.floor(dims.div(2));                              // [1,dModel]
    const angles = positions.div(tf.pow(10000, dimPairs.mul(2).div(dModel))); // [seqLen,dModel]
    // even dims = sin, odd dims = cos
    const isEven = tf.equal(dims.mod(2), 0).cast('float32');             // [1,dModel]
    const sinPart = tf.sin(angles).mul(isEven);
    const cosPart = tf.cos(angles).mul(tf.sub(1, isEven));
    return sinPart.add(cosPart) as tf.Tensor2D;
  });
}

/* ──────────────────── Layer Normalization ──────────────────── */

function layerNorm(
  x: tf.Tensor,        // [..., dModel]
  gamma: tf.Variable,  // [dModel]
  beta: tf.Variable,   // [dModel]
): tf.Tensor {
  return tf.tidy(() => {
    const mean = x.mean(-1, true);
    const variance = x.sub(mean).square().mean(-1, true);
    const normalized = x.sub(mean).div(variance.add(1e-5).sqrt());
    return normalized.mul(gamma).add(beta);
  });
}

/* ──────────────────── Forward Pass ──────────────────── */

export interface ForwardResult {
  logits: tf.Tensor;              // [batch, seqLen, vocabSize]
  attentionWeights: tf.Tensor;    // [batch, numHeads, seqLen, seqLen]
}

export function forward(
  ids: tf.Tensor2D,               // [batch, seqLen] int32
  weights: TransformerWeights,
  config: TransformerConfig,
): ForwardResult {
  const { vocabSize, seqLen, dModel, numHeads } = config;
  const dK = dModel / numHeads;

  // Embedding: oneHot → matmul (differentiable)
  const oneHot = tf.oneHot(ids.cast('int32'), vocabSize).cast('float32'); // [batch, seqLen, vocabSize]
  let x = tf.matMul(oneHot, weights.wEmbed);                              // [batch, seqLen, dModel]

  // Add sinusoidal positional encoding
  const pe = sinusoidalPE(seqLen, dModel);                                 // [seqLen, dModel]
  x = x.add(pe);

  // --- Multi-Head Self-Attention ---
  const batchSize = ids.shape[0];
  const residual1 = x;

  // Q, K, V projections: [batch, seqLen, dModel]
  const Q = tf.matMul(x, weights.wQ);
  const K = tf.matMul(x, weights.wK);
  const V = tf.matMul(x, weights.wV);

  // Reshape to [batch, numHeads, seqLen, dK]
  const reshapeToHeads = (t: tf.Tensor) =>
    t.reshape([batchSize, seqLen, numHeads, dK]).transpose([0, 2, 1, 3]);

  const Qh = reshapeToHeads(Q);
  const Kh = reshapeToHeads(K);
  const Vh = reshapeToHeads(V);

  // Scaled dot-product attention
  const scores = tf.matMul(Qh, Kh, false, true).div(Math.sqrt(dK));       // [batch, heads, seqLen, seqLen]
  const attnWeights = tf.softmax(scores, -1);
  const attnOut = tf.matMul(attnWeights, Vh);                             // [batch, heads, seqLen, dK]

  // Concat heads → [batch, seqLen, dModel], project via W_O
  const concatHeads = attnOut.transpose([0, 2, 1, 3]).reshape([batchSize, seqLen, dModel]);
  const projected = tf.matMul(concatHeads, weights.wO);

  // Residual + LayerNorm
  x = layerNorm(residual1.add(projected), weights.lnGamma1, weights.lnBeta1);

  // --- Feed-Forward Network ---
  const residual2 = x;
  const hidden = tf.matMul(x, weights.ffnW1).add(weights.ffnB1).relu();   // [batch, seqLen, ffnDim]
  const ffnOut = tf.matMul(hidden, weights.ffnW2).add(weights.ffnB2);     // [batch, seqLen, dModel]

  // Residual + LayerNorm
  x = layerNorm(residual2.add(ffnOut), weights.lnGamma2, weights.lnBeta2);

  // Output projection → logits per position
  const logits = tf.matMul(x, weights.wOut).add(weights.bOut);            // [batch, seqLen, vocabSize]

  return { logits, attentionWeights: attnWeights };
}

/* ──────────────────── Loss & Accuracy ──────────────────── */

export function computeLoss(
  logits: tf.Tensor,     // [batch, seqLen, vocabSize]
  targets: tf.Tensor2D,  // [batch, seqLen] int32
  vocabSize: number,
): tf.Scalar {
  return tf.tidy(() => {
    const flat = logits.reshape([-1, vocabSize]);
    const labels = tf.oneHot(targets.cast('int32').reshape([-1]), vocabSize).cast('float32');
    return tf.losses.softmaxCrossEntropy(labels, flat) as tf.Scalar;
  });
}

export function computeAccuracy(
  logits: tf.Tensor,     // [batch, seqLen, vocabSize]
  targets: tf.Tensor2D,  // [batch, seqLen] int32
): number {
  return tf.tidy(() => {
    const preds = logits.argMax(-1);    // [batch, seqLen]
    const correct = preds.equal(targets.cast('int32')).cast('float32');
    return correct.mean().dataSync()[0];
  });
}

/* ──────────────────── Training Step ──────────────────── */

export function trainStep(
  weights: TransformerWeights,
  config: TransformerConfig,
  optimizer: tf.Optimizer,
  inputIds: tf.Tensor2D,   // [batch, seqLen]
  targetIds: tf.Tensor2D,  // [batch, seqLen]
): { loss: number; accuracy: number; attentionWeights: number[] } {
  const vars = getTrainableVars(weights);

  // 1. Gradient step — keep the closure clean, no dispose or dataSync inside
  const { value: lossTensor, grads } = tf.variableGrads(() => {
    const { logits } = forward(inputIds, weights, config);
    return computeLoss(logits, targetIds, config.vocabSize);
  }, vars);

  const lossVal = lossTensor.dataSync()[0];
  lossTensor.dispose();

  optimizer.applyGradients(grads);
  for (const key of Object.keys(grads)) {
    grads[key].dispose();
  }

  // 2. Metrics — separate forward pass wrapped in tidy (safe, no gradient tape)
  const metrics = tf.tidy(() => {
    const { logits, attentionWeights: attn } = forward(inputIds, weights, config);
    return {
      accuracy: computeAccuracy(logits, targetIds),
      attentionWeights: Array.from(attn.dataSync()),
    };
  }) as { accuracy: number; attentionWeights: number[] };

  return { loss: lossVal, accuracy: metrics.accuracy, attentionWeights: metrics.attentionWeights };
}

/* ──────────────────── Predict ──────────────────── */

export function predict(
  inputIds: number[],
  weights: TransformerWeights,
  config: TransformerConfig,
): { prediction: number[]; attentionWeights: number[] } {
  return tf.tidy(() => {
    const ids = tf.tensor2d([inputIds], [1, config.seqLen], 'int32');
    const { logits, attentionWeights } = forward(ids, weights, config);
    const preds = logits.argMax(-1).dataSync();
    const attn = Array.from(attentionWeights.dataSync());
    return { prediction: Array.from(preds), attentionWeights: attn };
  });
}

/* ──────────────────── Data Generation ──────────────────── */

export function generateSortBatch(batchSize: number, seqLen: number, vocabSize: number) {
  // Generate random sequences of integers in [0, vocabSize-1]
  // Target = sorted version
  const inputs: number[][] = [];
  const targets: number[][] = [];

  for (let i = 0; i < batchSize; i++) {
    const seq = Array.from({ length: seqLen }, () => Math.floor(Math.random() * vocabSize));
    const sorted = [...seq].sort((a, b) => a - b);
    inputs.push(seq);
    targets.push(sorted);
  }

  return { inputs, targets };
}
