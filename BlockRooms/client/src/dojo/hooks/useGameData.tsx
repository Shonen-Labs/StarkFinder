import { useEffect, useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";

import * as models from "../models.gen";
import useAppStore, { GamePhase } from '../../zustand/store';

interface UseGameDataReturn {
  player: models.Player | null;
  playerStats: models.PlayerStats | null;
  gameSession: models.GameSession | null;
  gameConfig: models.GameConfig | null;
  currentRoom: models.Room | null;
  entities: models.Entity[];
  shardLocations: models.ShardLocation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  gamePhase: GamePhase;
  gameStats: {
    currentHealth: number;
    maxHealth: number;
    currentShards: number;
    roomsCleared: number;
    hasAllNumberedShards: boolean;
    hasKey: boolean;
    isAlive: boolean;
    gameActive: boolean;
    specialAbilityCooldown: number;
  };
  canMove: boolean;
  canAttack: boolean;
  isPlayerInitialized: boolean;
}

const TORII_URL = dojoConfig.toriiUrl + "/graphql";

const PLAYER_QUERY = `
  query GetPlayerData($playerAddress: ContractAddress!) {
    blockroomsPlayerModels(where: {player_id: $playerAddress}) {
      edges {
        node {
          player_id
          position {
            x
            y 
          }
          current_room
          health
          max_health
          shards
          game_active
          is_alive
          current_session_id
          rooms_cleared 
          has_shard_one
          has_shard_two
          has_shard_three  
          special_ability_cooldown
          has_key
        }
      }
    }
    blockroomsPlayerStatsModels(where: {player_id: $playerAddress}) {
      edges {
        node {
          player_id
          games_played
          games_won
          total_shards_collected
          total_entities_defeated
          total_playtime
          best_completion_time
          highest_room_reached
          total_damage_dealt
          total_damage_taken
          doors_opened 
          total_actions_taken
          numbered_shards_collected
        }
      }
    }
    blockroomsGameSessionModels(where: {player_id: $playerAddress}) {
      edges {
        node {
          session_id
          player_id
          start_time
          end_time
          rooms_cleared
          total_shards_collected
          numbered_shards_collected
          entities_defeated
          total_damage_dealt
          total_damage_taken
          doors_opened
          deaths
          session_complete 
          total_actions
          victory_achieved
        }
      }
    }
    blockroomsGameConfigModels {
      edges {
        node {
          config_id
          grid_size
          starting_health
          starting_shards
          base_damage 
          entity_spawn_rate
          shard_drop_rate
          male_entity_damage
          female_entity_damage
          door_detection_range
        }
      }
    }
    blockroomsRoomModels {
      edges {
        node {
          room_id
          initialized
          cleared
          entity_count
          active_entities
          has_treasure
          treasure_collected 
        }
      }
    }
    blockroomsEntityModels {
      edges {
        node {
          entity_id
          room_id
          entity_type 
          health
          max_health
          is_alive
          damage_per_turn
          drops_numbered_shard {
            option
          } 
        }
      }
    }
    blockroomsShardLocationModels {
      edges {
        node {
          shard_id 
          room_id
          numbered_shard {
            option
          }
          collected
        }
      }
    }
  }
`;

// Utility functions
const parseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return value.startsWith('0x') ? parseInt(value, 16) : parseInt(value, 10);
  }
  return 0;
};

const parsePosition = (pos: any): models.Position => ({
  x: parseNumber(pos?.x || 0),
  y: parseNumber(pos?.y || 0),
});

const parseCairoOption = (option: any) => {
  if (!option || !option.option) return null;
  return option.option;
};

const parseCairoEnum = (enumValue: any) => {
  if (!enumValue) return null;
  return enumValue;
};

