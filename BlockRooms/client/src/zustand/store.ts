import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as models from "../dojo/models.gen";

enum GamePhase {
  UNINITIALIZED = "uninitialized",
  INITIALIZED = "initialized",
  ACTIVE = "active",
  COMPLETED = "completed",
  GAME_OVER = "game_over",
}

interface AppState {
  // Core player data (from blockchain)
  player: models.Player | null;
  playerStats: models.PlayerStats | null;
  gameSession: models.GameSession | null;
  gameConfig: models.GameConfig | null;

  // Current room and world state
  currentRoom: models.Room | null;
  rooms: Map<string, models.Room>;
  entities: models.Entity[];
  entityStates: models.EntityState[];
  shardLocations: models.ShardLocation[];

  // Door state
  nearbyDoors: any[];

  // Game state
  gamePhase: GamePhase;
  isPlayerInitialized: boolean;
  canTakeActions: boolean;
  actionsThisTurn: number; // Add this back
  maxActionsPerTurn: number; // Add this back

  // Recent events (for UI feedback and animations)
  recentEvents: {
    gameStarted: models.GameStarted[];
    gameCompleted: models.GameCompleted[];
    victoriesAchieved: models.VictoryAchieved[];
    roomsCleared: models.RoomCleared[];
    roomsEntered: models.RoomEntered[];
    roomsExited: models.RoomExited[];
    playerDeaths: models.PlayerDeath[];
    shardsCollected: models.NumberedShardCollected[];
  };

  // UI/UX state
  isLoading: boolean;
  error: string | null;
  lastTransaction: string | null;
  actionInProgress: boolean;
  connectionStatus: "connected" | "connecting" | "disconnected";

  // Game statistics (derived from player data)
  gameStats: {
    currentHealth: number;
    maxHealth: number;
    currentShards: number;
    roomsCleared: number;
    turnNumber: number; // Add this back
    dodgeActiveTurns: number; // Add this back
    hasAllNumberedShards: boolean;
    hasKey: boolean;
    isAlive: boolean;
    gameActive: boolean;
    movementLocked: boolean; // Add this back
    specialAbilityCooldown: number;
  };

  // UI/Game state for 3D game compatibility
  gameStarted: boolean;
  showWarning: boolean;
  showGun: boolean;
  showCrosshair: boolean;
  showMapTracker: boolean;
  position: { x: number; y: number; z: number };
  rotation: number;
  moving: boolean;
  velocity: { x: number; y: number; z: number };
}

// Define actions interface
interface AppActions {
  // Core state setters (from blockchain data)
  setPlayer: (player: models.Player | null) => void;
  setPlayerStats: (stats: models.PlayerStats | null) => void;
  setGameSession: (session: models.GameSession | null) => void;
  setGameConfig: (config: models.GameConfig | null) => void;

  // World state management
  setCurrentRoom: (room: models.Room | null) => void;
  updateRoom: (room: models.Room) => void;
  setRooms: (rooms: models.Room[]) => void;
  setNearbyDoors: (doors: any[]) => void;
  setEntities: (entities: models.Entity[]) => void;
  updateEntity: (entity: models.Entity) => void;
  removeEntity: (entityId: string) => void;

  setEntityStates: (states: models.EntityState[]) => void;
  updateEntityState: (state: models.EntityState) => void;

  setShardLocations: (locations: models.ShardLocation[]) => void;
  updateShardLocation: (location: models.ShardLocation) => void;

  // Game state management
  setGamePhase: (phase: GamePhase) => void;
  setPlayerInitialized: (initialized: boolean) => void;
  setCanTakeActions: (can: boolean) => void;
  setActionsThisTurn: (count: number) => void; // Add this back
  incrementActionsThisTurn: () => void; // Add this back
  resetActionsThisTurn: () => void; // Add this back

