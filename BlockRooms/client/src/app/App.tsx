import { useState, useCallback, useEffect, useRef } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { PointerLockControls } from "@react-three/drei";
import { Vector3 } from "three";
import * as THREE from "three";
import { TransactionPopup } from "../components/ui/TransactionPopup";
import { usePlayerMovement } from "../dojo/hooks/usePlayerMovement";
import { useAttackEntity } from "../dojo/hooks/useAttackEntity";
import useAppStore, { GamePhase } from "../zustand/store";

import { MainMenu } from "../components/ui/MainMenu";
import { Crosshair } from "../components/ui/Crosshair";
import { PlayerHUD } from "../components/ui/PlayerHUD";
// import { MapTracker } from "../components/systems/MapTracker";
import { Gun } from "../components/game/Gun";
import { BloodEffect } from "../components/game/BloodEffect";
import { BulletHole } from "../components/game/BulletHole";
import { EntityCube } from "../components/game/EntityCube";
import { AudioManager } from "../components/systems/AudioManager";
import { FirstPersonControls } from "../components/systems/FirstPersonControls";
import { Model } from "../models/Bloccc";
// import NearbyDoorsComponent from "../components/ui/NearbyDoorsComponent";
import FloorGrid from "../components/game/FloorGrid";

import BlockroomsCard from "../components/ui/BlockroomsCard";
import { HUD } from "../components/ui/HUD";
import { GrainVignetteOverlay } from "../components/ui/GrainVignetteOverlay";
import { DarknessMask } from "../components/ui/DarknessMask";
import { Flashlight } from "../components/ui/Flashlight";
import Table from "../models/Table";

// Import types
import {
  BloodEffect as BloodEffectType,
  BulletHole as BulletHoleType,
} from "../types/game";
import { useOpenDoor } from "../dojo/hooks/useDoor";
import { useCollectShard } from "../dojo/hooks/useCollectShard";
import { useGameData } from "../dojo/hooks/useGameData";
import { useEndGame } from "../dojo/hooks/useEndGame";

// Door Wall Component
const DoorWall = ({
  position,
  rotation,
  doorOpening,
  doorOpened,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  doorOpening: [number, number, number];
  doorOpened: boolean;
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Left wall section */}
      <mesh position={[-2, 1.5, 0]}>
        <boxGeometry args={[2, 3, 0.2]} />
        <meshStandardMaterial color="#68655B" />
      </mesh>

      {/* Right wall section */}
      <mesh position={[2, 1.5, 0]}>
        <boxGeometry args={[2, 3, 0.2]} />
        <meshStandardMaterial color="#68655B" />
      </mesh>

      {/* Top wall section (above door) */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[2, 1, 0.2]} />
        <meshStandardMaterial color="#68655B" />
      </mesh>

      {/* Door frame - only show if door is not opened */}
      {!doorOpened && (
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[2.2, 2.2, 0.15]} />
          <meshStandardMaterial color="#68655B" />
        </mesh>
      )}
    </group>
  );
};

// Center-screen raycast to know if the crosshair is on an enemy
const AimProbe = ({ onUpdate }: { onUpdate: (aiming: boolean) => void }) => {
  const { camera, scene } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const center = useRef(new THREE.Vector2(0, 0)); // crosshair = screen center

  useFrame(() => {
    const ray = raycasterRef.current;
    ray.setFromCamera(center.current, camera);

    const hits = ray.intersectObjects(scene.children, true);

    // consider a hit if any intersected object (or its parent chain) has userData.isEntity
    const onEnemy = hits.some((h) => {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        if (o.userData && o.userData.isEntity) return true;
        o = o.parent as THREE.Object3D | null;
      }
      return false;
    });

    onUpdate(onEnemy);
  });

  return null;
};

// Small glowing cubes that bob/float near where the enemy cube was
const ShardCluster = ({
  position,
  visible,
}: {
  position: [number, number, number];
  visible: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += delta * 0.6; // gentle spin

    const t = state.clock.getElapsedTime();
    // bob each shard a bit differently
    g.children.forEach((child, i) => {
      const base = 0.18 + i * 0.02;
      child.position.y = base + Math.sin(t * 2 + i * 0.7) * 0.06;
    });
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* three tiny cubes with different emissive colors */}
      <mesh position={[-0.25, 0.2, 0.15]}>
        <boxGeometry args={[0.26, 0.26, 0.26]} />
        <meshStandardMaterial
          color="#ff5a54"
          emissive="#ff5a54"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.18, 0.24, -0.2]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial
          color="#5aff7c"
          emissive="#5aff7c"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.05, 0.28, 0.25]}>
        <boxGeometry args={[0.24, 0.24, 0.24]} />
        <meshStandardMaterial
          color="#4aa8ff"
          emissive="#4aa8ff"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