const fetchPlayerData = async (playerAddress: string) => {
  const response = await fetch(TORII_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      query: PLAYER_QUERY,
      variables: { playerAddress }
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
  }

  const data = result.data;
  if (!data) return null;

  console.log("GraphQL data:", data);

  // Parse all the data
  const playerNode = data.blockroomsPlayerModels?.edges?.[0]?.node;
  const playerStatsNode = data.blockroomsPlayerStatsModels?.edges?.[0]?.node;
  const gameSessionNode = data.blockroomsGameSessionModels?.edges?.[0]?.node;
  const gameConfigNode = data.blockroomsGameConfigModels?.edges?.[0]?.node;

  const roomNodes = data.blockroomsRoomModels?.edges?.map((e: any) => e.node) || [];
  const entityNodes = data.blockroomsEntityModels?.edges?.map((e: any) => e.node) || [];
  const shardNodes = data.blockroomsShardLocationModels?.edges?.map((e: any) => e.node) || [];
  console.log("entityNodes", entityNodes);
  return {
    player: playerNode ? {
      player_id: playerNode.player_id,
      position: parsePosition(playerNode.position),
      current_room: parseNumber(playerNode.current_room),
      health: parseNumber(playerNode.health),
      max_health: parseNumber(playerNode.max_health),
      shards: parseNumber(playerNode.shards),
      game_active: Boolean(playerNode.game_active),
      is_alive: Boolean(playerNode.is_alive),
      current_session_id: parseNumber(playerNode.current_session_id),
      rooms_cleared: parseNumber(playerNode.rooms_cleared),
      has_shard_one: Boolean(playerNode.has_shard_one),
      has_shard_two: Boolean(playerNode.has_shard_two),
      has_shard_three: Boolean(playerNode.has_shard_three),
      special_ability_cooldown: parseNumber(playerNode.special_ability_cooldown),
      has_key: Boolean(playerNode.has_key),
    } as models.Player : null,

    playerStats: playerStatsNode ? {
      player_id: playerStatsNode.player_id,
      games_played: parseNumber(playerStatsNode.games_played),
      games_won: parseNumber(playerStatsNode.games_won),
      total_shards_collected: parseNumber(playerStatsNode.total_shards_collected),
      total_entities_defeated: parseNumber(playerStatsNode.total_entities_defeated),
      total_playtime: parseNumber(playerStatsNode.total_playtime),
      best_completion_time: parseNumber(playerStatsNode.best_completion_time),
      highest_room_reached: parseNumber(playerStatsNode.highest_room_reached),
      total_damage_dealt: parseNumber(playerStatsNode.total_damage_dealt),
      total_damage_taken: parseNumber(playerStatsNode.total_damage_taken),
      doors_opened: parseNumber(playerStatsNode.doors_opened),
      total_actions_taken: parseNumber(playerStatsNode.total_actions_taken),
      numbered_shards_collected: parseNumber(playerStatsNode.numbered_shards_collected),
    } as models.PlayerStats : null,

    gameSession: gameSessionNode ? {
      session_id: parseNumber(gameSessionNode.session_id),
      player_id: gameSessionNode.player_id,
      start_time: parseNumber(gameSessionNode.start_time),
      end_time: parseNumber(gameSessionNode.end_time),
      rooms_cleared: parseNumber(gameSessionNode.rooms_cleared),
      total_shards_collected: parseNumber(gameSessionNode.total_shards_collected),
      numbered_shards_collected: parseNumber(gameSessionNode.numbered_shards_collected),
      entities_defeated: parseNumber(gameSessionNode.entities_defeated),
      total_damage_dealt: parseNumber(gameSessionNode.total_damage_dealt),
      total_damage_taken: parseNumber(gameSessionNode.total_damage_taken),
      doors_opened: parseNumber(gameSessionNode.doors_opened),
      deaths: parseNumber(gameSessionNode.deaths),
      session_complete: Boolean(gameSessionNode.session_complete),
      total_actions: parseNumber(gameSessionNode.total_actions),
      victory_achieved: Boolean(gameSessionNode.victory_achieved),
    } as models.GameSession : null,

    gameConfig: gameConfigNode ? {
      config_id: parseNumber(gameConfigNode.config_id),
      grid_size: parseNumber(gameConfigNode.grid_size),
      starting_health: parseNumber(gameConfigNode.starting_health),
      starting_shards: parseNumber(gameConfigNode.starting_shards),
      base_damage: parseNumber(gameConfigNode.base_damage),
      entity_spawn_rate: parseNumber(gameConfigNode.entity_spawn_rate),
      shard_drop_rate: parseNumber(gameConfigNode.shard_drop_rate),
      male_entity_damage: parseNumber(gameConfigNode.male_entity_damage),
      female_entity_damage: parseNumber(gameConfigNode.female_entity_damage),
      door_detection_range: parseNumber(gameConfigNode.door_detection_range),
    } as models.GameConfig : null,

    rooms: roomNodes.map((node: any) => ({
      room_id: parseNumber(node.room_id),
      initialized: Boolean(node.initialized),
      cleared: Boolean(node.cleared),
      entity_count: parseNumber(node.entity_count),
      active_entities: parseNumber(node.active_entities),
      has_treasure: Boolean(node.has_treasure),
      treasure_collected: Boolean(node.treasure_collected),
    } as models.Room)),
    
    entities: entityNodes.map((node: any) => ({
      entity_id: parseNumber(node.entity_id),
      entity_type: parseCairoEnum(node.entity_type),
      room_id: parseNumber(node.room_id),
      health: parseNumber(node.health),
      max_health: parseNumber(node.max_health),
      is_alive: Boolean(node.is_alive),
      damage_per_turn: parseNumber(node.damage_per_turn),
      drops_numbered_shard: parseCairoOption(node.drops_numbered_shard),
    } as models.Entity)),
    
    shardLocations: shardNodes.map((node: any) => ({
      shard_id: parseNumber(node.shard_id),
      room_id: parseNumber(node.room_id),
      numbered_shard: parseCairoOption(node.numbered_shard),
      collected: Boolean(node.collected),
    } as models.ShardLocation)),
  };
};

