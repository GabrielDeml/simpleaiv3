import { scaleLinear, scaleSequential } from 'd3-scale';
import { interpolateRdYlBu, interpolateViridis, interpolatePlasma } from 'd3-scale-chromatic';

export function createDivergingScale(domain: [number, number] = [0, 1]) {
  return scaleSequential(interpolateRdYlBu).domain(domain);
}

export function createViridisScale(domain: [number, number] = [0, 1]) {
  return scaleSequential(interpolateViridis).domain(domain);
}

export function createPlasmaScale(domain: [number, number] = [0, 1]) {
  return scaleSequential(interpolatePlasma).domain(domain);
}

export function createClassScale(numClasses: number) {
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
  ];
  return scaleLinear<string>()
    .domain(Array.from({ length: numClasses }, (_, i) => i))
    .range(colors.slice(0, numClasses));
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

export function colorStringToRgb(color: string): [number, number, number] {
  if (color.startsWith('#')) return hexToRgb(color);
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
    }
  }
  return [0, 0, 0];
}
