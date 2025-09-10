import { useEffect, useRef } from 'react';
import useAppStore from '../../zustand/store';
import { useGetNearbyDoors } from '../../dojo/hooks/fetchNearbyDoors';

// Define door locations mapping contract coordinates to frontend coordinates
const DOOR_LOCATIONS = [
  {
    id: "door_23_20",
    contractPos: { x: 23, y: 20 },
    frontendBounds: {
      x: { min: 370, max: 376 },
      z: { min: 305, max: 308 }
    }
  },
  {
    id: "door_24_20", 
    contractPos: { x: 24, y: 20 },
    frontendBounds: {
      x: { min: 381, max: 388 },
      z: { min: 315, max: 321 }
    }
  }
];

export const DoorDetector: React.FC = () => {
  const { position,  } = useAppStore();
  const { getNearbyDoors } = useGetNearbyDoors();
  const lastCheckedPosition = useRef<{ x: number; z: number } | null>(null);
  const doorCheckCooldown = useRef<boolean>(false);

  useEffect(() => {
   
    const currentPos = { x: Math.round(position.x), z: Math.round(position.z) };
    
    // Check if position changed significantly (at least 1 unit)
    if (lastCheckedPosition.current) {
      const deltaX = Math.abs(currentPos.x - lastCheckedPosition.current.x);
      const deltaZ = Math.abs(currentPos.z - lastCheckedPosition.current.z);
      if (deltaX < 1 && deltaZ < 1) return;
    }

    lastCheckedPosition.current = currentPos;

    // Check if player is at any door location
    const nearbyDoor = DOOR_LOCATIONS.find(door => {
      return currentPos.x >= door.frontendBounds.x.min &&
             currentPos.x <= door.frontendBounds.x.max &&
             currentPos.z >= door.frontendBounds.z.min &&
             currentPos.z <= door.frontendBounds.z.max;
    });

    if (nearbyDoor) {
      console.log(`🚪 Player at door location: ${nearbyDoor.id}`, {
        playerPos: currentPos,
        doorBounds: nearbyDoor.frontendBounds
      });

      // Set cooldown to prevent spam
      doorCheckCooldown.current = true;
      
      // Fetch nearby doors and show popup
      getNearbyDoors().then(() => {
        
      });

      // Reset cooldown after 2 seconds
      setTimeout(() => {
        doorCheckCooldown.current = false;
      }, 2000);
    }
  }, [position.x, position.z,  getNearbyDoors]);

  return null; // This is a logic-only component
};