const App = (): JSX.Element => {
  // IMPORTANT: All hooks must be called unconditionally at the top
  // Get game session state, UI state, and player state from Zustand store
  const [doorOpened, setDoorOpened] = useState<boolean>(false); // Room 1 doors (1 & 2)
  const [door2Opened, setDoor2Opened] = useState<boolean>(false); // Room 2 doors (3 & 4)
  const [door3Opened, setDoor3Opened] = useState<boolean>(false); // Doors 5 & 6
  const [door4Opened, setDoor4Opened] = useState<boolean>(false);
  const [door5Opened, setDoor5Opened] = useState<boolean>(false); // Room 5 (doors 8 & 9)
  const [door6Opened, setDoor6Opened] = useState<boolean>(false); // Room 6 (doors 10 & 11)
  const [door7Opened, setDoor7Opened] = useState<boolean>(false); // Room 7 (doors 12 & 13)
  // const [door8Opened, setDoor8Opened] = useState<boolean>(false);   // Room 8 (doors 14 & 15)
  // const [door9Opened, setDoor9Opened] = useState<boolean>(false);   // Room 9 (doors 16 & 17)

  const {
    gameStarted,
    showGun,
    showCrosshair,
    showMapTracker,
    position: playerPosition,
    rotation: playerRotation,
    connectionStatus,
    player,
    currentRoom,
    gamePhase,
    updatePosition,
    updateRotation,
    entities,
  } = useAppStore();

  const {
    showTransactionPopup,
    transactionError,
    isProcessingTransaction,
    closeTransactionPopup,
  } = usePlayerMovement();
  const { isLoading, enterDoor, exitDoor } = useOpenDoor();
  const { attackEntity } = useAttackEntity();
  const { collectShard } = useCollectShard();
  const { refetch: refetchGameData } = useGameData();

  // Track shard collection per room (session-local UI state)
  const [room1ShardCollected, setRoom1ShardCollected] = useState(false);
  const [room2ShardCollected, setRoom2ShardCollected] = useState(false);
  const [room3ShardCollected, setRoom3ShardCollected] = useState(false); // shard for room 3
  const [room4ShardCollected, setRoom4ShardCollected] = useState(false); // shard for room 4
  const [room5ShardCollected, setRoom5ShardCollected] = useState(false); // shard for room 5
  const [room6ShardCollected, setRoom6ShardCollected] = useState(false); // shard for room 6
  const [room7ShardCollected, setRoom7ShardCollected] = useState(false); // shard for room 7

  // State for entity cubes
  const [entityCubeVisible, setEntityCubeVisible] = useState<boolean>(false); // room 1
  const [cubePosition] = useState<[number, number, number]>([389, 1.5, 308]);
  const [entityCube2Visible, setEntityCube2Visible] = useState<boolean>(false); // room 2
  const [cube2Position] = useState<[number, number, number]>([343, 1.5, 299]);
  const [entityCube3Visible, setEntityCube3Visible] = useState<boolean>(false);
  const [cube3Position] = useState<[number, number, number]>([349, 1.5, 393]); // pick a spot in R3z
  const [entityCube4Visible, setEntityCube4Visible] = useState<boolean>(false);
  const [cube4Position] = useState<[number, number, number]>([322, 1.5, 372]); // spawn entity R4
  const [entityCube5Visible, setEntityCube5Visible] = useState<boolean>(false);
  const [cube5Position] = useState<[number, number, number]>([300, 1.5, 350]); // spawn entity R5
  const [entityCube6Visible, setEntityCube6Visible] = useState<boolean>(false);
  const [cube6Position] = useState<[number, number, number]>([274, 1.5, 334]); // spawn entity R6
  const [entityCube7Visible, setEntityCube7Visible] = useState<boolean>(false);
  const [cube7Position] = useState<[number, number, number]>([277, 1.5, 295]); // spawn entity R7

  // Local VFX/UI state
  const [aimingAtEntity, setAimingAtEntity] = useState(false);

  const [bulletHoles, setBulletHoles] = useState<BulletHoleType[]>([]);
  const [bloodEffects, setBloodEffects] = useState<BloodEffectType[]>([]);
  const [ePressed, setEPressed] = useState<boolean>(false);
  const [fPressed, setFPressed] = useState<boolean>(false);
  const [showShootPrompt, setShowShootPrompt] = useState<boolean>(false);

  const [xPressed, setXPressed] = useState<boolean>(false);
  const [showShardPrompt, setShowShardPrompt] = useState<boolean>(false);
  const [shardPromptKey, setShardPromptKey] = useState<number>(0);
  const [qPressed, setQPressed] = useState<boolean>(false);
  const [bPressed, setBPressed] = useState<boolean>(false);
  const [showExitPrompt, setShowExitPrompt] = useState<boolean>(false);
  const [exitPromptKey, setExitPromptKey] = useState<number>(0);
  const [shootPanelEnabled, setShootPanelEnabled] = useState<boolean>(false);
  const [shardPanelEnabled, setShardPanelEnabled] = useState<boolean>(false);
  const [exitPanelEnabled, setExitPanelEnabled] = useState<boolean>(false);
  const [promptKey, setPromptKey] = useState<number>(0);

  const { endGame } = useEndGame();

  // Initialize player position at map center on component mount
  useEffect(() => {
    const mapCenterPosition = new Vector3(400, 1.5, 400);
    updatePosition(mapCenterPosition);
  }, [updatePosition]);

  // Room 1: hide cube when entity dies (open is gated to Q+shard)
  useEffect(() => {
    if (entityCubeVisible) {
      const entity = entities.filter((e) => e.room_id.toString() === "1");
      if (entity.length > 0) {
        const target = entity[0];
        if (!target.is_alive || Number(target.health) <= 0) {
          console.log("Room 1 entity died, hiding cube");
          setEntityCubeVisible(false);
          setShootPanelEnabled(false);
          if (!room1ShardCollected) setShardPanelEnabled(true); // enable only if not collected yet
        } else {
          setShardPanelEnabled(false);
        }
      }
    }
  }, [entities, entityCubeVisible, room1ShardCollected]);

  // Room 2: hide cube when entity dies
  useEffect(() => {
    if (!entityCube2Visible) return;
    const entity = entities.filter((e) => e.room_id.toString() === "2");
    if (entity.length > 0) {
      const target = entity[0];
      if (!target.is_alive || Number(target.health) <= 0) {
        console.log("Room 2 entity died, hiding cube");
        setEntityCube2Visible(false);
        setShootPanelEnabled(false);
        if (!room2ShardCollected) setShardPanelEnabled(true);
      } else {
        setShardPanelEnabled(false);
      }
    }
    // NOTE: if list is empty temporarily after enterDoor, do nothing
  }, [entities, entityCube2Visible, room2ShardCollected]);

  // Room 3: hide cube when entity dies
  useEffect(() => {
    if (!entityCube3Visible) return;
    const entity = entities.filter((e) => e.room_id.toString() === "3");
    if (entity.length > 0) {
      const target = entity[0];
      if (!target.is_alive || Number(target.health) <= 0) {
        console.log("Room 3 entity died, hiding cube");
        setEntityCube3Visible(false);
        setShootPanelEnabled(false);
        if (!room3ShardCollected) setShardPanelEnabled(true);
      } else {
        setShardPanelEnabled(false);
      }
    }
    // NOTE: if list is empty temporarily after enterDoor, do nothing
  }, [entities, entityCube3Visible, room3ShardCollected]);

  // Room 4: hide cube when entity dies
  useEffect(() => {
    if (!entityCube4Visible) return;
    const entity = entities.filter((e) => e.room_id.toString() === "4");
    if (entity.length > 0) {
      const target = entity[0];
      if (!target.is_alive || Number(target.health) <= 0) {
        console.log("Room 4 entity died, hiding cube");
        setEntityCube4Visible(false);
        setShootPanelEnabled(false);
        if (!room4ShardCollected) setShardPanelEnabled(true);
      } else {
        setShardPanelEnabled(false);
      }
    }
    // NOTE: if list is empty temporarily after enterDoor, do nothing
  }, [entities, entityCube4Visible, room4ShardCollected]);

  // Room 5: hide cube when entity dies
  useEffect(() => {
    if (!entityCube5Visible) return;
    const entity = entities.filter((e) => e.room_id.toString() === "5");
    if (entity.length > 0) {
      const target = entity[0];
      if (!target.is_alive || Number(target.health) <= 0) {
        console.log("Room 5 entity died, hiding cube");
        setEntityCube5Visible(false);
        setShootPanelEnabled(false);
        if (!room5ShardCollected) setShardPanelEnabled(true);
      } else {
        setShardPanelEnabled(false);
      }
    }
    // NOTE: if list is empty temporarily after enterDoor, do nothing
  }, [entities, entityCube5Visible, room5ShardCollected]);

  // Room 6: hide cube when entity dies
  useEffect(() => {
    if (!entityCube6Visible) return;
    const entity = entities.filter((e) => e.room_id.toString() === "6");
    if (entity.length > 0) {
      const target = entity[0];
      if (!target.is_alive || Number(target.health) <= 0) {
        console.log("Room 6 entity died, hiding cube");
        setEntityCube6Visible(false);
        setShootPanelEnabled(false);
        if (!room6ShardCollected) setShardPanelEnabled(true);
      } else {
        setShardPanelEnabled(false);
      }
    }
    // NOTE: if list is empty temporarily after enterDoor, do nothing
  }, [entities, entityCube6Visible, room6ShardCollected]);

  // Room 7: hide cube when entity dies
  useEffect(() => {
    if (!entityCube7Visible) return;
    const entity = entities.filter((e) => e.room_id.toString() === "7");
    if (entity.length > 0) {
      const target = entity[0];
      if (!target.is_alive || Number(target.health) <= 0) {
        console.log("Room 7 entity died, hiding cube");
        setEntityCube7Visible(false);
        setShootPanelEnabled(false);
        if (!room7ShardCollected) setShardPanelEnabled(true);
      } else {
        setShardPanelEnabled(false);
      }
    }
    // NOTE: if list is empty temporarily after enterDoor, do nothing
  }, [entities, entityCube7Visible, room7ShardCollected]);

  // Helper: door proximity
  const isAtDoorPosition = useCallback(() => {
    const x = Math.round(playerPosition.x);
    const z = Math.round(playerPosition.z);

    // Room 1
    const atDoor1 = x >= 370 && x <= 374 && z >= 305 && z <= 308;
    const atDoor2 = x >= 382 && x <= 387 && z >= 324 && z <= 328;

    // Room 2
    const atDoor3 = x >= 350 && x <= 360 && z >= 290 && z <= 300;
    const atDoor4 = x >= 335 && x <= 345 && z >= 290 && z <= 300;

    // Room 3 (frontend coords; "y" == z)
    const atDoor5 = x >= 363 && x <= 370 && z >= 398 && z <= 405;
    const atDoor6 = x >= 363 && x <= 364 && z >= 367 && z <= 370;

    // Room 4
    const atDoor7 = x >= 323 && x <= 324 && z >= 358 && z <= 359;

    // Room 5
    const atDoor8 = x >= 303 && x <= 304 && z >= 349 && z <= 350;
    const atDoor9 = x >= 288 && x <= 289 && z >= 377 && z <= 378;
    //this is correct and works

    // Room 6  (doors 10, 11)
    const atDoor10 = x >= 278 && x <= 282 && z >= 347 && z <= 349; // include 282 (281.5 → 282)
    const atDoor11 = x >= 269 && x <= 274 && z >= 320 && z <= 322;
    //this is showing room5 in ui and gql --> must be room6

    // Room 7
    const atDoor12 = x >= 275 && x <= 278 && z >= 281 && z <= 283;
    const atDoor13 = x >= 281 && x <= 283 && z >= 308 && z <= 311;
    //this is showing room6 in ui and gql --> must be room7

    return {
      atDoor1,
      atDoor2,
      atDoor3,
      atDoor4,
      atDoor5,
      atDoor6,
      atDoor7,
      atDoor8,
      atDoor9,
      atDoor10,
      atDoor11,
      atDoor12,
      atDoor13,
      atAnyDoor:
        atDoor1 ||
        atDoor2 ||
        atDoor3 ||
        atDoor4 ||
        atDoor5 ||
        atDoor6 ||
        atDoor7 ||
        atDoor8 ||
        atDoor9 ||
        atDoor10 ||
        atDoor11 ||
        atDoor12 ||
        atDoor13,
    };
  }, [playerPosition]);

  // Helper: Resolve the active room id from store.currentRoom / player.current_room / door proximity
  // "1" | "2" | "3" | "4" | "5" | "6" | "7"
  const resolveRoomId = useCallback(():
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7" => {
    const store = useAppStore.getState();
    const cr: any = store.currentRoom;

    let id: any = cr;
    if (cr && typeof cr === "object") {
      id = cr.room_id ?? cr.id ?? cr.current_room ?? null;
    }
    if (id == null) id = store.player?.current_room ?? null;

    if (id == null) {
      const d = isAtDoorPosition();
      if (d.atDoor3 || d.atDoor4) return "2";
      if (d.atDoor5 || d.atDoor6) return "3";
      if (d.atDoor7) return "4";
      if (d.atDoor8 || d.atDoor9) return "5";
      if (d.atDoor10 || d.atDoor11) return "6";
      if (d.atDoor12 || d.atDoor13) return "7";

      return "1";
    }

    const s = String(id);
    if (s === "2") return "2";
    if (s === "3") return "3";
    if (s === "4") return "4";
    if (s === "5") return "5";
    if (s === "6") return "6";
    if (s === "7") return "7";
    return "1";
  }, [isAtDoorPosition]);

  const getActiveRoomId = useCallback(():
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7" => {
    const cr = currentRoom?.toString?.();
    if (
      cr === "1" ||
      cr === "2" ||
      cr === "3" ||
      cr === "4" ||
      cr === "5" ||
      cr === "6" ||
      cr === "7"
    )
      return cr as "1" | "2" | "3" | "4" | "5" | "6" | "7";
    const d = isAtDoorPosition();
    if (d.atDoor3 || d.atDoor4) return "2";
    if (d.atDoor5 || d.atDoor6) return "3";
    if (d.atDoor7) return "4";
    if (d.atDoor8 || d.atDoor9) return "5";
    if (d.atDoor10 || d.atDoor11) return "6";
    if (d.atDoor12 || d.atDoor13) return "7";
    return "1";
  }, [currentRoom, isAtDoorPosition]);

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ENTER a door with E (unchanged)
      if (event.key.toLowerCase() === "e" && !isLoading) {
        const doorCheck = isAtDoorPosition();

        if (!doorCheck.atAnyDoor) {
          console.log("❌ Not at door position. Current:", {
            x: Math.round(playerPosition.x),
            z: Math.round(playerPosition.z),
          });
          console.log("Door 1: X=370-374, Z=305-308");
          console.log("Door 2: X=382-387, Z=324-328");
          console.log("Door 3: X=350-360, Z=290-300");
          console.log("Door 4: X=335-345, Z=290-300");
          return;
        }

        setEPressed(true);

        // Determine door id by position
        let doorId = "1";
        if (doorCheck.atDoor2) doorId = "2";
        else if (doorCheck.atDoor3) doorId = "3";
        else if (doorCheck.atDoor4) doorId = "4";
        else if (doorCheck.atDoor5) doorId = "5";
        else if (doorCheck.atDoor6) doorId = "6";
        else if (doorCheck.atDoor7) doorId = "7";
        else if (doorCheck.atDoor8) doorId = "8";
        else if (doorCheck.atDoor9) doorId = "9";
        else if (doorCheck.atDoor10) doorId = "10";
        else if (doorCheck.atDoor11) doorId = "11";
        else if (doorCheck.atDoor12) doorId = "12";
        else if (doorCheck.atDoor13) doorId = "13";

        enterDoor(doorId)
          .then((result) => {
            if (result.success) {
              console.log(`Door ${doorId} opened successfully...`);

              // Map door -> room
              const targetRoomId =
                doorId === "3" || doorId === "4"
                  ? "2"
                  : doorId === "5" || doorId === "6"
                  ? "3"
                  : doorId === "7"
                  ? "4"
                  : doorId === "8" || doorId === "9"
                  ? "5"
                  : doorId === "10" || doorId === "11"
                  ? "6"
                  : doorId === "12" || doorId === "13"
                  ? "7"
                  : "1";

              if (targetRoomId === "1") {
                setDoorOpened(true);
                setTimeout(() => setEntityCubeVisible(true), 1000);
              } else if (targetRoomId === "2") {
                setDoor2Opened(true);
                setTimeout(() => setEntityCube2Visible(true), 1000);
              } else if (targetRoomId === "3") {
                setDoor3Opened(true);
                setTimeout(() => setEntityCube3Visible(true), 1000);
              } else if (targetRoomId === "4") {
                setDoor4Opened(true);
                setTimeout(() => setEntityCube4Visible(true), 1000);
              } else if (targetRoomId === "5") {
                setDoor5Opened(true);
                setTimeout(() => setEntityCube5Visible(true), 1000);
              } else if (targetRoomId === "6") {
                setDoor6Opened(true);
                setTimeout(() => setEntityCube6Visible(true), 1000);
              } else if (targetRoomId === "7") {
                setDoor7Opened(true);
                setTimeout(() => setEntityCube7Visible(true), 1000);
              }

              setShardPanelEnabled(false); // shard stays disabled until kill
              setExitPanelEnabled(false); // exit stays disabled until shard is collected
              setShootPanelEnabled(true); // (ensure F panel is enabled on entry)
            } else {
              console.error("Failed to open door:", result.error);
            }
          })
          .catch((error) => console.error("Door opening error:", error));

        setTimeout(() => setEPressed(false), 1000);
        setTimeout(() => {
          refetchGameData();
        }, 1200);
      }
      if (event.key.toLowerCase() === "b") {
        setBPressed(true);
        const gameState = useAppStore.getState();

        // Use the player's current room from game data

        if (gameState.player && gameState.currentRoom) {
          console.log(`🏠 End the game`);
        }

        endGame()
          .then((result) => {
            if (result.success) {
              console.log(`Ended game successfully`);
            } else {
              console.error("Failed to exit door:", result.error);
            }
          })
          .catch((error) => {
            console.error("Door exit error:", error);
          });

        // Reset after a short delay
        setTimeout(() => setBPressed(false), 1000);
      }
      // SHOOT with F — FIXED to use currentRoom (not door proximity)
      // Handle F key press for shooting (use currentRoom from GraphQL/store)
      // Handle F key press for shooting (normalize room id)
      if (event.key.toLowerCase() === "f") {
        if (!shootPanelEnabled) return; // 🚫 ignore when panel is disabled
        if (!aimingAtEntity) return; // ✅ only allow when crosshair is on the cube

        setFPressed(true);

        const store = useAppStore.getState();
        const targetRoomId = resolveRoomId(); // "1" | "2"
        // ...

        // Only alive entities in that room
        const targets = store.entities.filter(
          (e) => e.room_id.toString() === targetRoomId && e.is_alive
        );
        if (targets.length === 0) {
          console.warn(`No alive entity found in room ${targetRoomId}`);
          setTimeout(() => setFPressed(false), 200);
          return;
        }

        const entityId = targets[0].entity_id.toString();
        console.log(`Attacking entity ${entityId} in room ${targetRoomId}`);

        attackEntity(entityId)
          .then((result) => {
            if (result.success) {
              // After a short delay, check if the entity died and hide cube
              setTimeout(() => {
                const updated = useAppStore
                  .getState()
                  .entities.filter(
                    (e) => e.room_id.toString() === targetRoomId
                  );
                const dead =
                  updated.length === 0 ||
                  !updated[0].is_alive ||
                  Number(updated[0].health) <= 0;
                if (dead) {
                  if (targetRoomId === "1") setEntityCubeVisible(false);
                  if (targetRoomId === "2") setEntityCube2Visible(false);
                  if (targetRoomId === "3") setEntityCube3Visible(false); // NEW
                  setShootPanelEnabled(false);
                  const shardAlready =
                    targetRoomId === "1"
                      ? room1ShardCollected
                      : targetRoomId === "2"
                      ? room2ShardCollected
                      : room3ShardCollected; // NEW
                  if (!shardAlready) setShardPanelEnabled(true);
                }
              }, 1000);

              // pull fresh room state so currentRoom.cleared can flip true
              setTimeout(() => refetchGameData(), 600);
            } else {
              console.error("❌ Failed to attack entity:", result.error);
            }
          })
          .catch((error) => console.error("❌ attack entity error:", error));

        setTimeout(() => setFPressed(false), 200);
      }

      // COLLECT shard with X — FIXED to use currentRoom (not door proximity)
      // Handle X key press for shard collection (normalize room id)
      if (event.key.toLowerCase() === "x") {
        if (!shardPanelEnabled) return; // 🚫 ignore when panel is disabled
        setXPressed(true);

        const store = useAppStore.getState();
        const shardLocations = store.shardLocations ?? []; // ✅ add this

        const targetRoomId = resolveRoomId();

        const shard = shardLocations.filter(
          (s: any) => String(s.room_id) === targetRoomId
        );
        const shardId = shard[0]?.shard_id?.toString() || "";

        if (!shardId) {
          console.warn(`No shard found in room ${targetRoomId}`);
          setTimeout(() => setXPressed(false), 200);
          return;
        }

        collectShard(shardId).then((result) => {
          if (result.success) {
            console.log("✅ Shard collected");
            if (targetRoomId === "1") setRoom1ShardCollected(true);
            else if (targetRoomId === "2") setRoom2ShardCollected(true);
            else if (targetRoomId === "3") setRoom3ShardCollected(true);
            else if (targetRoomId === "4") setRoom4ShardCollected(true);
            else if (targetRoomId === "5") setRoom5ShardCollected(true);
            else if (targetRoomId === "6") setRoom6ShardCollected(true);
            else setRoom7ShardCollected(true);

            setExitPanelEnabled(true);
            setShardPanelEnabled(false);
            refetchGameData();
          }
        });

        setTimeout(() => setXPressed(false), 200);
        backgroundColor: xPressed;
      }

      // EXIT + open-and-keep-open via Q (unchanged logic, now works for both rooms)
      if (event.key.toLowerCase() === "q") {
        if (!exitPanelEnabled) return; // 🚫 ignore when panel is disabled
        setQPressed(true);

        const roomId = resolveRoomId(); // which room we're in
        // ...

        const allEntities = useAppStore.getState().entities;
        const roomEntities = allEntities.filter(
          (e) => e.room_id.toString() === roomId
        );
        const entityDead =
          roomEntities.length === 0 ||
          roomEntities.every((e) => !e.is_alive || Number(e.health) <= 0);

        const shardCollected =
          roomId === "1"
            ? room1ShardCollected
            : roomId === "2"
            ? room2ShardCollected
            : roomId === "3"
            ? room3ShardCollected
            : roomId === "4"
            ? room4ShardCollected
            : roomId === "5"
            ? room5ShardCollected
            : roomId === "6"
            ? room6ShardCollected
            : room7ShardCollected;

        if (!entityDead || !shardCollected) {
          console.log(
            `❌ Room ${roomId}: kill entity and collect shard first, then press Q.`
          );
          setTimeout(() => setQPressed(false), 1000);
          return;
        }

        // 🔄 make sure store.currentRoom.cleared === true (required by useOpenDoor)
        refetchGameData().then(() => {
          const cleared = useAppStore.getState().currentRoom?.cleared === true;
          if (!cleared) {
            // one quick retry for indexer lag
            setTimeout(() => {
              refetchGameData().then(() => {
                const cleared2 =
                  useAppStore.getState().currentRoom?.cleared === true;
                if (!cleared2) {
                  console.warn(
                    `Cannot exit Room ${roomId} yet – room not marked cleared by chain.`
                  );
                  setTimeout(() => setQPressed(false), 1000);
                  return;
                }

                if (roomId === "1") setDoorOpened(true);
                else if (roomId === "2") setDoor2Opened(true);
                else if (roomId === "3") setDoor3Opened(true);
                else setDoor4Opened(true);

                // choose door id for exit (1→1/2, 2→3/4, 3→5/6, 4→7, 5→8/9)
                const here = isAtDoorPosition();
                let doorIdForExit: string = roomId;

                if (roomId === "1") {
                  if (here.atDoor1) doorIdForExit = "1";
                  else if (here.atDoor2) doorIdForExit = "2";
                  else doorIdForExit = "1";
                } else if (roomId === "2") {
                  if (here.atDoor3) doorIdForExit = "3";
                  else if (here.atDoor4) doorIdForExit = "4";
                  else doorIdForExit = "3";
                } else if (roomId === "3") {
                  if (here.atDoor5) doorIdForExit = "5";
                  else if (here.atDoor6) doorIdForExit = "6";
                  else doorIdForExit = "5";
                } else if (roomId === "4") {
                  doorIdForExit = "7"; // only one door
                } else if (roomId === "5") {
                  if (here.atDoor8) doorIdForExit = "8";
                  else if (here.atDoor9) doorIdForExit = "9";
                  else doorIdForExit = "8";
                } else if (roomId === "6") {
                  if (here.atDoor10) doorIdForExit = "10";
                  else if (here.atDoor11) doorIdForExit = "11";
                  else doorIdForExit = "10";
                } else if (roomId === "7") {
                  if (here.atDoor12) doorIdForExit = "12";
                  else if (here.atDoor13) doorIdForExit = "13";
                  else doorIdForExit = "12";
                }

                setExitPanelEnabled(false); // hide exit panel once used

                exitDoor(doorIdForExit)
                  .then((res) => {
                    if (res?.success) {
                      refreshRoomAfterExit(roomId); // ✅ pull fresh HUD state
                    }
                  })
                  .catch((error) =>
                    console.error("❌ Door exit error:", error)
                  );

                setTimeout(() => setQPressed(false), 1000);
              });
            }, 700);
            return;
          }

          if (roomId === "1") setDoorOpened(true);
          else if (roomId === "2") setDoor2Opened(true);
          else if (roomId === "3") setDoor3Opened(true);
          else if (roomId === "4") setDoor4Opened(true);
          else if (roomId === "5") setDoor5Opened(true);
          else if (roomId === "6") setDoor6Opened(true);
          else setDoor7Opened(true);

          // choose door id for exit (1→1/2, 2→3/4, 3→5/6, 4→7)
          const here = isAtDoorPosition();
          let doorIdForExit: string = roomId;

          if (roomId === "1") {
            if (here.atDoor1) doorIdForExit = "1";
            else if (here.atDoor2) doorIdForExit = "2";
            else doorIdForExit = "1";
          } else if (roomId === "2") {
            if (here.atDoor3) doorIdForExit = "3";
            else if (here.atDoor4) doorIdForExit = "4";
            else doorIdForExit = "3";
          } else if (roomId === "3") {
            if (here.atDoor5) doorIdForExit = "5";
            else if (here.atDoor6) doorIdForExit = "6";
            else doorIdForExit = "5";
          } else if (roomId === "4") {
            doorIdForExit = "7"; // only one door
          } else if (roomId === "5") {
            if (here.atDoor8) doorIdForExit = "8";
            else if (here.atDoor9) doorIdForExit = "9";
            else doorIdForExit = "8";
          } else if (roomId === "6") {
            if (here.atDoor10) doorIdForExit = "10";
            else if (here.atDoor11) doorIdForExit = "11";
            else doorIdForExit = "10";
          } else if (roomId === "7") {
            if (here.atDoor12) doorIdForExit = "12";
            else if (here.atDoor13) doorIdForExit = "13";
            else doorIdForExit = "12";
          }

          setExitPanelEnabled(false);

          exitDoor(doorIdForExit)
            .then((res) => {
              if (res?.success) {
                refreshRoomAfterExit(roomId); // keep your poller
              }
            })
            .catch((error) => console.error("❌ Door exit error:", error));

          setTimeout(() => setQPressed(false), 1000);
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isLoading,
    enterDoor,
    exitDoor,
    attackEntity,
    collectShard,
    isAtDoorPosition,
    getActiveRoomId,
    resolveRoomId,
    room1ShardCollected,
    room2ShardCollected,
    room3ShardCollected,
    room4ShardCollected, // add
    room5ShardCollected, // add
    room6ShardCollected, // add
    room7ShardCollected, // add
    playerPosition,
    shootPanelEnabled,
    shardPanelEnabled,
    exitPanelEnabled,
    refetchGameData,
    exitPanelEnabled,
    refetchGameData,
    aimingAtEntity,
  ]);

  // Keep BOTH rooms' doors open for the entire session once opened via Q.
  useEffect(() => {
    // Intentionally no-op (no auto-close)
  }, [playerPosition, isAtDoorPosition, doorOpened, door2Opened]);
  // After exiting a room, poll a few times so HUD (Current Room) updates
  const refreshRoomAfterExit = useCallback(
    async (prevRoomId: string) => {
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 500));
        await refetchGameData();
        const st = useAppStore.getState();
        const cr =
          st.currentRoom?.toString?.() ??
          st.player?.current_room?.toString?.() ??
          "";
        if (cr && cr !== prevRoomId) break; // room changed -> stop polling
      }
    },
    [refetchGameData]
  );

  // Pass-through to store
  const handlePositionUpdate = useCallback(
    (position: Vector3): void => {
      updatePosition(position);
    },
    [updatePosition]
  );
  const handleRotationUpdate = useCallback(
    (rotation: number): void => {
      updateRotation(rotation);
    },
    [updateRotation]
  );

  // Gun hit handling (unchanged)
  const handleGunShoot = useCallback(
    async (hit: THREE.Intersection, cameraPosition: Vector3): Promise<void> => {
      const hitObject = hit.object;
      const hitPoint = hit.point;
      const hitNormal = hit.face?.normal;

      if (hitObject.userData?.isEntity) {
        const bloodId = Date.now() + Math.random();
        setBloodEffects((prev: BloodEffectType[]) => [
          ...prev,
          { id: bloodId, position: hitPoint.clone() },
        ]);
      } else if (hitNormal) {
        const holeId = Date.now() + Math.random();
        const offsetPosition = hitPoint
          .clone()
          .add(hitNormal.clone().multiplyScalar(0.01));
        setBulletHoles((prev: BulletHoleType[]) => [
          ...prev,
          {
            id: holeId,
            position: offsetPosition,
            normal: hitNormal.clone(),
            cameraPosition: cameraPosition.clone(),
          },
        ]);
      }
    },
    []
  );

  // Remove effects helpers
  const removeBloodEffect = useCallback((id: number): void => {
    setBloodEffects((prev) => prev.filter((b) => b.id !== id));
  }, []);
  const removeBulletHole = useCallback((id: number): void => {
    setBulletHoles((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // Render gate
  const isConnected = connectionStatus === "connected";
  const hasPlayer = player !== null;
  const isGameActive = gamePhase === GamePhase.ACTIVE;
  const shouldShowGame =
    isConnected && hasPlayer && isGameActive && gameStarted;

  if (!shouldShowGame) return <MainMenu />;

  const activeRoomId = getActiveRoomId();

  // For UI panels
  const doorCheck = isAtDoorPosition();

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Silent audio manager - no UI */}
      <AudioManager />

      {/* Player HUD */}
      <PlayerHUD />

      {/* Transaction Popup */}
      <TransactionPopup
        isVisible={showTransactionPopup}
        isLoading={isProcessingTransaction}
        error={transactionError}
        onClose={closeTransactionPopup}
      />

      {/* Door Entry Panel */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 3000,
          backgroundColor: ePressed
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(0, 0, 0, 0.9)",
          border: `2px solid ${doorCheck.atAnyDoor ? "#E1CF48" : "#666"}`,
          borderRadius: "8px",
          padding: "20px",
          color: ePressed ? "black" : "white",
          fontFamily: "monospace",
          minWidth: "300px",
          textAlign: "center",
          opacity: doorCheck.atAnyDoor ? 1 : 0.5,
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: doorCheck.atAnyDoor
              ? ePressed
                ? "black"
                : "#E1CF48"
              : ePressed
              ? "black"
              : "#666",
          }}
        >
          {doorCheck.atAnyDoor
            ? "Press E to Enter Door"
            : "Move to Door Location to Enter"}
        </div>
        {doorCheck.atAnyDoor && (
          <div style={{ marginTop: "8px", fontSize: "14px", color: "#E1CF48" }}>
            {doorCheck.atDoor1 && "Door 1 (Room 1)"}
            {doorCheck.atDoor2 && "Door 2 (Room 1)"}
            {doorCheck.atDoor3 && "Door 3 (Room 2)"}
            {doorCheck.atDoor4 && "Door 4 (Room 2)"}
            {doorCheck.atDoor5 && "Door 5 (Room 3)"}
            {doorCheck.atDoor6 && "Door 6 (Room 3)"}
            {doorCheck.atDoor7 && "Door 7 (Room 4)"}
            {doorCheck.atDoor8 && "Door 8 (Room 5)"}
            {doorCheck.atDoor9 && "Door 9 (Room 5)"}
            {doorCheck.atDoor10 && "Door 10 (Room 6)"}
            {doorCheck.atDoor11 && "Door 11 (Room 6)"}
            {doorCheck.atDoor12 && "Door 12 (Room 7)"}
            {doorCheck.atDoor13 && "Door 13 (Room 7)"}
          </div>
        )}
        {isLoading && (
          <div
            style={{ marginTop: "10px", fontSize: "14px", color: "#E1CF48" }}
          >
            Loading...
          </div>
        )}
        {!doorCheck.atAnyDoor && (
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#888" }}>
            Position: X:{Math.round(playerPosition.x)} Z:
            {Math.round(playerPosition.z)}
            <br />
            Available Doors:
            <br />
            Door 1: X=370-374, Z=305-308 (Room 1)
            <br />
            Door 2: X=382-387, Z=324-328 (Room 1)
            <br />
            Door 3: X=350-360, Z=290-300 (Room 2)
            <br />
            Door 4: X=335-345, Z=290-300 (Room 2)
            <br />
            Door 5: X=363-365, Z=398-405 (Room 3)
            <br />
            Door 6: X=363-364, Z=367-370 (Room 3)
            <br />
            Door 7: X=323-324, Z=358-359 (Room 4)
            <br />
            Door 8: X=303-304, Z=349-350 (Room 5)
            <br />
            Door 9: X=288-289, Z=377-378 (Room 5)
            <br />
            Door 10: X=278-282, Z=347-349
            <br />
            Door 11: X=269-274, Z=320-322
            <br />
            Door 12: X=275-279, Z=281-283
            <br />
            Door 13: X=276-280, Z=308-311
          </div>
        )}
      </div>

      {/* Shooting Panel */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 3000,
          backgroundColor: fPressed
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(0, 0, 0, 0.9)",
          border: shootPanelEnabled ? "2px solid #ff4444" : "2px solid #555",
          borderRadius: "8px",
          padding: "20px",
          color: fPressed ? "black" : "white",
          fontFamily: "monospace",
          minWidth: "300px",
          textAlign: "center",
          opacity: shootPanelEnabled ? 1 : 0.45,
          pointerEvents: "none", // purely visual panel; avoid accidental hovers/clicks
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
          Press F to Shoot Enemy
        </div>
        {doorCheck.atAnyDoor && (
          <div style={{ marginTop: "8px", fontSize: "14px", color: "#ff6666" }}>
            {(doorCheck.atDoor1 || doorCheck.atDoor2) && "Targeting Room 1"}
            {(doorCheck.atDoor3 || doorCheck.atDoor4) && "Targeting Room 2"}
            {(doorCheck.atDoor5 || doorCheck.atDoor6) && "Targeting Room 3"}
            {doorCheck.atDoor7 && "Targeting Room 4"}
            {(doorCheck.atDoor8 || doorCheck.atDoor9) && "Targeting Room 5"}
            {(doorCheck.atDoor10 || doorCheck.atDoor11) && "Targeting Room 6"}
            {(doorCheck.atDoor12 || doorCheck.atDoor13) && "Targeting Room 7"}
          </div>
        )}
      </div>

      {/* Shard Panel */}
      <div
        style={{
          position: "fixed",
          bottom: "120px",
          right: "20px",
          zIndex: 3000,
          backgroundColor: xPressed
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(0, 0, 0, 0.9)",
          border: shardPanelEnabled ? "2px solid #44ff44" : "2px solid #555",
          borderRadius: "8px",
          padding: "20px",
          color: xPressed ? "black" : "white",
          fontFamily: "monospace",
          minWidth: "300px",
          textAlign: "center",
          opacity: shardPanelEnabled ? 1 : 0.45,
          pointerEvents: "none", // UI-only panel
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
          Press X to Collect Shard
        </div>
        {doorCheck.atAnyDoor && (
          <div style={{ marginTop: "8px", fontSize: "14px", color: "#66ff66" }}>
            {(doorCheck.atDoor1 || doorCheck.atDoor2) && "Targeting Room 1"}
            {(doorCheck.atDoor3 || doorCheck.atDoor4) && "Targeting Room 2"}
          </div>
        )}
      </div>
       {<div
        style={{
          position: "fixed",
          bottom: "320px",
          right: "20px",
          zIndex: 3000,
          backgroundColor: bPressed
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(0, 0, 0, 0.9)",
          border: "2px solid #44ff44",
          borderRadius: "8px",
          padding: "20px",
          color: bPressed ? "black" : "white",
          fontFamily: "monospace",
          minWidth: "300px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
          Press B to End Game
        </div>
         
      </div>}

      {/* Exit Panel */}
      <div
        style={{
          position: "fixed",
          bottom: "220px",
          right: "20px",
          zIndex: 3000,
          backgroundColor: qPressed
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(0, 0, 0, 0.9)",
          border: exitPanelEnabled ? "2px solid #ff8844" : "2px solid #555",
          borderRadius: "8px",
          padding: "20px",
          color: qPressed ? "black" : "white",
          fontFamily: "monospace",
          minWidth: "300px",
          textAlign: "center",
          opacity: exitPanelEnabled ? 1 : 0.45,
          pointerEvents: "none", // purely visual panel
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
          Press Q to Exit Game
        </div>
        {doorCheck.atAnyDoor && (
          <div style={{ marginTop: "8px", fontSize: "14px", color: "#ff8866" }}>
            {(doorCheck.atDoor1 || doorCheck.atDoor2) && "Exiting Room 1"}
            {(doorCheck.atDoor3 || doorCheck.atDoor4) && "Exiting Room 2"}
            {(doorCheck.atDoor5 || doorCheck.atDoor6) && "Exiting Room 3"}
            {(doorCheck.atDoor8 || doorCheck.atDoor9) && "Exiting Room 5"}
            {(doorCheck.atDoor10 || doorCheck.atDoor11) && "Exiting Room 6"}
            {(doorCheck.atDoor12 || doorCheck.atDoor13) && "Exiting Room 7"}
          </div>
        )}
      </div>

      {/* On-screen prompts */}
      {showShootPrompt && (
        <div
          key={promptKey}
          style={{
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5000,
            backgroundColor: "rgba(255, 68, 68, 0.9)",
            border: "2px solid #ff6666",
            borderRadius: "8px",
            padding: "15px 25px",
            color: "white",
            fontFamily: "monospace",
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
            animation: "fadeOut 1s ease-out forwards",
            boxShadow: "0 4px 12px rgba(255, 68, 68, 0.4)",
          }}
        >
          ENEMY SHOT!
        </div>
      )}
      {showShardPrompt && (
        <div
          key={shardPromptKey}
          style={{
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5000,
            backgroundColor: "rgba(68, 255, 68, 0.9)",
            border: "2px solid #66ff66",
            borderRadius: "8px",
            padding: "15px 25px",
            color: "white",
            fontFamily: "monospace",
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
            animation: "fadeOut 1s ease-out forwards",
            boxShadow: "0 4px 12px rgba(68, 255, 68, 0.4)",
          }}
        >
          SHARD COLLECTED!
        </div>
      )}

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateX(-50%) translateY(0px); }
          70% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>

      {/* New lightweight UI overlays (purely visual) */}
      <BlockroomsCard />
      <HUD />

      <GrainVignetteOverlay />
      <DarknessMask />
      <Flashlight />

      {/* Crosshair */}
      {showCrosshair && <Crosshair />}

      {/* Map Tracker (optional) */}
      {/* {showMapTracker && (
        <MapTracker
          playerPosition={playerPosition}
          playerRotation={playerRotation}
          mapScale={30}
          size={250}
        />
      )} */}

      <Canvas
        camera={{
          fov: 75,
          position: [400, 1.5, 400],
          rotation: [0, 0, 0],
          near: 0.1,
          far: 1000,
        }}
        onCreated={({ camera }) => {
          camera.rotation.set(0, 0, 0);
          camera.lookAt(400, 1.5, 399);
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} color="#fff8dc" />
        <directionalLight
          position={[420, 20, 420]}
          intensity={0.8}
          color="#fff8dc"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <directionalLight
          position={[380, 15, 380]}
          intensity={0.4}
          color="#f4e4bc"
        />
        <pointLight
          position={[400, 10, 400]}
          intensity={0.5}
          color="#fff8dc"
          distance={100}
        />

        <FloorGrid minorStep={1} highlightStep={20} y={0.01} />

        {/* Room 1 Doors */}
        <DoorWall
          position={[372, 0, 306.5]}
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={doorOpened}
        />
        <DoorWall
          position={[384.5, 0, 326]}
          rotation={[0, 0, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={doorOpened}
        />

        {/* Room 2 Doors */}
        <DoorWall
          position={[355, 0, 293.5]}
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door2Opened}
        />
        <DoorWall
          position={[338, 0, 293]}
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door2Opened}
        />

        {/* Room 3 Doors */}
        <DoorWall
          position={[368, 0, 400]} // center of Door 5 range
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door3Opened}
        />
        <DoorWall
          position={[363.5, 0, 368.5]} // center of Door 6 range
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door3Opened}
        />
        {/* Room 4 Door */}
        <DoorWall
          position={[323.5, 0, 358.5]} // center of Door 7 range
          rotation={[0, 0, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door4Opened}
        />
        {/* Room 5 Doors */}
        <DoorWall
          position={[303.5, 0, 349.5]}
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door5Opened}
        />
        <DoorWall
          position={[288.5, 0, 377.5]}
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door5Opened}
        />

        {/* Room 6 Doors */}
        <DoorWall
          position={[281.5, 0, 347.5]} // center of Door 10 range
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door6Opened}
        />
        <DoorWall
          position={[269.5, 0, 320.5]} // center of Door 11 range
          rotation={[0, Math.PI / 2, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door6Opened}
        />

        {/* Room 7 Doors */}
        <DoorWall
          position={[278.5, 0, 281.5]} // center of Door 12 range
          rotation={[0, 0, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door7Opened}
        />
        <DoorWall
          position={[278.5, 0, 311.5]} // center of Door 13 range
          rotation={[0, 0, 0]}
          doorOpening={[0, 1, 0.5]}
          doorOpened={door7Opened}
        />

        <AimProbe onUpdate={setAimingAtEntity} />

        {/* Pointer lock */}
        <PointerLockControls />

        {/* Controls */}
        <FirstPersonControls
          onPositionUpdate={handlePositionUpdate}
          onRotationUpdate={handleRotationUpdate}
        />

        {/* Level */}
        <Model />
        <Table position={[392, 0, 392]} />

        {/* Gun */}
        {showGun && <Gun isVisible={showGun} onShoot={handleGunShoot} />}

        {/* Blood effects */}
        {bloodEffects.map((effect: BloodEffectType) => (
          <BloodEffect
            key={effect.id}
            position={effect.position}
            onComplete={() => removeBloodEffect(effect.id)}
          />
        ))}

        {/* Bullet holes */}
        {/* {bulletHoles.map((hole: BulletHoleType[]) => null) /* silence TS types in map below */}
        {/* {bulletHoles.map((hole: any) => (
          <BulletHole
            key={hole.id}
            position={hole.position}
            normal={hole.normal}
            cameraPosition={hole.cameraPosition}
            onComplete={() => removeBulletHole(hole.id)}
          />
        ))} */}

        {/* Room 1 Entity Cube */}
        <EntityCube
          position={cubePosition}
          isVisible={entityCubeVisible}
          onSpawn={() => console.log("🎯 Room 1 Entity cube spawned!")}
          entityId="door_entity_1"
        />

        <ShardCluster
          position={[cubePosition[0], 1.6, cubePosition[2]]}
          visible={
            shardPanelEnabled && !room1ShardCollected && resolveRoomId() === "1"
          }
        />

        {/* Room 2 Entity Cube */}
        <EntityCube
          position={cube2Position}
          isVisible={entityCube2Visible}
          onSpawn={() => console.log("🎯 Room 2 Entity cube spawned!")}
          entityId="door_entity_2"
        />

        <ShardCluster
          position={[cube2Position[0], 1.6, cube2Position[2]]}
          visible={
            shardPanelEnabled && !room2ShardCollected && resolveRoomId() === "2"
          }
        />

        {/* Room 3 Entity Cube */}
        <EntityCube
          position={cube3Position}
          isVisible={entityCube3Visible}
          onSpawn={() => console.log("🎯 Room 3 Entity cube spawned!")}
          entityId="door_entity_3"
        />

        <ShardCluster
          position={[cube3Position[0], 1.6, cube3Position[2]]}
          visible={
            shardPanelEnabled && !room3ShardCollected && resolveRoomId() === "3"
          }
        />

        {/* Room 4 Entity Cube */}
        <EntityCube
          position={cube4Position}
          isVisible={entityCube4Visible}
          onSpawn={() => console.log("🎯 Room 4 Entity cube spawned!")}
          entityId="door_entity_4"
        />

        <ShardCluster
          position={[cube4Position[0], 1.6, cube4Position[2]]}
          visible={
            shardPanelEnabled && !room4ShardCollected && resolveRoomId() === "4"
          }
        />

        {/* Room 5 Entity Cube */}
        <EntityCube
          position={cube5Position}
          isVisible={entityCube5Visible}
          onSpawn={() => console.log("🎯 Room 5 Entity cube spawned!")}
          entityId="door_entity_5"
        />

        <ShardCluster
          position={[cube5Position[0], 1.6, cube5Position[2]]}
          visible={
            shardPanelEnabled && !room5ShardCollected && resolveRoomId() === "5"
          }
        />

        {/* Room 6 Entity Cube */}
        <EntityCube
          position={cube6Position}
          isVisible={entityCube6Visible}
          onSpawn={() => console.log("🎯 Room 6 Entity cube spawned!")}
          entityId="door_entity_6"
        />
        <ShardCluster
          position={[cube6Position[0], 1.6, cube6Position[2]]}
          visible={
            shardPanelEnabled && !room6ShardCollected && resolveRoomId() === "6"
          }
        />

        {/* Room 7 Entity Cube */}
        <EntityCube
          position={cube7Position}
          isVisible={entityCube7Visible}
          onSpawn={() => console.log("🎯 Room 7 Entity cube spawned!")}
          entityId="door_entity_7"
        />

        <ShardCluster
          position={[cube7Position[0], 1.6, cube7Position[2]]}
          visible={
            shardPanelEnabled && !room7ShardCollected && resolveRoomId() === "7"
          }
        />
      </Canvas>
    </div>
  );
};

export default App;
