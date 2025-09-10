import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

type Props = {
  minorStep?: number;     // spacing for faint grid, in world units
  highlightStep?: number; // yellow lines every N units
  size?: number;          // total grid width/height (centered at origin)
  y?: number;             // slight lift above the floor to prevent z-fighting
};

export default function FloorGrid({
  minorStep = 1,
  highlightStep = 20,
  size = 2000,
  y = 0.01,
}: Props) {
  // Minor grid (e.g., every 1 unit), faint green
  const minor = useMemo(() => {
    const divisions = Math.max(1, Math.round(size / minorStep));
    const g = new THREE.GridHelper(size, divisions, 0x00ff00, 0x00ff00);
    const mat = g.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = 0.15;
    // GridHelper is already on XZ (Y-up). No rotation needed.
    g.position.y = y;
    g.renderOrder = -1;
    return g;
  }, [size, minorStep, y]);

  // Major grid (highlight): every 20 units, yellow and more opaque
  const major = useMemo(() => {
    const divisions = Math.max(1, Math.round(size / highlightStep));
    const g = new THREE.GridHelper(size, divisions, 0xffff00, 0xffff00);
    const mat = g.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = 0.9;
    g.position.y = y + 0.001; // tiny offset above minor grid
    g.renderOrder = 0;
    return g;
  }, [size, highlightStep, y]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      minor.geometry.dispose();
      (minor.material as THREE.Material).dispose();
      major.geometry.dispose();
      (major.material as THREE.Material).dispose();
    };
  }, [minor, major]);

  return (
    <>
      <primitive object={minor} />
      {/* highlight lines */}
      <primitive object={major} />
    </>
  );
}
