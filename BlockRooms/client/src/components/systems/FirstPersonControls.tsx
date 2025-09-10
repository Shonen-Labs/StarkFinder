import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import * as THREE from "three";
import { FirstPersonControlsProps, Keys } from "../../types/game";
import useAppStore from "../../zustand/store";

export function FirstPersonControls({
  onPositionUpdate, // Keep for backward compatibility
  onRotationUpdate, // Keep for backward compatibility
}: FirstPersonControlsProps): null {
  const { camera, scene } = useThree();
  
  // Get player state and actions from store
  const { 
    position: playerPosition,
    rotation: playerRotation,
    updatePosition, 
    updateRotation,
    setMoving,
    setVelocity 
  } = useAppStore();
  
  const moveSpeed = 5;
  const playerRadius = 0.5; // Collision radius around player
  const baseHeight = 1.5; // Base camera height (eye level)
  const bobAmplitude = 0.08; // How much the camera bobs up and down
  const bobFrequency = 1; // How fast the bobbing occurs
  const bobTimeRef = useRef<number>(0); // Track time for bobbing animation
  const isMovingRef = useRef<boolean>(false); // Track if player is moving

  const keys = useRef<Keys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Sync camera position with store on mount and when store position changes
  useEffect(() => {
    camera.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
  }, [camera, playerPosition]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Check for collisions using raycasting
  const checkCollision = (newPosition: Vector3): boolean => {
    const raycaster = new THREE.Raycaster();
    const directions = [
      new Vector3(1, 0, 0), // right
      new Vector3(-1, 0, 0), // left
      new Vector3(0, 0, 1), // forward
      new Vector3(0, 0, -1), // backward
      new Vector3(0.707, 0, 0.707), // diagonal
      new Vector3(-0.707, 0, 0.707), // diagonal
      new Vector3(0.707, 0, -0.707), // diagonal
      new Vector3(-0.707, 0, -0.707), // diagonal
    ];

    // Check collision in multiple directions around the player
    for (const direction of directions) {
      raycaster.set(newPosition, direction);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Filter out non-solid objects (lights, cameras, etc.)
      const solidIntersects = intersects.filter(
        (intersect: THREE.Intersection) => {
          const object = intersect.object;
          // Check if object has geometry and is likely a wall/floor
          return (
            (object as THREE.Mesh).geometry &&
            (object as THREE.Mesh).material &&
            !(object as THREE.Light).isLight &&
            !(object as THREE.Camera).isCamera &&
            object.visible
          );
        }
      );

      if (
        solidIntersects.length > 0 &&
        solidIntersects[0].distance < playerRadius
      ) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  // Update camera position based on input with collision detection and running animation
  useFrame((state, delta: number) => {
    const velocity = new Vector3();
    const direction = new Vector3();

    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement horizontal
    direction.normalize();

    const right = new Vector3();
    right.crossVectors(direction, camera.up).normalize();

    if (keys.current.forward) velocity.add(direction);
    if (keys.current.backward) velocity.sub(direction);
    if (keys.current.right) velocity.add(right);
    if (keys.current.left) velocity.sub(right);

    // Check if player is moving
    const isMoving = velocity.length() > 0;
    isMovingRef.current = isMoving;
    
    // Update store with movement state
    setMoving(isMoving);

    if (isMoving) {
      velocity.normalize();
      velocity.multiplyScalar(moveSpeed * delta);
      
      // Update store with current velocity
      setVelocity({
        x: velocity.x,
        y: velocity.y,
        z: velocity.z
      });

      // Calculate new position
      const newPosition = camera.position.clone().add(velocity);

      // Check for collision before moving
      if (!checkCollision(newPosition)) {
        camera.position.copy(newPosition);
      } else {
        // Try moving in individual axes if diagonal movement is blocked
        const xMovement = new Vector3(velocity.x, 0, 0);
        const zMovement = new Vector3(0, 0, velocity.z);

        const xPosition = camera.position.clone().add(xMovement);
        const zPosition = camera.position.clone().add(zMovement);

        if (!checkCollision(xPosition)) {
          camera.position.add(xMovement);
        } else if (!checkCollision(zPosition)) {
          camera.position.add(zMovement);
        }
        // If both individual axes are blocked, don't move
      }
    } else {
      // Update store with zero velocity when not moving
      setVelocity({ x: 0, y: 0, z: 0 });
    }

    // Handle running animation (head bob)
    if (isMovingRef.current) {
      // Increment bob time when moving
      bobTimeRef.current += delta * bobFrequency;

      // Calculate bobbing offset using sine wave
      const bobOffset = Math.sin(bobTimeRef.current) * bobAmplitude;

      // Apply bobbing to camera Y position
      camera.position.y = baseHeight + bobOffset;
    } else {
      // When not moving, gradually return to base height
      const currentHeight = camera.position.y;
      const heightDiff = baseHeight - currentHeight;

      // Smooth interpolation back to base height
      if (Math.abs(heightDiff) > 0.001) {
        camera.position.y += heightDiff * delta * 5; // Smooth return
      } else {
        camera.position.y = baseHeight;
      }

      // Reset bob time when not moving
      bobTimeRef.current = 0;
    }

    // Update store with current position
    updatePosition({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });

    // Update store with current rotation
    const rotation = camera.rotation.y;
    updateRotation(rotation);

    // Call legacy callbacks for backward compatibility
    if (onPositionUpdate) {
      onPositionUpdate(camera.position.clone());
    }
    if (onRotationUpdate) {
      onRotationUpdate(rotation);
    }
  });

  return null;
}