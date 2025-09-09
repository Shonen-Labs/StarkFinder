import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useGameData } from "./useGameData";
import * as models from "../models.gen";

interface CollectShardState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

interface CollectShardResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useCollectShard = () => {
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
    getShardsInCurrentRoom
  } = useAppStore();

  const [state, setState] = useState<CollectShardState>({
    isLoading: false,
    error: null,
    txHash: null
  });

  const collectShard = useCallback(async (shardId: string): Promise<CollectShardResult> => {
    if (state.isLoading || actionInProgress) {
      return { success: false, error: "Already collecting" };
    }

    // Validate connection
    if (status !== "connected" || !account) {
      const error = "Wallet not connected. Please connect your wallet first.";
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

    // Check if current room exists
    if (!currentRoom) {
      const error = "No current room found";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    // Validate shard exists in current room and is not collected
    const shardsInRoom = getShardsInCurrentRoom();
    const shard = shardsInRoom.find(s => s.shard_id.toString() === shardId);
    
    if (!shard) {
      const error = "Shard not found in current room";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    if (shard.collected) {
      const error = "Shard has already been collected";
      setState(prev => ({ ...prev, error }));
      setError(error);
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setActionInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log(`💎 Collecting shard ${shardId} in room ${currentRoom.room_id}...`);
      
      const tx = await client.actions.collectShard(
        account as Account, 
        shard.shard_id, 
        currentRoom.room_id
      );
      
      if (!tx?.transaction_hash) {
        throw new Error("No transaction hash received");
      }

      setState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      setLastTransaction(tx.transaction_hash);

      // Wait for transaction processing
      console.log("⏳ Processing shard collection...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch player data
      console.log("🔄 Refetching player data...");
      await refetchPlayer();
      
      console.log("✅ Shard collected successfully!");
      
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
        : "Failed to collect shard";
      
      console.error("❌ Shard collection failed:", error);
      
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
    currentRoom,
    getShardsInCurrentRoom
  ]);

  const canCollectShard = useCallback((shardId: string): boolean => {
    if (!player || !currentRoom || gamePhase !== GamePhase.ACTIVE || !player.is_alive) {
      return false;
    }

    const shardsInRoom = getShardsInCurrentRoom();
    const shard = shardsInRoom.find(s => s.shard_id.toString() === shardId);
    
    return shard !== undefined && !shard.collected && !actionInProgress;
  }, [player, currentRoom, gamePhase, getShardsInCurrentRoom, actionInProgress]);

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
    canCollectShard,
    actionInProgress,
    collectShard,
    reset,
    availableShards: getShardsInCurrentRoom()
  };
};