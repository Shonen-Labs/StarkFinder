import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useAppStore from "../../zustand/store";
// GLTF model (Hound)
import { Model as Hound } from "../../models/Entity1";

interface EntityCubeProps {
  position: [number, number, number];
  isVisible: boolean;
  onSpawn?: () => void;
  entityId?: string;
  onShardCollected?: (pos: [number, number, number]) => void;
}

/** Small floating, spinning shard that glows */
const Shard: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.7 * delta;
    const t = performance.now() * 0.002;
    ref.current.position.y = position[1] + 0.1 + Math.sin(t) * 0.04;
  });
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial
        color="#66ccff"
        emissive="#66ccff"
        emissiveIntensity={1.5}
        roughness={0.2}
        metalness={0.1}
      />
      <pointLight position={[0, 0, 0]} intensity={1.2} distance={3} decay={2} />
    </mesh>
  );
};

// ---- BRIGHTNESS: boost all MeshStandardMaterials inside a loaded GLTF ----
function boostModelMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const mat = (mesh as any)?.material;
    if (!mat) return;
    const apply = (m: any) => {
      if (m.isMeshStandardMaterial) {
        const ms = m as THREE.MeshStandardMaterial;
        // Gentle emissive so details show even in dark
        if (!ms.emissive) ms.emissive = new THREE.Color("#202020");
        ms.emissive = new THREE.Color("#202020");
        ms.emissiveIntensity = Math.max(0.5, ms.emissiveIntensity || 0.0);
        // Slightly stronger reflections if you have an envMap in the scene
        (ms as any).envMapIntensity = Math.max(1.2, (ms as any).envMapIntensity || 1.0);
        // Slight tweak to roughness helps catch light
        ms.roughness = Math.min(0.8, Math.max(0.2, ms.roughness ?? 0.6));
        ms.needsUpdate = true;
      }
    };
    if (Array.isArray(mat)) mat.forEach(apply);
    else apply(mat);
  });
}