export const useGameData = (): UseGameDataReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { account } = useAccount();
  
  // Store state and actions
  const {
    player,
    playerStats,
    gameSession,
    gameConfig,
    currentRoom,
    gamePhase,
    isPlayerInitialized,
    gameStats,
    setPlayer,
    setPlayerStats,
    setGameSession,
    setGameConfig,
    setCurrentRoom,
    setRooms,
    setEntities,
    setShardLocations,
    setLoading,
    setError: setStoreError,
    canMove,
    canAttack,
    resetGame,
    getEntitiesInCurrentRoom,
    getShardsInCurrentRoom,
  } = useAppStore();

  const userAddress = account ? addAddressPadding(account.address).toLowerCase() : '';

  const refetch = useCallback(async () => {
    if (!userAddress) {
      setIsLoading(false);
      setLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);
      setError(null);
      setStoreError(null);

      const data = await fetchPlayerData(userAddress);
       
      if (data) {
        // Update store with fetched data
        setPlayer(data.player);
        console.log("data.playerStats", data.playerStats);
        setPlayerStats(data.playerStats);
        setGameSession(data.gameSession);
        setGameConfig(data.gameConfig);
        
        // Set world state
        setRooms(data.rooms);
        console.log("data.entities", data.entities);
        setEntities(data.entities);
        setShardLocations(data.shardLocations);

        // Find and set current room based on player's current_room field
        if (data.player) {
          const currentRoomId = data.player.current_room.toString();
          const playerRoom = data.rooms.find((room: models.Room) => 
            room.room_id.toString() === currentRoomId
          );
          setCurrentRoom(playerRoom || null);
        }
      } else {
        // No player data found - reset to initial state
        console.log("No player data found - reset to initial state");
        setPlayer(null);
        setPlayerStats(null);
        setGameSession(null);
        setGameConfig(null);
        setCurrentRoom(null);
        setRooms([]);
        setEntities([]);
        setShardLocations([]);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch player data';
      setError(errorMsg);
      setStoreError(errorMsg);
      console.error("Error fetching player data:", err);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [
    userAddress, 
    setPlayer, 
    setPlayerStats, 
    setGameSession, 
    setGameConfig,
    setCurrentRoom,
    setRooms,
    setEntities,
    setShardLocations,
    setLoading, 
    setStoreError
  ]);

  // Fetch data when address changes
  useEffect(() => {
    if (userAddress) {
      refetch();
    } else {
      setIsLoading(false);
      setLoading(false);
    }
  }, [userAddress, refetch]);

  // Reset when account disconnects
  useEffect(() => {
    if (!account) {
      resetGame();
      setError(null);
      setIsLoading(false);
    }
  }, [account, resetGame]);

  return {
    player,
    playerStats,
    gameSession,
    gameConfig,
    currentRoom,
    entities: getEntitiesInCurrentRoom(),
    shardLocations: getShardsInCurrentRoom(),
    isLoading,
    error,
    refetch,
    gamePhase,
    gameStats,
    canMove: canMove(),
    canAttack: canAttack(),
    isPlayerInitialized,
  };
};