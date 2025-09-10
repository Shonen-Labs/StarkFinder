import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";

interface EndGameState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

interface EndGameResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useEndGame = () => {
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
    gameSession,
    endGame: updateGamePhase,
    setGamePhase
  } = useAppStore();

  const [state, setState] = useState<EndGameState>({
    isLoading: false,
    error: null,
    txHash: null
  });

  const endGame = useCallback(async (): Promise<EndGameResult> => {
    if (state.isLoading || actionInProgress) {
      return { success: false, error: "Already ending game" };
    }

    // Validate connection
    if (status !== "connected" || !account) {
      const error = "Wallet not connected. Please connect your wallet first.";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if player exists
    if (!player) {
      const error = "Player not found";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if game is in valid state to end
    if (gamePhase === GamePhase.UNINITIALIZED) {
      const error = "Game has not been initialized";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    if (gamePhase === GamePhase.COMPLETED || gamePhase === GamePhase.GAME_OVER) {
      const error = "Game has already ended";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if player has an active game session
    if (!player.game_active) {
      const error = "No active game to end";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if game session exists
    if (!gameSession) {
      const error = "Game session not found";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if session is already complete
    if (gameSession.session_complete) {
      const error = "Game session is already complete";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setActionInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log("🏁 Ending game...");
      
      const tx = await client.actions.endGame(account as Account);
      
      if (!tx?.transaction_hash) {
        throw new Error("No transaction hash received");
      }

      setState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      setLastTransaction(tx.transaction_hash);

      // Wait for transaction processing
      console.log("⏳ Processing game end...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local game phase immediately
      console.log("🎮 Updating game phase to completed...");
      setGamePhase(GamePhase.COMPLETED);
      updateGamePhase();
      
      // Refetch player data to get final state
      console.log("🔄 Refetching final game data...");
      await refetchPlayer();
      
      console.log("✅ Game ended successfully!");
      
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
        : "Failed to end game";
      
      console.error("❌ Game end failed:", error);
      
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
    gameSession,
    updateGamePhase,
    setGamePhase
  ]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, txHash: null });
    setError(null);
    setActionInProgress(false);
    setLoading(false);
  }, [setError, setActionInProgress, setLoading]);

  const canEndGame = useCallback(() => {
    return (
      status === "connected" &&
      player &&
      player.game_active &&
      gameSession &&
      !gameSession.session_complete &&
      (gamePhase === GamePhase.ACTIVE || gamePhase === GamePhase.INITIALIZED) &&
      !actionInProgress
    );
  }, [status, player, gameSession, gamePhase, actionInProgress]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    txHash: state.txHash,
    isConnected: status === "connected",
    canEndGame: canEndGame(),
    actionInProgress,
    endGame,
    reset
  };
};