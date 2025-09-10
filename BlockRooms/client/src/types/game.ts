import { Vector3 } from "three";
import * as THREE from "three";

// Core game interfaces
export interface WarningDialogProps {
  onAccept: () => void;
}

export interface Keys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export interface FirstPersonControlsProps {
  onPositionUpdate?: (position: Vector3) => void;
  onRotationUpdate?: (rotation: number) => void; // New prop for rotation updates
}

export type GunProps = {
  isVisible?: boolean;
  onShoot?: (hit: THREE.Intersection, cameraPosition: THREE.Vector3) => void;
  canShoot?: boolean;
};


export interface RoomNotificationProps {
  roomNumber: number;
  onClose: () => void;
}

export interface EnemyProps {
  position: [number, number, number];
  roomNumber: number;
  onDeath: (roomNumber: number) => void;
  onPlayerDetected?: () => void;
}

export interface RoomDetectorProps {
  playerPosition: Vector3 | null;
  onRoomEnter: (roomNumber: number) => void;
}

export interface BloodEffectProps {
  position: Vector3;
  onComplete: () => void;
}

export interface BulletHoleProps {
  position: Vector3;
  normal: Vector3;
  cameraPosition: Vector3;
  onComplete: () => void;
}



// Data structures
export interface RoomBounds {
  x: [number, number];
  z: [number, number];
}

export interface EnemyData {
  roomNumber: number;
  position: [number, number, number];
  id: number;
}

export interface BloodEffect {
  id: number;
  position: Vector3;
}

export interface BulletHole {
  id: number;
  position: Vector3;
  normal: Vector3;
  cameraPosition: Vector3;
}

export interface Keys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

// --- UI-only helpers for ammo/reload overlays ---
export type GunUiState = {
  gunAmmo?: number;
  gunMag?: number;
  gunReloading?: boolean;
};