  // Event handling (for UI feedback)
  addGameStarted: (event: models.GameStarted) => void;
  addGameCompleted: (event: models.GameCompleted) => void;
  addVictoryAchieved: (event: models.VictoryAchieved) => void;
  addRoomCleared: (event: models.RoomCleared) => void;
  addRoomEntered: (event: models.RoomEntered) => void;
  addRoomExited: (event: models.RoomExited) => void;
  addPlayerDeath: (event: models.PlayerDeath) => void;
  addShardCollected: (event: models.NumberedShardCollected) => void;
  clearRecentEvents: () => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastTransaction: (txHash: string | null) => void;
  setActionInProgress: (inProgress: boolean) => void;
  setConnectionStatus: (
    status: "connected" | "connecting" | "disconnected"
  ) => void;

  // Game lifecycle
  initializeGame: () => void;
  startNewGame: () => void;
  endGame: () => void;
  respawnPlayer: () => void;
  resetGame: () => void;

  // UI/Game actions for 3D game compatibility
  startGame: () => void;
  hideWarning: () => void;
  setShowWarning: (show: boolean) => void;
  setShowGun: (show: boolean) => void;
  setShowCrosshair: (show: boolean) => void;
  setShowMapTracker: (show: boolean) => void;
  updatePosition: (position: { x: number; y: number; z: number }) => void;
  updateRotation: (rotation: number) => void;
  setMoving: (moving: boolean) => void;
  setVelocity: (velocity: { x: number; y: number; z: number }) => void;

  // Utility getters
  canMove: () => boolean;
  canAttack: () => boolean;
  canCollectShard: (roomId: string, shardId: string) => boolean | undefined;
  getEntitiesInCurrentRoom: () => models.Entity[];
  getShardsInCurrentRoom: () => models.ShardLocation[];
  getRoomById: (roomId: string) => models.Room | null;
  getEntityById: (entityId: string) => models.Entity | null;
  hasNumberedShard: (shardType: models.NumberedShardEnum) => boolean;
  isRoomCleared: (roomId: string) => boolean;
  getActionsRemaining: () => number; // Add this function
}

// Combine state and actions
type AppStore = AppState & AppActions;

// Helper to update game stats from player data
const updateGameStats = (
  player: models.Player | null
): AppState["gameStats"] => {
  if (!player) {
    return {
      currentHealth: 0,
      maxHealth: 0,
      currentShards: 0,
      roomsCleared: 0,
      turnNumber: 0,
      dodgeActiveTurns: 0,
      hasAllNumberedShards: false,
      hasKey: false,
      isAlive: false,
      gameActive: false,
      movementLocked: false,
      specialAbilityCooldown: 0,
    };
  }

  return {
    currentHealth: Number(player.health),
    maxHealth: Number(player.max_health),
    currentShards: Number(player.shards),
    roomsCleared: Number(player.rooms_cleared),
    turnNumber: 1, // Default value since turn-based removed
    dodgeActiveTurns: 0, // Default value
    hasAllNumberedShards:
      player.has_shard_one && player.has_shard_two && player.has_shard_three,
    hasKey: player.has_key,
    isAlive: player.is_alive,
    gameActive: player.game_active,
    movementLocked: false, // Default value
    specialAbilityCooldown: Number(player.special_ability_cooldown),
  };
};

// Helper to determine game phase based on state
const determineGamePhase = (
  player: models.Player | null,
  gameSession: models.GameSession | null
): GamePhase => {
  if (!player) return GamePhase.UNINITIALIZED;

  if (!player.is_alive) return GamePhase.GAME_OVER;

  if (gameSession?.victory_achieved) return GamePhase.COMPLETED;

  if (gameSession?.session_complete && !gameSession.victory_achieved)
    return GamePhase.GAME_OVER;

  if (player.game_active) return GamePhase.ACTIVE;

  return GamePhase.INITIALIZED;
};

