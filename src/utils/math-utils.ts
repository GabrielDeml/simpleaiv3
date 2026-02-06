export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

export function denormalize(value: number, min: number, max: number): number {
  return value * (max - min) + min;
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomGaussian(mean = 0, std = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function argmax(arr: number[]): number {
  return arr.indexOf(Math.max(...arr));
}

export function meanSquaredError(predicted: number[], actual: number[]): number {
  const n = predicted.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (predicted[i] - actual[i]) ** 2;
  }
  return sum / n;
}
