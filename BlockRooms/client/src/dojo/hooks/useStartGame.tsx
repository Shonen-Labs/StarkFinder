import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";

interface StartGameState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

interface StartGameResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useStartGame = () => {
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

  const [state, setState] = useState<StartGameState>({
    isLoading: false,
    error: null,
    txHash: null
  });

  // Check if we can start the game
  const canStartGame = status === "connected" && 
                       isPlayerInitialized && 
                       !player?.game_active && 
                       gamePhase !== GamePhase.ACTIVE && 
                       !actionInProgress;

  const startGame = useCallback(async (): Promise<StartGameResult> => {
    console.log("🎮 Starting game process...");
    console.log("State check:", {
      isLoading: state.isLoading,
      actionInProgress,
      status,
      account: !!account,
      isPlayerInitialized,
      gamePhase,
      playerGameActive: player?.game_active
    });

    if (state.isLoading || actionInProgress) {
      return { success: false, error: "Already starting game" };
    }

    // Validate connection
    if (status !== "connected" || !account) {
      const error = "Wallet not connected. Please connect your wallet first.";
      console.error("❌ Connection validation failed:", error);
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if player is initialized
    if (!isPlayerInitialized) {
      const error = "Player must be initialized first";
      console.error("❌ Player validation failed:", error);
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if game is already active
    if (gamePhase === GamePhase.ACTIVE || player?.game_active) {
      const error = "Game is already active";
      console.error("❌ Game state validation failed:", error);
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setActionInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log("🚀 Executing start game transaction...");
      
      // Make sure account is properly serializable
      const accountToUse = account as Account;
      console.log("Account address:", accountToUse.address);
      
      const tx = await client.actions.startGame(accountToUse);
      
      console.log("📝 Transaction response:", tx);
      
      if (!tx?.transaction_hash) {
        throw new Error("No transaction hash received from start game");
      }

      setState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      setLastTransaction(tx.transaction_hash);

      // Wait for transaction processing
      console.log("⏳ Waiting for transaction to process...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log("✅ Game started successfully!");
      
      setState(prev => ({ ...prev, isLoading: false }));
      setActionInProgress(false);
      setLoading(false);
      setGamePhase(GamePhase.ACTIVE);
      
      // Refetch player data after successful start
      console.log("🔄 Refetching player data...");
      setTimeout(async () => {
        try {
          await refetchPlayer();
          console.log("✅ Player data refreshed");
        } catch (refetchError) {
          console.warn("⚠️ Failed to refetch player data:", refetchError);
        }
      }, 1000);
      
      return { 
        success: true, 
        transactionHash: tx.transaction_hash 
      };

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to start game";
      
      console.error("❌ Game start failed:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
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
    canStartGame,
    actionInProgress,
    startGame,
    reset
  };
};