export const EntityCube: React.FC<EntityCubeProps> = ({
  position,
  isVisible,
  onSpawn,
  entityId,
  onShardCollected,
}) => {
  // spawn animation
  const [spawned, setSpawned] = useState(false);
  const [scale, setScale] = useState(0.1);

  // live position for following
  const [cubePos, setCubePos] = useState<[number, number, number]>([
    position[0],
    1, // your current spawn Y
    position[2],
  ]);

  const [isFollowing, setIsFollowing] = useState(false);

  // shard state created on death
  const [shardPos, setShardPos] = useState<[number, number, number] | null>(null);
  const [hasSpawnedShard, setHasSpawnedShard] = useState(false);
  const prevVisibleRef = useRef<boolean>(false);

  // model wrapper (so we can rotate the whole body) + optional head bone
  const modelRef = useRef<THREE.Group>(null);
  const headBoneRef = useRef<THREE.Bone | null>(null);

  // keep latest shardPos in a ref for useFrame
  const shardPosRef = useRef<[number, number, number] | null>(null);
  useEffect(() => {
    shardPosRef.current = shardPos;
  }, [shardPos]);

  // reset on show
  useEffect(() => {
    if (isVisible) {
      setCubePos([position[0], 1, position[2]]);
      setSpawned(false);
      setIsFollowing(false);
      setScale(0.1);
      setHasSpawnedShard(false);
      setShardPos(null);

      // (re)discover head bone once model is in the scene + BRIGHTNESS material boost
      queueMicrotask(() => {
        if (!modelRef.current) return;

        // BRIGHTNESS: boost GLTF materials
        boostModelMaterials(modelRef.current);

        let found: THREE.Bone | null = null;
        modelRef.current.traverse((obj) => {
          const anyObj = obj as any;
          if (anyObj.isBone && /head|neck/i.test(obj.name)) {
            found = obj as THREE.Bone;
          }
        });
        headBoneRef.current = found;
      });
    }
  }, [isVisible, position]);

  // spawn animation → wait 2s → follow
  useEffect(() => {
    if (isVisible && !spawned) {
      setSpawned(true);

      const startScale = 0.1;
      const endScale = 1;
      const duration = 1000; // ms
      const startTime = Date.now();

      const animateScale = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentScale = startScale + (endScale - startScale) * easeOutCubic;
        setScale(currentScale);

        if (progress < 1) {
          requestAnimationFrame(animateScale);
        } else {
          onSpawn?.();
          const t = setTimeout(() => setIsFollowing(true), 2000);
          return () => clearTimeout(t);
        }
      };

      animateScale();
    }
  }, [isVisible, spawned, onSpawn]);

  // Follow logic + face-the-player + shard collection
  useFrame((_, delta) => {
    // live store read (avoids extra re-renders)
    const p = useAppStore.getState().position;

    // 1) Follow: keep exactly 2 units away on XZ plane
    if (isVisible && isFollowing) {
      setCubePos(([x, y, z]) => {
        const current = new THREE.Vector3(x, y, z);
        const player = new THREE.Vector3(p.x, y, p.z);

        const dir = player.clone().sub(current);
        let dist = dir.length();
        if (dist < 1e-4) {
          dir.set(1, 0, 0);
          dist = 1;
        }

        const n = dir.clone().divideScalar(dist);
        const stopDistance = 2.0;
        const desired = player.clone().addScaledVector(n, -stopDistance);

        const toDesired = desired.clone().sub(current);
        const remaining = toDesired.length();
        if (remaining < 1e-4) return [x, y, z];

        const speed = 2.0;
        const step = Math.min(remaining, speed * delta);
        const next = current.add(toDesired.normalize().multiplyScalar(step));
        return [next.x, next.y, next.z];
      });
    }

    // 2) Rotate body to face the player (yaw only)
    if (modelRef.current) {
      const me = new THREE.Vector3(cubePos[0], 0, cubePos[2]);
      const you = new THREE.Vector3(p.x, 0, p.z);
      const dir = you.sub(me);
      if (dir.lengthSq() > 1e-6) {
        const yaw = Math.atan2(dir.x, dir.z); // +Z forward → rotate around Y
        modelRef.current.rotation.set(0, yaw, 0);
      }
    }

    // 3) Aim head bone toward the player (if found)
    const head = headBoneRef.current;
    if (head) {
      head.parent?.updateWorldMatrix(true, false);
      const headWorld = new THREE.Vector3();
      head.getWorldPosition(headWorld);
      const p = useAppStore.getState().position;
      const targetWorld = new THREE.Vector3(p.x, headWorld.y, p.z);
      const localTarget = head.parent ? head.parent.worldToLocal(targetWorld.clone()) : targetWorld;
      head.lookAt(localTarget);
      // Optional clamps:
      // const e = head.rotation;
      // e.x = THREE.MathUtils.clamp(e.x, -0.6, 0.6);
      // e.y = THREE.MathUtils.clamp(e.y, -0.8, 0.8);
    }

    // 4) Shard pickup
    const sp = shardPosRef.current;
    if (sp) {
      const playerXZ = new THREE.Vector3(p.x, 0, p.z);
      const shardXZ = new THREE.Vector3(sp[0], 0, sp[2]);
      const collectRadius = 1.25;
      if (playerXZ.distanceTo(shardXZ) <= collectRadius) {
        setShardPos(null);
        onShardCollected?.(sp);
      }
    }
  });

  // Detect death (visible -> not visible) and drop a shard near last position
  useEffect(() => {
    const prev = prevVisibleRef.current;

    if (prev && !isVisible && !hasSpawnedShard) {
      const [cx, cy, cz] = cubePos;
      const jitter = () => (Math.random() - 0.5) * 0.6; // ±0.3
      setShardPos([cx + jitter(), cy + 0.1, cz + jitter()]);
      setHasSpawnedShard(true);
    }

    prevVisibleRef.current = isVisible;
  }, [isVisible, cubePos, hasSpawnedShard]);

  // Don't early-return on invisibility; shard may need to render
  return (
    <group>
      {/* BRIGHTNESS: ambient + key/fill/rim */}
      {isVisible && (
        <>
          <ambientLight intensity={0.35} />
          {/* Key light slightly above-front */}
          <pointLight position={[0.6, 1.2, 0.8]} intensity={8} distance={8} decay={2} />
          {/* Fill light from the side */}
          <pointLight position={[-0.8, 0.8, 0.2]} intensity={3} distance={6} decay={2} />
          {/* Rim/back light to outline the silhouette */}
          <pointLight position={[0, 1.0, -1.2]} intensity={5} distance={8} decay={2} />
        </>
      )}

      {isVisible && (
        // Wrap model so we can rotate whole body & keep our own position/scale
        <group
          ref={modelRef}
          position={cubePos}
          scale={scale}
          userData={{ isEntity: true, entityId: entityId || "unknown" }}
        >
          <Hound />
        </group>
      )}

      {shardPos && <Shard position={shardPos} />}
    </group>
  );
};
