import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";

interface MovePlayerState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

interface MovePlayerResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useMovePlayer = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { refetch: refetchPlayer } = useGameData();
  
  const { 
    setError,
    setActionInProgress,
    setLastTransaction,
    setLoading,
    actionInProgress,
    gamePhase,
    player,
    canMove
  } = useAppStore();

  const [state, setState] = useState<MovePlayerState>({
    isLoading: false,
    error: null,
    txHash: null
  });

  const movePlayer = useCallback(async (xDelta: number, yDelta: number): Promise<MovePlayerResult> => {
    if (state.isLoading || actionInProgress) {
      return { success: false, error: "Already moving" };
    }

    // Validate connection
    if (status !== "connected" || !account) {
      const error = "Wallet not connected. Please connect your wallet first.";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if player can move
    if (!canMove()) {
      const error = "Cannot move at this time";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if player exists and game is active
    if (!player || gamePhase !== GamePhase.ACTIVE) {
      const error = "Game is not active";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }
    
    if (![0, 1, 2].includes(xDelta) || ![0, 1, 2].includes(yDelta)) {
      const error = "Invalid movement. Delta must be 0, 1, or 2.";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setActionInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log(`🚶 Moving player (${typeof xDelta},${xDelta}, ${typeof yDelta},${yDelta})...`);
    
      const tx = await client.actions.movePlayer(
        account as Account,
        xDelta,
        yDelta
      );      
      if (!tx?.transaction_hash) {
        throw new Error("No transaction hash received");
      }

      setState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      setLastTransaction(tx.transaction_hash);

      // Wait for transaction processing
      console.log("⏳ Processing movement...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch player data
      console.log("🔄 Refetching player data...");
      await refetchPlayer();
      
      console.log("✅ Player moved successfully!");
      
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
        : "Failed to move player";
      
      console.error("❌ Movement failed:", error);
      
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      setError(errorMessage);
      setActionInProgress(false);
      setLoading(false);
      
      return { success: false, error: errorMessage };
    }
  }, [
    state.isLoading,
    actionInProgress,
    status,
    account,
    client,
    refetchPlayer,
    setError,
    setActionInProgress,
    setLastTransaction,
    setLoading,
    player,
    gamePhase,
    canMove
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
    canMovePlayer: canMove(),
    actionInProgress,
    movePlayer,
    reset
  };
};