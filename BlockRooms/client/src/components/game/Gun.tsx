// client/src/components/game/Gun.tsx
import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Model as GunModel } from "../../models/Gun1";
import { GunProps } from "../../types/game";
import useAppStore from "../../zustand/store";

export function Gun({
  isVisible,           // optional (kept for compatibility)
  onShoot,
  canShoot = true,     // optional flag (UI-only gating)
}: GunProps): JSX.Element | null {
  const gunRef = useRef<THREE.Group>(null);
  const { camera, scene } = useThree();

  // Get gun visibility from store
  const { showGun } = useAppStore();

  // Use store value, but allow prop override
  const shouldShow = isVisible !== undefined ? isVisible : showGun;

  // Timer to drive breathing motion
  const swayTime = useRef<number>(0);

  // Shooting and recoil state
  const [isRecoiling, setIsRecoiling] = useState<boolean>(false);
  const recoilTime = useRef<number>(0);
  const shootSound = useRef<HTMLAudioElement | null>(null);

  // Load sound and bind click
  useEffect(() => {
    const audio = new Audio("/shot.mp3");
    audio.volume = 0.7;
    shootSound.current = audio;

    const handleMouseClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (!shouldShow || !canShoot) return;
      shoot();
    };

    document.addEventListener("mousedown", handleMouseClick);
    return () => {
      document.removeEventListener("mousedown", handleMouseClick);
      shootSound.current = null;
    };
  }, [shouldShow, canShoot]);

  const shoot = (): void => {
    if (!canShoot || isRecoiling) return;

    // Play shoot sound
    if (shootSound.current) {
      try {
        shootSound.current.currentTime = 0;
        shootSound.current.play();
      } catch (err) {
        console.log("Failed to play shoot sound:", err);
      }
    }

    // Raycast from camera center
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    raycaster.set(camera.position, direction);

    const intersects = raycaster.intersectObjects(scene.children, true);
    const validIntersects = intersects.filter((intersect: THREE.Intersection) => {
      const object = intersect.object;
      return (
        !(object as THREE.Light).isLight &&
        !(object as THREE.Camera).isCamera &&
        !gunRef.current?.children.some(
          (child: THREE.Object3D) => child === object || child.children.includes(object)
        ) &&
        (object.userData?.isEntity ||
          ((object as THREE.Mesh).geometry && (object as THREE.Mesh).material)) &&
        object.visible
      );
    });

    if (validIntersects.length > 0 && onShoot) {
      const hit = validIntersects[0];
      onShoot(hit, camera.position);
    }

    // Recoil anim
    setIsRecoiling(true);
    recoilTime.current = 0;
    setTimeout(() => setIsRecoiling(false), 200);
  };

  useFrame((_, delta: number) => {
    if (!gunRef.current || !shouldShow) return;

    // Breathing sway
    swayTime.current += delta;
    const swayY = Math.sin(swayTime.current * 2) * 0.01;

    // Base position from camera
    const gunPosition = new THREE.Vector3();
    camera.getWorldPosition(gunPosition);

    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    const down = new THREE.Vector3(0, -1, 0);

    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);
    down.applyQuaternion(camera.quaternion);

    gunPosition.add(forward.multiplyScalar(0.5));
    gunPosition.add(right.multiplyScalar(0.3));
    gunPosition.add(down.multiplyScalar(0.2 + swayY));

    // Recoil offsets
    let recoilOffset = new THREE.Vector3();
    let recoilRotation = { x: 0, y: 0, z: 0 };

    if (isRecoiling) {
      recoilTime.current += delta;

      const recoilDuration = 0.2;
      const recoilProgress = Math.min(recoilTime.current / recoilDuration, 1);
      const eased = 1 - Math.pow(1 - recoilProgress, 3);

      const maxBackward = 0.15;
      const maxUpward = 0.08;
      const maxRot = -0.3;

      const backward = Math.sin(eased * Math.PI) * maxBackward;
      const upward = Math.sin(eased * Math.PI) * maxUpward;
      const rot = Math.sin(eased * Math.PI) * maxRot;

      recoilOffset.add(forward.clone().multiplyScalar(-backward));
      recoilOffset.add(down.clone().multiplyScalar(-upward));

      recoilRotation.x = -rot;
      recoilRotation.z = (Math.random() - 0.5) * 0.1;
    }

    // Apply final transform
    gunPosition.add(recoilOffset);
    gunRef.current.position.copy(gunPosition);

    gunRef.current.quaternion.copy(camera.quaternion);
    gunRef.current.rotateX(0.1 + recoilRotation.x);
    gunRef.current.rotateY(Math.PI);
    gunRef.current.rotateZ(recoilRotation.z);
  });

  if (!shouldShow) return null;

  return (
    <group ref={gunRef}>
      <GunModel scale={[1, 1, 1]} />
    </group>
  );
}
