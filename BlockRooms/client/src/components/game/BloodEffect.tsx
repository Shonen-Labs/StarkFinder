import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { BloodEffectProps } from "../../types/game";

export function BloodEffect({
  position,
  onComplete,
}: BloodEffectProps): JSX.Element {
  const bloodRef = useRef<THREE.Mesh>(null);
  const [opacity, setOpacity] = useState<number>(1);

  useEffect(() => {
    // Load blood texture
    const textureLoader = new THREE.TextureLoader();
    const bloodTexture = textureLoader.load("/blood.png");

    if (bloodRef.current) {
      (bloodRef.current.material as THREE.MeshBasicMaterial).map = bloodTexture;
      (bloodRef.current.material as THREE.MeshBasicMaterial).transparent = true;
      (bloodRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }

    // Fade out blood effect over 3 seconds
    const fadeInterval = setInterval(() => {
      setOpacity((prev: number) => {
        const newOpacity = prev - 0.02;
        if (newOpacity <= 0) {
          clearInterval(fadeInterval);
          if (onComplete) onComplete();
          return 0;
        }
        return newOpacity;
      });
    }, 50);

    return () => clearInterval(fadeInterval);
  }, [onComplete]);

  useEffect(() => {
    if (bloodRef.current) {
      (bloodRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }, [opacity]);

  return (
    <mesh ref={bloodRef} position={position}>
      <planeGeometry args={[0.7, 0.7]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </mesh>
  );
}
