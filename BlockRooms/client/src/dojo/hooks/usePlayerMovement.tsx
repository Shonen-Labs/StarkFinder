import { useEffect, useRef, useCallback, useState } from 'react';
import { Vector3 } from 'three';
import useAppStore, { GamePhase } from "../../zustand/store";
import { useMovePlayer } from './useMovePlayer';

interface UsePlayerMovementReturn {
  showTransactionPopup: boolean;
  transactionError: string | null;
  isProcessingTransaction: boolean;
  closeTransactionPopup: () => void;
}

export const usePlayerMovement = (): UsePlayerMovementReturn => {
  const { position, updatePosition } = useAppStore();
  const { movePlayer, isLoading, error } = useMovePlayer();
  
  
  const lastVerifiedPosition = useRef<{ x: number; z: number }>({ x: 400, z: 400 });
  const isProcessingBoundary = useRef<boolean>(false);
  
  
  const [showTransactionPopup, setShowTransactionPopup] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  
  const GENESIS_X = 400;
  const GENESIS_Z = 400;
  const GRID_SIZE = 20;

  
  const getGridCell = useCallback((coord: number, genesis: number): number => {
    return Math.floor((coord - genesis) / GRID_SIZE);
  }, []);

  
  const getGridBoundary = useCallback((gridCell: number, genesis: number): number => {
    return genesis + (gridCell * GRID_SIZE);
  }, []);

  // Convert delta to 0-2 range for contract
  const convertDeltaToContractFormat = useCallback((delta: number): number => {
    if (delta < 0) return 0;  // -1 becomes 0
    if (delta > 0) return 2;  // +1 becomes 2
    return 1;                 // 0 stays 1
  }, []);

  
  const checkBoundaryCrossing = useCallback((
    currentPos: { x: number; z: number },
    lastPos: { x: number; z: number }
  ): { crossed: boolean; deltaX: number; deltaY: number; contractDeltaX: number; contractDeltaY: number } => {
    const currentGridX = getGridCell(currentPos.x, GENESIS_X);
    const currentGridZ = getGridCell(currentPos.z, GENESIS_Z);
    const lastGridX = getGridCell(lastPos.x, GENESIS_X);
    const lastGridZ = getGridCell(lastPos.z, GENESIS_Z);

    const crossedX = currentGridX !== lastGridX;
    const crossedZ = currentGridZ !== lastGridZ;

    if (crossedX || crossedZ) {
      
      const deltaX = currentGridX - lastGridX;
      const deltaY = currentGridZ - lastGridZ; 
      
      // Convert to contract format (0-2)
      const contractDeltaX = convertDeltaToContractFormat(deltaX);
      const contractDeltaY = convertDeltaToContractFormat(deltaY);
      
      return { 
        crossed: true, 
        deltaX, 
        deltaY,
        contractDeltaX,
        contractDeltaY
      };
    }

    return { 
      crossed: false, 
      deltaX: 0, 
      deltaY: 0,
      contractDeltaX: 1,
      contractDeltaY: 1
    };
  }, [getGridCell, convertDeltaToContractFormat]);

  
  const handleTransactionSuccess = useCallback((newGridPos: { x: number; z: number }) => {
    lastVerifiedPosition.current = newGridPos;
    setShowTransactionPopup(false);
    setTransactionError(null);
    isProcessingBoundary.current = false;
    console.log('✅ Boundary crossing verified onchain:', newGridPos);
  }, []);

  
  const handleTransactionFailure = useCallback((error: string) => {
    console.log('❌ Boundary crossing failed, reverting position');
    
    
    const revertPosition = {
      x: lastVerifiedPosition.current.x,
      y: 1.5, 
      z: lastVerifiedPosition.current.z
    };
    
    updatePosition(revertPosition);
    setTransactionError(error);
    isProcessingBoundary.current = false;
    
    
    setTimeout(() => {
      setShowTransactionPopup(false);
      setTransactionError(null);
    }, 3000);
  }, [updatePosition]);

  
  const processBoundaryCrossing = useCallback(async (contractDeltaX: number, contractDeltaY: number, originalDeltaX: number, originalDeltaY: number) => {
    if (isProcessingBoundary.current) return;
    
    isProcessingBoundary.current = true;
    setShowTransactionPopup(true);
    setTransactionError(null);

    try {
      console.log(`🚶 Processing boundary crossing: original deltaX=${originalDeltaX}, deltaY=${originalDeltaY}`);
      console.log(`📡 Sending to contract: contractDeltaX=${contractDeltaX}, contractDeltaY=${contractDeltaY}`);
      
      const result = await movePlayer(contractDeltaX, contractDeltaY);
      
      if (result.success) {
        
        const newVerifiedPos = {
          x: lastVerifiedPosition.current.x + (originalDeltaX * GRID_SIZE),
          z: lastVerifiedPosition.current.z + (originalDeltaY * GRID_SIZE)
        };
        handleTransactionSuccess(newVerifiedPos);
      } else {
        handleTransactionFailure(result.error || 'Transaction failed');
      }
    } catch (error) {
      handleTransactionFailure(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [movePlayer, handleTransactionSuccess, handleTransactionFailure]);

  
  useEffect(() => {
    if (isProcessingBoundary.current) return;

    const currentPos = { x: position.x, z: position.z };
    const { crossed, deltaX, deltaY, contractDeltaX, contractDeltaY } = checkBoundaryCrossing(currentPos, lastVerifiedPosition.current);

    if (crossed) {
      console.log('🎯 Boundary crossed detected!', { 
        from: lastVerifiedPosition.current, 
        to: currentPos, 
        originalDelta: { deltaX, deltaY },
        contractDelta: { contractDeltaX, contractDeltaY }
      });
      processBoundaryCrossing(contractDeltaX, contractDeltaY, deltaX, deltaY);
    }
  }, [position.x, position.z, checkBoundaryCrossing, processBoundaryCrossing]);

  
  const closeTransactionPopup = useCallback(() => {
    setShowTransactionPopup(false);
    setTransactionError(null);
  }, []);

  return {
    showTransactionPopup,
    transactionError,
    isProcessingTransaction: isLoading,
    closeTransactionPopup
  };
};