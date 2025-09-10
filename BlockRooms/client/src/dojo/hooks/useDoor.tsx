import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";

interface OpenDoorState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

interface OpenDoorResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useOpenDoor = () => {
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
    currentRoom,
    canMove,
  } = useAppStore();

  const [state, setState] = useState<OpenDoorState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeAction = useCallback(
    async (
      actionType: "enter" | "exit",
      doorId: string
    ): Promise<OpenDoorResult> => {
      if (state.isLoading || actionInProgress) {
        return {
          success: false,
          error: `Already ${
            actionType === "enter" ? "entering" : "exiting"
          } door`,
        };
      }
      console.log("status", status);
      console.log("account", account);
      // Validate connection
      if (status !== "connected" || !account) {
        const error = "Wallet not connected. Please connect your wallet first.";
        setState((prev) => ({ ...prev, error }));
        setError(error);
        return { success: false, error };
      }

      // Check if player exists and game is active
      if (!player || gamePhase !== GamePhase.ACTIVE) {
        const error = "Game is not active";
        setState((prev) => ({ ...prev, error }));
        setError(error);
        return { success: false, error };
      }

      if (!player.is_alive) {
        const error = "Player is not alive";
        setState((prev) => ({ ...prev, error }));
        setError(error);
        return { success: false, error };
      }

      // Action-specific validations
      if (actionType === "enter") {
        if (currentRoom !== null) {
          const error = "Already in a room";
          setState((prev) => ({ ...prev, error }));
          setError(error);
          return { success: false, error };
        }
      } else if (actionType === "exit") {
        if (!currentRoom?.cleared) {
          const error = "Cannot exit - room not cleared";
          setState((prev) => ({ ...prev, error }));
          setError(error);
          return { success: false, error };
        }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      setActionInProgress(true);
      setLoading(true);
      setError(null);

      try {
        console.log(
          `🚪 ${
            actionType === "enter" ? "Entering" : "Exiting"
          } door ${doorId}...`
        );

        const tx =
          actionType === "enter"
            ? await client.actions.enterDoor(account as Account, doorId)
            : await client.actions.exitDoor(account as Account, doorId);

        if (!tx?.transaction_hash) {
          throw new Error("No transaction hash received");
        }

        setState((prev) => ({ ...prev, txHash: tx.transaction_hash }));
        setLastTransaction(tx.transaction_hash);

        // Wait for transaction processing
        console.log(`⏳ Processing door ${actionType}...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Refetch player data
        console.log("🔄 Refetching player data...");
        await refetchPlayer();

        console.log(`✅ Door ${actionType} successful! ${tx.transaction_hash}`);

        setState((prev) => ({ ...prev, isLoading: false }));
        setActionInProgress(false);
        setLoading(false);

        return {
          success: true,
          transactionHash: tx.transaction_hash,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to ${actionType} door`;

        console.error(`❌ Door ${actionType} failed:`, error);

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        setError(errorMessage);
        setActionInProgress(false);
        setLoading(false);

        return { success: false, error: errorMessage };
      }
    },
    [
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
      currentRoom,
    ]
  );

  const enterDoor = useCallback(
    (doorId: string) => {
      return executeAction("enter", doorId);
    },
    [executeAction]
  );

  const exitDoor = useCallback(
    (doorId: string) => {
      return executeAction("exit", doorId);
    },
    [executeAction]
  );

  const canEnterDoor = useCallback((): boolean => {
    return (
      player?.is_alive === true &&
      gamePhase === GamePhase.ACTIVE &&
      currentRoom === null &&
      !actionInProgress &&
      !state.isLoading
    );
  }, [
    player?.is_alive,
    gamePhase,
    currentRoom,
    actionInProgress,
    state.isLoading,
  ]);

  const canExitDoor = useCallback((): boolean => {
    return (
      player?.is_alive === true &&
      gamePhase === GamePhase.ACTIVE &&
      currentRoom?.cleared === true &&
      !actionInProgress &&
      !state.isLoading
    );
  }, [
    player?.is_alive,
    gamePhase,
    currentRoom?.cleared,
    actionInProgress,
    state.isLoading,
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
    canEnterDoor: canEnterDoor(),
    canExitDoor: canExitDoor(),
    actionInProgress,
    enterDoor,
    exitDoor,
    reset,
  };
};
