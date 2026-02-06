import { COLORS, CANVAS } from '../config/constants';

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = COLORS.surfaceLight;
  ctx.fillRect(0, 0, width, height);
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step = 40,
): void {
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = CANVAS.gridOpacity;
  for (let x = step; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = step; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawAxes(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const cx = width / 2;
  const cy = height / 2;
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, height);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number = CANVAS.pointRadius,
  outlined = false,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (outlined) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number = CANVAS.lineWidth,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function dataToCanvas(
  dataX: number,
  dataY: number,
  width: number,
  height: number,
  rangeX: [number, number] = [-1, 1],
  rangeY: [number, number] = [-1, 1],
): [number, number] {
  const cx = ((dataX - rangeX[0]) / (rangeX[1] - rangeX[0])) * width;
  const cy = height - ((dataY - rangeY[0]) / (rangeY[1] - rangeY[0])) * height;
  return [cx, cy];
}

export function canvasToData(
  canvasX: number,
  canvasY: number,
  width: number,
  height: number,
  rangeX: [number, number] = [-1, 1],
  rangeY: [number, number] = [-1, 1],
): [number, number] {
  const dx = (canvasX / width) * (rangeX[1] - rangeX[0]) + rangeX[0];
  const dy = ((height - canvasY) / height) * (rangeY[1] - rangeY[0]) + rangeY[0];
  return [dx, dy];
}
