import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { evaluateSurface, type SurfaceType } from '../../ml/gradient-descent';

interface GradientPathProps {
  path: [number, number][];
  surfaceType: SurfaceType;
}

export function GradientPath({ path, surfaceType }: GradientPathProps) {
  const sphereRef = useRef<THREE.Mesh>(null);

  const linePoints = useMemo(() => {
    return path.map(([x, y]) => {
      const z = evaluateSurface(x, y, surfaceType);
      const height = Math.min(z, 20) * 0.3 + 0.15;
      return new THREE.Vector3(x, height, y);
    });
  }, [path, surfaceType]);

  // Animate current position sphere pulsing
  useFrame(({ clock }) => {
    if (sphereRef.current && linePoints.length > 0) {
      const last = linePoints[linePoints.length - 1];
      sphereRef.current.position.copy(last);
      const scale = 1 + Math.sin(clock.elapsedTime * 4) * 0.2;
      sphereRef.current.scale.setScalar(scale);
    }
  });

  if (linePoints.length === 0) return null;

  return (
    <group>
      {linePoints.length >= 2 && <Line points={linePoints} color="#ef4444" lineWidth={2} />}

      {/* Step spheres */}
      {linePoints.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={i === linePoints.length - 1 ? '#ef4444' : '#f97316'} />
        </mesh>
      ))}

      {/* Pulsing current position */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
