import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { BulletHoleProps } from "../../types/game";

export function BulletHole({
  position,
  normal,
  cameraPosition,
  onComplete,
}: BulletHoleProps): JSX.Element {
  const holeRef = useRef<THREE.Mesh>(null);
  const [opacity, setOpacity] = useState<number>(1);

  useEffect(() => {
    // Load hole texture
    const textureLoader = new THREE.TextureLoader();
    const holeTexture = textureLoader.load("/hole.png");

    if (holeRef.current) {
      (holeRef.current.material as THREE.MeshBasicMaterial).map = holeTexture;
      (holeRef.current.material as THREE.MeshBasicMaterial).transparent = true;
      (holeRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;

      // Orient the hole to face towards the camera (player)
      holeRef.current.lookAt(cameraPosition);
    }

    // Remove bullet hole after 10 seconds
    const removeTimeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 10000);

    return () => clearTimeout(removeTimeout);
  }, [position, normal, cameraPosition, onComplete]);

  return (
    <mesh ref={holeRef} position={position}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </mesh>
  );
}
