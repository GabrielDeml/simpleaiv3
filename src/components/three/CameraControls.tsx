import { OrbitControls } from '@react-three/drei';

export function CameraControls() {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.1}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2.1}
    />
  );
}