// Initial state
const initialState: AppState = {
  // Core data
  player: null,
  playerStats: null,
  gameSession: null,
  gameConfig: null,

  // World state
  currentRoom: null,
  rooms: new Map(),
  entities: [],
  entityStates: [],
  shardLocations: [],
  nearbyDoors: [],
  // Game state
  gamePhase: GamePhase.UNINITIALIZED,
  isPlayerInitialized: false,
  canTakeActions: false,
  actionsThisTurn: 0,
  maxActionsPerTurn: 3, // Default value

  // Events (limited recent history for UI feedback)
  recentEvents: {
    gameStarted: [],
    gameCompleted: [],
    victoriesAchieved: [],
    roomsCleared: [],
    roomsEntered: [],
    roomsExited: [],
    playerDeaths: [],
    shardsCollected: [],
  },

  // UI state
  isLoading: false,
  error: null,
  lastTransaction: null,
  actionInProgress: false,
  connectionStatus: "disconnected",

  // Stats
  gameStats: {
    currentHealth: 0,
    maxHealth: 0,
    currentShards: 0,
    roomsCleared: 0,
    turnNumber: 0,
    dodgeActiveTurns: 0,
    hasAllNumberedShards: false,
    hasKey: false,
    isAlive: false,
    gameActive: false,
    movementLocked: false,
    specialAbilityCooldown: 0,
  },

  // UI/Game state for 3D game compatibility
  gameStarted: false,
  showWarning: true,
  showGun: true,
  showCrosshair: true,
  showMapTracker: true,
  position: { x: 400, y: 1.5, z: 400 },
  rotation: 0,
  moving: false,
  velocity: { x: 0, y: 0, z: 0 },
};

// Maximum recent events to keep (for performance)
const MAX_RECENT_EVENTS = 50;

