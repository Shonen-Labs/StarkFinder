import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";

interface AttackEntityState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

interface AttackEntityResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useAttackEntity = () => {
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { client } = useDojoSDK();
  const { refetch: refetchGameData } = useGameData();
  

  const { 
    setError,
    setActionInProgress,
    setLastTransaction,
    setLoading,
    actionInProgress,
    gamePhase,
    player,
    canAttack,
    getEntitiesInCurrentRoom,
    getEntityById
  } = useAppStore();

  const [state, setState] = useState<AttackEntityState>({
    isLoading: false,
    error: null,
    txHash: null
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const attackEntity = useCallback(async (entityId: string): Promise<AttackEntityResult> => {
 
    console.log("Step 1");
    
    if (state.isLoading || actionInProgress) {
      return { success: false, error: "Already performing action" };
    }
    console.log("Step 2");
    // Validate connection
    console.log("status", status);
  console.log("account", account);
    if (status !== "connected" || !account) {
      const error = "Wallet not connected. Please connect your wallet first.";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }
    console.log("Step 3");
    // Check if player can attack
    if (!canAttack()) {
      const error = "Cannot attack at this time";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }
    console.log("Step 4");
    // Check if player exists and game is active
    if (!player || gamePhase !== GamePhase.ACTIVE) {
      const error = "Game is not active";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Validate entity exists and is in current room
    const entity = getEntityById(entityId);
    if (!entity) {
      const error = "Entity not found";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    if (!entity.is_alive) {
      const error = "Entity is already dead";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    const entitiesInRoom = getEntitiesInCurrentRoom();
    const isEntityInRoom = entitiesInRoom.some(e => e.entity_id.toString() === entityId);
    if (!isEntityInRoom) {
      const error = "Entity is not in current room";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setActionInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log(`⚔️ Attacking entity ${entityId}...`);
    
      const tx = await client.actions.attackEntity(
        account as Account,
        entityId
      );      
      
      if (!tx?.transaction_hash) {
        throw new Error("No transaction hash received");
      }

      setState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      setLastTransaction(tx.transaction_hash);

      // Wait for transaction processing
      console.log("⏳ Processing attack...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch game data to update entity states and player stats
      console.log("🔄 Refetching game data...");
      await refetchGameData();
      
      console.log("✅ Attack completed successfully!");
      
      setState(prev => ({ ...prev, isLoading: false }));
      setActionInProgress(false);
      setLoading(false);
      
      return { 
        success: true, 
        transactionHash: tx.transaction_hash 
      };

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to attack entity";
      
      console.error("❌ Attack failed:", error);
      
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      setError(errorMessage);
      setActionInProgress(false);
      setLoading(false);
      
      return { success: false, error: errorMessage };
    }
  }, [ 
    actionInProgress,
    status,
    account,
    client,
    refetchGameData,
    setError,
    setActionInProgress,
    setLastTransaction,
    setLoading,
    player,
    gamePhase,
    canAttack,
    getEntitiesInCurrentRoom,
    getEntityById
  ]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, txHash: null });
    setError(null);
    setActionInProgress(false);
    setLoading(false);
  }, [setError, setActionInProgress, setLoading]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    txHash: state.txHash,
    isConnected: status === "connected",
    canAttackEntity: canAttack(),
    actionInProgress,
    entitiesInCurrentRoom: getEntitiesInCurrentRoom(),
    attackEntity,
    reset
  };
};