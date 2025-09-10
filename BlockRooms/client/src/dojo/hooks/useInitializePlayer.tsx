import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";

interface InitializeState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

interface InitializeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useInitializePlayer = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { refetch: refetchPlayer } = useGameData();
  
  const { 
    setError,
    setGamePhase,
    setActionInProgress,
    setLastTransaction,
    setLoading,
    actionInProgress,
    gamePhase,
    player,
    isPlayerInitialized
  } = useAppStore();

  const [state, setState] = useState<InitializeState>({
    isLoading: false,
    error: null,
    txHash: null
  });

  const initializePlayer = useCallback(async (): Promise<InitializeResult> => {
    if (state.isLoading || actionInProgress) {
      return { success: false, error: "Already initializing" };
    }

    // Validate connection
    if (status !== "connected" || !account) {
      const error = "Wallet not connected. Please connect your wallet first.";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if player is already initialized
    if (isPlayerInitialized || (player && gamePhase !== GamePhase.UNINITIALIZED)) {
      const error = "Player is already initialized";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setActionInProgress(true);
    setLoading(true);
    setError(null);
    

    try {
      console.log("🎮 Initializing player...");
      
      const tx = await client.actions.initializePlayer(account as Account);
      
      if (!tx?.transaction_hash) {
        throw new Error("No transaction hash received");
      }

      setState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      setLastTransaction(tx.transaction_hash);

      // Wait for transaction processing
      console.log("⏳ Processing transaction...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refetch player data
      console.log("🔄 Refetching player data...");
      await refetchPlayer();
      
      console.log("✅ Player initialized successfully!");
      
      setState(prev => ({ ...prev, isLoading: false }));
      setActionInProgress(false);
      setLoading(false);
      setGamePhase(GamePhase.INITIALIZED);
      
      return { 
        success: true, 
        transactionHash: tx.transaction_hash 
      };

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to initialize player";
      
      console.error("❌ Initialization failed:", error);
      
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      setError(errorMessage);
      setGamePhase(GamePhase.UNINITIALIZED);
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
    setGamePhase,
    setActionInProgress,
    setLastTransaction,
    setLoading,
    player,
    gamePhase,
    isPlayerInitialized
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
    canInitialize: status === "connected" && !isPlayerInitialized && gamePhase === GamePhase.UNINITIALIZED && !actionInProgress,
    actionInProgress,
    initializePlayer,
    reset
  };
};