// Create the store
const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Core state setters
      setPlayer: (player) =>
        set((state) => {
          const gameStats = updateGameStats(player);
          const gamePhase = determineGamePhase(player, state.gameSession);
          const canTakeActions = player?.game_active && player?.is_alive;

          return {
            player,
            gameStats,
            gamePhase,
            canTakeActions: canTakeActions || false,
          };
        }),

      setPlayerStats: (playerStats) => {
        const isPlayerInitialized = playerStats !== null;
        set({
          playerStats,
          isPlayerInitialized,
        });
      },

      setGameSession: (gameSession) =>
        set((state) => {
          const gamePhase = determineGamePhase(state.player, gameSession);
          return { gameSession, gamePhase };
        }),

      setGameConfig: (gameConfig) =>
        set({
          gameConfig,
          maxActionsPerTurn: gameConfig ? 3 : 3, // Set default since no actions per turn in new model
        }),

      // World state management
      setCurrentRoom: (currentRoom) => set({ currentRoom }),

      updateRoom: (room) =>
        set((state) => {
          const newRooms = new Map(state.rooms);
          newRooms.set(room.room_id.toString(), room);

          // Update current room if it matches
          const currentRoom =
            state.currentRoom?.room_id.toString() === room.room_id.toString()
              ? room
              : state.currentRoom;

          return { rooms: newRooms, currentRoom };
        }),

      setRooms: (rooms) =>
        set(() => {
          const roomMap = new Map(rooms.map((r) => [r.room_id.toString(), r]));
          return { rooms: roomMap };
        }),
      setNearbyDoors: (nearbyDoors) => set({ nearbyDoors }),
      setEntities: (entities) =>
        set(() => {
          console.log("entities update in zustand", entities);
          return { entities: entities };
        }),

      // Fixed updateEntity - update existing or add new
      updateEntity: (entity) =>
        set((state) => {
          const entityId = entity.entity_id.toString();
          const entities = state.entities.filter(
            (e) => e.entity_id.toString() !== entityId
          );
          return { entities: [...entities, entity] };
        }),

      // Fixed removeEntity - proper ID comparison
      removeEntity: (entityId) =>
        set((state) => ({
          entities: state.entities.filter(
            (e) => e.entity_id.toString() !== entityId.toString()
          ),
        })),

      // Fixed updateShardLocation - update existing or add new
      updateShardLocation: (location) =>
        set((state) => {
          const shardId = location.shard_id.toString();
          const shards = state.shardLocations.filter(
            (s) => s.shard_id.toString() !== shardId
          );
          return { shardLocations: [...shards, location] };
        }),

      // Fixed updateEntityState - update existing or add new
      updateEntityState: (entityState) =>
        set((state) => {
          const entityId = entityState.entity_id.toString();
          const states = state.entityStates.filter(
            (s) => s.entity_id.toString() !== entityId
          );
          return { entityStates: [...states, entityState] };
        }),

      setEntityStates: (states) =>
        set(() => {
          return { entityStates: states };
        }),

      setShardLocations: (locations) =>
        set(() => {
          return { shardLocations: locations };
        }),

      // Game state management
      setGamePhase: (gamePhase) => set({ gamePhase }),
      setPlayerInitialized: (isPlayerInitialized) =>
        set({ isPlayerInitialized }),
      setCanTakeActions: (canTakeActions) => set({ canTakeActions }),
      setActionsThisTurn: (actionsThisTurn) => set({ actionsThisTurn }),
      incrementActionsThisTurn: () =>
        set((state) => ({ actionsThisTurn: state.actionsThisTurn + 1 })),
      resetActionsThisTurn: () => set({ actionsThisTurn: 0 }),

      // Event handling (keep recent events for UI feedback)
      addGameStarted: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            gameStarted: [
              ...state.recentEvents.gameStarted.slice(-MAX_RECENT_EVENTS + 1),
              event,
            ],
          },
          gamePhase: GamePhase.ACTIVE,
        })),

      addGameCompleted: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            gameCompleted: [
              ...state.recentEvents.gameCompleted.slice(-MAX_RECENT_EVENTS + 1),
              event,
            ],
          },
          gamePhase: GamePhase.COMPLETED,
        })),

      addVictoryAchieved: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            victoriesAchieved: [
              ...state.recentEvents.victoriesAchieved.slice(
                -MAX_RECENT_EVENTS + 1
              ),
              event,
            ],
          },
          gamePhase: GamePhase.COMPLETED,
        })),

      addRoomCleared: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            roomsCleared: [
              ...state.recentEvents.roomsCleared.slice(-MAX_RECENT_EVENTS + 1),
              event,
            ],
          },
        })),

      addRoomEntered: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            roomsEntered: [
              ...state.recentEvents.roomsEntered.slice(-MAX_RECENT_EVENTS + 1),
              event,
            ],
          },
        })),

      addRoomExited: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            roomsExited: [
              ...state.recentEvents.roomsExited.slice(-MAX_RECENT_EVENTS + 1),
              event,
            ],
          },
        })),

      addPlayerDeath: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            playerDeaths: [
              ...state.recentEvents.playerDeaths.slice(-MAX_RECENT_EVENTS + 1),
              event,
            ],
          },
          gamePhase: GamePhase.GAME_OVER,
        })),

      addShardCollected: (event) =>
        set((state) => ({
          recentEvents: {
            ...state.recentEvents,
            shardsCollected: [
              ...state.recentEvents.shardsCollected.slice(
                -MAX_RECENT_EVENTS + 1
              ),
              event,
            ],
          },
        })),

      clearRecentEvents: () =>
        set({
          recentEvents: {
            gameStarted: [],
            gameCompleted: [],
            victoriesAchieved: [],
            roomsCleared: [],
            roomsEntered: [],
            roomsExited: [],
            playerDeaths: [],
            shardsCollected: [],
          },
        }),

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLastTransaction: (lastTransaction) => set({ lastTransaction }),
      setActionInProgress: (actionInProgress) => set({ actionInProgress }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

      // Game lifecycle
      initializeGame: () =>
        set({
          gamePhase: GamePhase.INITIALIZED,
          error: null,
          isLoading: true,
        }),

      startNewGame: () =>
        set({
          gamePhase: GamePhase.ACTIVE,
          error: null,
          actionsThisTurn: 0,
        }),

      endGame: () =>
        set({
          gamePhase: GamePhase.COMPLETED,
          canTakeActions: false,
        }),

      respawnPlayer: () =>
        set({
          gamePhase: GamePhase.ACTIVE,
          error: null,
          actionsThisTurn: 0,
        }),

      resetGame: () =>
        set({
          ...initialState,
          connectionStatus: get().connectionStatus, // Keep connection status
        }),

      // UI/Game actions for 3D game compatibility
      // Around line 620, update the startGame action:
      startGame: () =>
        set((state) => {
          console.log("🎮 Starting game UI...");
          console.log("Previous state:", {
            gameStarted: state.gameStarted,
            gamePhase: state.gamePhase,
            playerGameActive: state.player?.game_active,
          });

          const newState = {
            gameStarted: true,
            showWarning: false,
            gamePhase: GamePhase.ACTIVE, // Always set to ACTIVE when starting UI
          };

          console.log("New state:", newState);
          return newState;
        }),

      hideWarning: () => set({ showWarning: false }),
      setShowWarning: (showWarning) => set({ showWarning }),
      setShowGun: (showGun) => set({ showGun }),
      setShowCrosshair: (showCrosshair) => set({ showCrosshair }),
      setShowMapTracker: (showMapTracker) => set({ showMapTracker }),

      updatePosition: (position) =>
        set((state) => {
          // Also update blockchain player position if available
          if (state.player) {
            return {
              position,
              player: {
                ...state.player,
                position: {
                  x: Math.round(position.x),
                  y: Math.round(position.z), // Frontend Z maps to Contract Y
                },
              },
            };
          }
          return { position };
        }),

      updateRotation: (rotation) => set({ rotation }),
      setMoving: (moving) => set({ moving }),
      setVelocity: (velocity) => set({ velocity }),

      // Utility getters
      canMove: () => {
        const state = get();
        return (
          state.canTakeActions &&
          !state.actionInProgress &&
          !state.gameStats.movementLocked &&
          state.gamePhase === GamePhase.ACTIVE &&
          state.actionsThisTurn < state.maxActionsPerTurn
        );
      },

      canAttack: () => {
        const state = get();
        return (
          state.canTakeActions &&
          !state.actionInProgress &&
          state.gamePhase === GamePhase.ACTIVE &&
          state.actionsThisTurn < state.maxActionsPerTurn
        );
      },

      canCollectShard: (roomId: string, shardId: string) => {
        const state = get();
        const shard = state.shardLocations.find(
          (s) => s.shard_id.toString() === shardId
        );

        return (
          state.canTakeActions &&
          !state.actionInProgress &&
          state.gamePhase === GamePhase.ACTIVE &&
          shard &&
          !shard.collected &&
          shard.room_id.toString() === roomId &&
          state.actionsThisTurn < state.maxActionsPerTurn
        );
      },

      getEntitiesInCurrentRoom: () => {
        const state = get();
        if (!state.currentRoom) return [];

        return Array.from(state.entities.values()).filter(
          (entity) =>
            entity.room_id.toString() ===
              state.currentRoom?.room_id.toString() && entity.is_alive
        );
      },

      getShardsInCurrentRoom: () => {
        const state = get();
        if (!state.currentRoom) return [];

        return Array.from(state.shardLocations.values()).filter(
          (shard) =>
            shard.room_id.toString() ===
              state.currentRoom?.room_id.toString() && !shard.collected
        );
      },

      getRoomById: (roomId: string) => {
        const state = get();
        return state.rooms.get(roomId) || null;
      },

      getEntityById: (entityId: string) => {
        const state = get();
        return (
          state.entities.find((e) => e.entity_id.toString() === entityId) ||
          null
        );
      },

      hasNumberedShard: (shardType: models.NumberedShardEnum) => {
        const state = get();
        if (!state.player) return false;

        // This would need to be adapted based on how NumberedShardEnum is structured
        const shardTypeStr = Object.keys(shardType)[0];
        switch (shardTypeStr) {
          case "One":
            return state.player.has_shard_one;
          case "Two":
            return state.player.has_shard_two;
          case "Three":
            return state.player.has_shard_three;
          default:
            return false;
        }
      },

      isRoomCleared: (roomId: string) => {
        const state = get();
        const room = state.rooms.get(roomId);
        return room?.cleared || false;
      },

      getActionsRemaining: () => {
        const state = get();
        return Math.max(0, state.maxActionsPerTurn - state.actionsThisTurn);
      },
    }),
    {
      name: "blockrooms-store",
      partialize: (state) => ({
        // Persist only essential data
        player: state.player,
        playerStats: state.playerStats,
        gameSession: state.gameSession,
        gameConfig: state.gameConfig,
        currentRoom: state.currentRoom,
        isPlayerInitialized: state.isPlayerInitialized,
        gameStats: state.gameStats,
        gamePhase: state.gamePhase,
        // UI state that should persist
        gameStarted: state.gameStarted,
        position: state.position,
      }),
    }
  )
);

export default useAppStore;
export { GamePhase };
export type { AppState, AppActions, AppStore };
