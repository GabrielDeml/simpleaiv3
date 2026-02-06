import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { evaluateSurface, type SurfaceType } from '../../ml/gradient-descent';
import { createViridisScale } from '../../utils/color-scales';

interface LossSurfaceProps {
  surfaceType: SurfaceType;
  resolution?: number;
  range?: number;
}

export function LossSurface({ surfaceType, resolution = 80, range = 3 }: LossSurfaceProps) {
  const prevGeoRef = useRef<THREE.BufferGeometry | null>(null);

  const geometry = useMemo(() => {
    if (prevGeoRef.current) {
      prevGeoRef.current.dispose();
    }
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const step = (range * 2) / resolution;
    const zValues: number[] = [];

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = -range + i * step;
        const y = -range + j * step;
        let z = evaluateSurface(x, y, surfaceType);
        // Clamp z for visualization
        z = Math.min(z, 20);
        vertices.push(x, z * 0.3, y); // y-up coordinate system: (x, height, z)
        zValues.push(z);
      }
    }

    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);
    const colorScale = createViridisScale([zMin, zMax]);

    for (let i = 0; i < zValues.length; i++) {
      const colorStr = colorScale(zValues[i]);
      const match = colorStr.match(/\d+/g);
      if (match) {
        colors.push(parseInt(match[0]) / 255, parseInt(match[1]) / 255, parseInt(match[2]) / 255);
      } else {
        colors.push(0, 0, 0);
      }
    }

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * (resolution + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (resolution + 1) + j;
        const d = c + 1;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    prevGeoRef.current = geo;
    return geo;
  }, [surfaceType, resolution, range]);

  useEffect(() => {
    return () => {
      if (prevGeoRef.current) {
        prevGeoRef.current.dispose();
      }
    };
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}
