import { describe, it, expect } from 'vitest';
import { dataToCanvas, canvasToData } from '../canvas-helpers';

describe('dataToCanvas', () => {
  const width = 400;
  const height = 400;

  it('maps center of data range to center of canvas', () => {
    const [cx, cy] = dataToCanvas(0, 0, width, height);
    expect(cx).toBeCloseTo(200, 5);
    expect(cy).toBeCloseTo(200, 5);
  });

  it('maps bottom-left data corner to bottom-left canvas corner', () => {
    // data (-1, -1) => canvas (0, 400) because y is flipped
    const [cx, cy] = dataToCanvas(-1, -1, width, height);
    expect(cx).toBeCloseTo(0, 5);
    expect(cy).toBeCloseTo(400, 5);
  });

  it('maps top-right data corner to top-right canvas corner', () => {
    // data (1, 1) => canvas (400, 0) because y is flipped
    const [cx, cy] = dataToCanvas(1, 1, width, height);
    expect(cx).toBeCloseTo(400, 5);
    expect(cy).toBeCloseTo(0, 5);
  });

  it('handles custom ranges', () => {
    const [cx, cy] = dataToCanvas(5, 5, width, height, [0, 10], [0, 10]);
    expect(cx).toBeCloseTo(200, 5);
    expect(cy).toBeCloseTo(200, 5);
  });

  it('handles non-square canvas dimensions', () => {
    const [cx, cy] = dataToCanvas(0, 0, 800, 400);
    expect(cx).toBeCloseTo(400, 5);
    expect(cy).toBeCloseTo(200, 5);
  });
});

describe('canvasToData', () => {
  const width = 400;
  const height = 400;

  it('maps center of canvas to center of data range', () => {
    const [dx, dy] = canvasToData(200, 200, width, height);
    expect(dx).toBeCloseTo(0, 5);
    expect(dy).toBeCloseTo(0, 5);
  });

  it('maps top-left canvas corner to top-left data', () => {
    // canvas (0, 0) => data (-1, 1)
    const [dx, dy] = canvasToData(0, 0, width, height);
    expect(dx).toBeCloseTo(-1, 5);
    expect(dy).toBeCloseTo(1, 5);
  });

  it('maps bottom-right canvas corner to bottom-right data', () => {
    // canvas (400, 400) => data (1, -1)
    const [dx, dy] = canvasToData(400, 400, width, height);
    expect(dx).toBeCloseTo(1, 5);
    expect(dy).toBeCloseTo(-1, 5);
  });

  it('handles custom ranges', () => {
    const [dx, dy] = canvasToData(200, 200, width, height, [0, 10], [0, 10]);
    expect(dx).toBeCloseTo(5, 5);
    expect(dy).toBeCloseTo(5, 5);
  });
});

describe('round-trip conversion', () => {
  const width = 500;
  const height = 300;
  const rangeX: [number, number] = [-2, 2];
  const rangeY: [number, number] = [-3, 3];

  it('dataToCanvas then canvasToData returns original values', () => {
    const testPoints = [
      [0, 0],
      [1, 1],
      [-1, -1],
      [0.5, -0.5],
      [-1.5, 2.5],
    ];

    for (const [x, y] of testPoints) {
      const [cx, cy] = dataToCanvas(x, y, width, height, rangeX, rangeY);
      const [rx, ry] = canvasToData(cx, cy, width, height, rangeX, rangeY);
      expect(rx).toBeCloseTo(x, 8);
      expect(ry).toBeCloseTo(y, 8);
    }
  });

  it('canvasToData then dataToCanvas returns original values', () => {
    const testPoints = [
      [0, 0],
      [250, 150],
      [500, 300],
      [100, 50],
    ];

    for (const [cx, cy] of testPoints) {
      const [dx, dy] = canvasToData(cx, cy, width, height, rangeX, rangeY);
      const [rcx, rcy] = dataToCanvas(dx, dy, width, height, rangeX, rangeY);
      expect(rcx).toBeCloseTo(cx, 8);
      expect(rcy).toBeCloseTo(cy, 8);
    }
  });
});
