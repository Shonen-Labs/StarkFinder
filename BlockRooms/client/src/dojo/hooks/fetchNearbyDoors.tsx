import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";

interface GetNearbyDoorsState {
  isLoading: boolean;
  error: string | null;
  doors: any[] | null;
}

interface GetNearbyDoorsResult {
  success: boolean;
  doors?: any[];
  error?: string;
}

export const useGetNearbyDoors = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { refetch: refetchPlayer } = useGameData();
  
  const { 
    setError,
    setActionInProgress,
    setLoading,
    setNearbyDoors,
    actionInProgress,
    gamePhase,
    player,
    canTakeActions
  } = useAppStore();

  const [state, setState] = useState<GetNearbyDoorsState>({
    isLoading: false,
    error: null,
    doors: null
  });

  const getNearbyDoors = useCallback(async (): Promise<GetNearbyDoorsResult> => {
    if (state.isLoading || actionInProgress) {
      return { success: false, error: "Already loading doors" };
    }

    // Validate connection
    if (status !== "connected" || !account) {
      const error = "Wallet not connected. Please connect your wallet first.";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Check if player can take actions
    if (!canTakeActions) {
      const error = "Cannot check doors at this time";
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

    // Check if player is alive
    if (!player.is_alive) {
      const error = "Player is not alive";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setActionInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log(`🚪 Getting nearby doors...`);
      
      const result = await client.actions.getNearbyDoors();
      console.log("🚪 result", result);
      if (!result) {
        throw new Error("No result received from getNearbyDoors");
      }

      // Parse the result - adjust based on actual return format
      const doors = Array.isArray(result) ? result : result.doors || [];

      setState(prev => ({ ...prev, doors, isLoading: false }));
      setNearbyDoors(doors); // Update Zustand store
      
      console.log("✅ Nearby doors retrieved successfully!", doors);
      
      setActionInProgress(false);
      setLoading(false);
      
      return { 
        success: true, 
        doors 
      };

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to get nearby doors";
      
      console.error("❌ Get nearby doors failed:", error);
      
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
    setLoading,
    player,
    gamePhase,
    canTakeActions
  ]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, doors: null });
    setError(null);
    setActionInProgress(false);
    setLoading(false);
  }, [setError, setActionInProgress, setLoading]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    doors: state.doors,
    isConnected: status === "connected",
    canCheckDoors: canTakeActions,
    actionInProgress,
    getNearbyDoors,
    reset,
    hasNearbyDoors: (state.doors && state.doors.length > 0) || false,
  };

};