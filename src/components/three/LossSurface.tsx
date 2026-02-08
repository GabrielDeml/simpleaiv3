import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { evaluateSurface, type SurfaceType } from '../../ml/gradient-descent';

interface LossSurfaceProps {
  surfaceType: SurfaceType;
  resolution?: number;
  range?: number;
  onSurfaceClick?: (x: number, y: number) => void;
}

export function LossSurface({ surfaceType, resolution = 60, range = 3, onSurfaceClick }: LossSurfaceProps) {
  const prevGeoRef = useRef<THREE.BufferGeometry | null>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const step = (range * 2) / resolution;

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = -range + i * step;
        const y = -range + j * step;
        let z = evaluateSurface(x, y, surfaceType);
        z = Math.min(z, 20);
        vertices.push(x, z * 0.3, y);
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
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [surfaceType, resolution, range]);

  useEffect(() => {
    const prevGeo = prevGeoRef.current;
    prevGeoRef.current = geometry;
    if (prevGeo && prevGeo !== geometry) prevGeo.dispose();
    return () => {
      prevGeoRef.current?.dispose();
    };
  }, [geometry]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!onSurfaceClick) return;
    e.stopPropagation();
    // In the geometry: x maps to data-x, z maps to data-y (y is the height)
    const dataX = Math.max(-range, Math.min(range, e.point.x));
    const dataY = Math.max(-range, Math.min(range, e.point.z));
    onSurfaceClick(dataX, dataY);
  };

  return (
    <mesh geometry={geometry} onClick={handleClick}>
      <meshBasicMaterial
        wireframe
        color="#38bdf8"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
