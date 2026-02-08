export type SurfaceType = 'bowl' | 'saddle' | 'rosenbrock' | 'beale';

export function evaluateSurface(x: number, y: number, surfaceType: SurfaceType): number {
  switch (surfaceType) {
    case 'bowl':
      return x * x + y * y;
    case 'saddle':
      return x * x - y * y;
    case 'rosenbrock':
      return (1 - x) ** 2 + 100 * (y - x * x) ** 2;
    case 'beale': {
      const a = (1.5 - x + x * y) ** 2;
      const b = (2.25 - x + x * y * y) ** 2;
      const c = (2.625 - x + x * y * y * y) ** 2;
      return a + b + c;
    }
  }
}

export function computeGradient(x: number, y: number, surfaceType: SurfaceType): [number, number] {
  switch (surfaceType) {
    case 'bowl':
      return [2 * x, 2 * y];
    case 'saddle':
      return [2 * x, -2 * y];
    case 'rosenbrock':
      return [-2 * (1 - x) + 200 * (y - x * x) * (-2 * x), 200 * (y - x * x)];
    case 'beale': {
      const h = 1e-5;
      const dfdx =
        (evaluateSurface(x + h, y, surfaceType) - evaluateSurface(x - h, y, surfaceType)) / (2 * h);
      const dfdy =
        (evaluateSurface(x, y + h, surfaceType) - evaluateSurface(x, y - h, surfaceType)) / (2 * h);
      return [dfdx, dfdy];
    }
  }
}

export function gradientStep(
  x: number,
  y: number,
  learningRate: number,
  surfaceType: SurfaceType,
): [number, number] {
  let [gx, gy] = computeGradient(x, y, surfaceType);
  // Clip gradient magnitude to prevent divergence on steep surfaces
  const mag = Math.sqrt(gx * gx + gy * gy);
  const maxMag = 50;
  if (mag > maxMag) {
    gx = (gx / mag) * maxMag;
    gy = (gy / mag) * maxMag;
  }
  return [x - learningRate * gx, y - learningRate * gy];
}
