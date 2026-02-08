import { useMemo } from 'react';
import { useNeuralNetworkStore } from '../../stores/useNeuralNetworkStore';

const NODE_RADIUS = 12;
const LAYER_SPACING = 50;
const NODE_SPACING = 46;

function weightToColor(w: number): string {
  const clamped = Math.max(-1, Math.min(1, w));
  if (clamped > 0) {
    const intensity = Math.floor(clamped * 200 + 55);
    return `rgb(55, 55, ${intensity})`;
  } else {
    const intensity = Math.floor(-clamped * 200 + 55);
    return `rgb(${intensity}, 55, 55)`;
  }
}

function weightToOpacity(w: number): number {
  return 0.15 + (Math.min(Math.abs(w), 2) / 2) * 0.85;
}

export function NetworkDiagram() {
  const architecture = useNeuralNetworkStore((s) => s.architecture);
  const weights = useNeuralNetworkStore((s) => s.weights);

  const layerSizes = useMemo(() => {
    const sizes = [architecture.inputSize];
    for (const layer of architecture.layers) {
      sizes.push(layer.units);
    }
    sizes.push(architecture.outputSize);
    return sizes;
  }, [architecture]);

  const activations = useMemo(() => {
    const acts: string[] = ['input'];
    for (const layer of architecture.layers) {
      acts.push(layer.activation);
    }
    acts.push(architecture.outputActivation);
    return acts;
  }, [architecture]);

  const numLayers = layerSizes.length;
  const maxNodes = Math.max(...layerSizes);
  // Rotated: width is based on max nodes (horizontal), height on layers (vertical)
  const svgWidth = (maxNodes - 1) * NODE_SPACING + 60;
  const svgHeight = (numLayers - 1) * LAYER_SPACING + 60;

  const nodePositions = useMemo(() => {
    const positions: { x: number; y: number }[][] = [];
    for (let l = 0; l < numLayers; l++) {
      const count = layerSizes[l];
      const layerWidth = (count - 1) * NODE_SPACING;
      const startX = (svgWidth - layerWidth) / 2;
      const y = 30 + l * LAYER_SPACING;
      const layer: { x: number; y: number }[] = [];
      for (let n = 0; n < count; n++) {
        layer.push({ x: startX + n * NODE_SPACING, y });
      }
      positions.push(layer);
    }
    return positions;
  }, [layerSizes, numLayers, svgWidth]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Edges */}
        {nodePositions.map((layer, l) => {
          if (l === numLayers - 1) return null;
          const nextLayer = nodePositions[l + 1];
          // weights[l] contains [kernel, bias] where kernel is flat (inputSize * outputSize)
          const layerWeights = weights?.[l]?.[0];

          return layer.map((from, fi) =>
            nextLayer.map((to, ti) => {
              // kernel is stored column-major in TF.js: index = fi * nextLayer.length + ti
              const w = layerWeights ? (layerWeights[fi * nextLayer.length + ti] ?? 0) : 0;
              return (
                <line
                  key={`${l}-${fi}-${ti}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={weights ? weightToColor(w) : '#475569'}
                  strokeWidth={weights ? 0.5 + Math.min(Math.abs(w), 2) * 1.5 : 0.8}
                  opacity={weights ? weightToOpacity(w) : 0.3}
                />
              );
            }),
          );
        })}

        {/* Nodes */}
        {nodePositions.map((layer, l) =>
          layer.map((pos, ni) => (
            <g key={`node-${l}-${ni}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill="#1e293b"
                stroke={l === 0 ? '#3b82f6' : l === numLayers - 1 ? '#10b981' : '#8b5cf6'}
                strokeWidth={1.5}
              />
            </g>
          )),
        )}

        {/* Layer labels on the right side */}
        {nodePositions.map((layer, l) => {
          const lastNode = layer[layer.length - 1];
          return (
            <text
              key={`label-${l}`}
              x={lastNode.x + NODE_RADIUS + 8}
              y={lastNode.y + 4}
              textAnchor="start"
              fill="#94a3b8"
              fontSize={9}
            >
              {activations[l] === 'input'
                ? `in(${layerSizes[l]})`
                : `${activations[l]}(${layerSizes[l]})`}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
