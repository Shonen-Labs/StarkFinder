import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

// Type definition for `blockrooms::models::Entity` struct
export interface Entity {
	entity_id: BigNumberish;
	entity_type: EntityTypeEnum;
	room_id: BigNumberish;
	health: BigNumberish;
	max_health: BigNumberish;
	is_alive: boolean;
	damage_per_turn: BigNumberish;
	drops_numbered_shard: CairoOption<NumberedShardEnum>;
}

// Type definition for `blockrooms::models::EntityState` struct
export interface EntityState {
	entity_id: BigNumberish;
	alert_level: AlertLevelEnum;
	last_action_block: BigNumberish;
}

// Type definition for `blockrooms::models::EntityStateValue` struct
export interface EntityStateValue {
	alert_level: AlertLevelEnum;
	last_action_block: BigNumberish;
}

// Type definition for `blockrooms::models::EntityValue` struct
export interface EntityValue {
	entity_type: EntityTypeEnum;
	room_id: BigNumberish;
	health: BigNumberish;
	max_health: BigNumberish;
	is_alive: boolean;
	damage_per_turn: BigNumberish;
	drops_numbered_shard: CairoOption<NumberedShardEnum>;
}

// Type definition for `blockrooms::models::GameConfig` struct
export interface GameConfig {
	config_id: BigNumberish;
	grid_size: BigNumberish;
	starting_health: BigNumberish;
	starting_shards: BigNumberish;
	base_damage: BigNumberish;
	entity_spawn_rate: BigNumberish;
	shard_drop_rate: BigNumberish;
	male_entity_damage: BigNumberish;
	female_entity_damage: BigNumberish;
	door_detection_range: BigNumberish;
}

// Type definition for `blockrooms::models::GameConfigValue` struct
export interface GameConfigValue {
	grid_size: BigNumberish;
	starting_health: BigNumberish;
	starting_shards: BigNumberish;
	base_damage: BigNumberish;
	entity_spawn_rate: BigNumberish;
	shard_drop_rate: BigNumberish;
	male_entity_damage: BigNumberish;
	female_entity_damage: BigNumberish;
	door_detection_range: BigNumberish;
}

// Type definition for `blockrooms::models::GameSession` struct
export interface GameSession {
	session_id: BigNumberish;
	player_id: string;
	start_time: BigNumberish;
	end_time: BigNumberish;
	rooms_cleared: BigNumberish;
	total_shards_collected: BigNumberish;
	numbered_shards_collected: BigNumberish;
	entities_defeated: BigNumberish;
	total_damage_dealt: BigNumberish;
	total_damage_taken: BigNumberish;
	doors_opened: BigNumberish;
	deaths: BigNumberish;
	session_complete: boolean;
	total_actions: BigNumberish;
	victory_achieved: boolean;
}

// Type definition for `blockrooms::models::GameSessionValue` struct
export interface GameSessionValue {
	player_id: string;
	start_time: BigNumberish;
	end_time: BigNumberish;
	rooms_cleared: BigNumberish;
	total_shards_collected: BigNumberish;
	numbered_shards_collected: BigNumberish;
	entities_defeated: BigNumberish;
	total_damage_dealt: BigNumberish;
	total_damage_taken: BigNumberish;
	doors_opened: BigNumberish;
	deaths: BigNumberish;
	session_complete: boolean;
	total_actions: BigNumberish;
	victory_achieved: boolean;
}

// Type definition for `blockrooms::models::Player` struct
export interface Player {
	player_id: string;
	position: Position;
	current_room: BigNumberish;
	health: BigNumberish;
	max_health: BigNumberish;
	shards: BigNumberish;
	game_active: boolean;
	is_alive: boolean;
	current_session_id: BigNumberish;
	rooms_cleared: BigNumberish;
	has_shard_one: boolean;
	has_shard_two: boolean;
	has_shard_three: boolean;
	special_ability_cooldown: BigNumberish;
	has_key: boolean;
}

// Type definition for `blockrooms::models::PlayerStats` struct
export interface PlayerStats {
	player_id: string;
	games_played: BigNumberish;
	games_won: BigNumberish;
	total_shards_collected: BigNumberish;
	total_entities_defeated: BigNumberish;
	total_playtime: BigNumberish;
	best_completion_time: BigNumberish;
	highest_room_reached: BigNumberish;
	total_damage_dealt: BigNumberish;
	total_damage_taken: BigNumberish;
	doors_opened: BigNumberish;
	total_actions_taken: BigNumberish;
	numbered_shards_collected: BigNumberish;
}

// Type definition for `blockrooms::models::PlayerStatsValue` struct
export interface PlayerStatsValue {
	games_played: BigNumberish;
	games_won: BigNumberish;
	total_shards_collected: BigNumberish;
	total_entities_defeated: BigNumberish;
	total_playtime: BigNumberish;
	best_completion_time: BigNumberish;
	highest_room_reached: BigNumberish;
	total_damage_dealt: BigNumberish;
	total_damage_taken: BigNumberish;
	doors_opened: BigNumberish;
	total_actions_taken: BigNumberish;
	numbered_shards_collected: BigNumberish;
}

// Type definition for `blockrooms::models::PlayerValue` struct
export interface PlayerValue {
	position: Position;
	current_room: BigNumberish;
	health: BigNumberish;
	max_health: BigNumberish;
	shards: BigNumberish;
	game_active: boolean;
	is_alive: boolean;
	current_session_id: BigNumberish;
	rooms_cleared: BigNumberish;
	has_shard_one: boolean;
	has_shard_two: boolean;
	has_shard_three: boolean;
	special_ability_cooldown: BigNumberish;
	has_key: boolean;
}

// Type definition for `blockrooms::models::Position` struct
export interface Position {
	x: BigNumberish;
	y: BigNumberish;
}

// Type definition for `blockrooms::models::Room` struct
export interface Room {
	room_id: BigNumberish;
	initialized: boolean;
	cleared: boolean;
	entity_count: BigNumberish;
	active_entities: BigNumberish;
	has_treasure: boolean;
	treasure_collected: boolean;
}

// Type definition for `blockrooms::models::RoomValue` struct
export interface RoomValue {
	initialized: boolean;
	cleared: boolean;
	entity_count: BigNumberish;
	active_entities: BigNumberish;
	has_treasure: boolean;
	treasure_collected: boolean;
}

// Type definition for `blockrooms::models::ShardLocation` struct
export interface ShardLocation {
	shard_id: BigNumberish;
	room_id: BigNumberish;
	numbered_shard: CairoOption<NumberedShardEnum>;
	collected: boolean;
}

// Type definition for `blockrooms::models::ShardLocationValue` struct
export interface ShardLocationValue {
	room_id: BigNumberish;
	numbered_shard: CairoOption<NumberedShardEnum>;
	collected: boolean;
}

// Type definition for `blockrooms::systems::actions::actions::GameCompleted` struct
export interface GameCompleted {
	player_id: string;
	session_id: BigNumberish;
	rooms_cleared: BigNumberish;
	result: GameResultEnum;
}

// Type definition for `blockrooms::systems::actions::actions::GameCompletedValue` struct
export interface GameCompletedValue {
	session_id: BigNumberish;
	rooms_cleared: BigNumberish;
	result: GameResultEnum;
}

// Type definition for `blockrooms::systems::actions::actions::GameStarted` struct
export interface GameStarted {
	player_id: string;
	session_id: BigNumberish;
	start_time: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::GameStartedValue` struct
export interface GameStartedValue {
	session_id: BigNumberish;
	start_time: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::NumberedShardCollected` struct
export interface NumberedShardCollected {
	player_id: string;
	shard_type: NumberedShardEnum;
	room_id: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::NumberedShardCollectedValue` struct
export interface NumberedShardCollectedValue {
	shard_type: NumberedShardEnum;
	room_id: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::PlayerDeath` struct
export interface PlayerDeath {
	player_id: string;
	room_id: BigNumberish;
	cause: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::PlayerDeathValue` struct
export interface PlayerDeathValue {
	room_id: BigNumberish;
	cause: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::RoomCleared` struct
export interface RoomCleared {
	player_id: string;
	room_id: BigNumberish;
	entities_defeated: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::RoomClearedValue` struct
export interface RoomClearedValue {
	room_id: BigNumberish;
	entities_defeated: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::RoomEntered` struct
export interface RoomEntered {
	player_id: string;
	room_id: BigNumberish;
	door_id: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::RoomEnteredValue` struct
export interface RoomEnteredValue {
	room_id: BigNumberish;
	door_id: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::RoomExited` struct
export interface RoomExited {
	player_id: string;
	room_id: BigNumberish;
	door_id: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::RoomExitedValue` struct
export interface RoomExitedValue {
	room_id: BigNumberish;
	door_id: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::VictoryAchieved` struct
export interface VictoryAchieved {
	player_id: string;
	session_id: BigNumberish;
	completion_time: BigNumberish;
}

// Type definition for `blockrooms::systems::actions::actions::VictoryAchievedValue` struct
export interface VictoryAchievedValue {
	session_id: BigNumberish;
	completion_time: BigNumberish;
}

// Type definition for `blockrooms::models::AlertLevel` enum
export const alertLevel = [
	'Idle',
	'Alerted',
	'Combat',
] as const;
export type AlertLevel = { [key in typeof alertLevel[number]]: string };
export type AlertLevelEnum = CairoCustomEnum;

// Type definition for `blockrooms::models::EntityType` enum
export const entityType = [
	'Male',
	'Female',
] as const;
export type EntityType = { [key in typeof entityType[number]]: string };
export type EntityTypeEnum = CairoCustomEnum;

// Type definition for `blockrooms::models::NumberedShard` enum
export const numberedShard = [
	'One',
	'Two',
	'Three',
] as const;
export type NumberedShard = { [key in typeof numberedShard[number]]: string };
export type NumberedShardEnum = CairoCustomEnum;

// Type definition for `blockrooms::models::GameResult` enum
export const gameResult = [
	'InProgress',
	'Victory',
	'Defeat',
] as const;
export type GameResult = { [key in typeof gameResult[number]]: string };
export type GameResultEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	blockrooms: {
		Entity: Entity,
		EntityState: EntityState,
		EntityStateValue: EntityStateValue,
		EntityValue: EntityValue,
		GameConfig: GameConfig,
		GameConfigValue: GameConfigValue,
		GameSession: GameSession,
		GameSessionValue: GameSessionValue,
		Player: Player,
		PlayerStats: PlayerStats,
		PlayerStatsValue: PlayerStatsValue,
		PlayerValue: PlayerValue,
		Position: Position,
		Room: Room,
		RoomValue: RoomValue,
		ShardLocation: ShardLocation,
		ShardLocationValue: ShardLocationValue,
		GameCompleted: GameCompleted,
		GameCompletedValue: GameCompletedValue,
		GameStarted: GameStarted,
		GameStartedValue: GameStartedValue,
		NumberedShardCollected: NumberedShardCollected,
		NumberedShardCollectedValue: NumberedShardCollectedValue,
		PlayerDeath: PlayerDeath,
		PlayerDeathValue: PlayerDeathValue,
		RoomCleared: RoomCleared,
		RoomClearedValue: RoomClearedValue,
		RoomEntered: RoomEntered,
		RoomEnteredValue: RoomEnteredValue,
		RoomExited: RoomExited,
		RoomExitedValue: RoomExitedValue,
		VictoryAchieved: VictoryAchieved,
		VictoryAchievedValue: VictoryAchievedValue,
	},
}
export const schema: SchemaType = {
	blockrooms: {
		Entity: {
			entity_id: 0,
		entity_type: new CairoCustomEnum({ 
					Male: "",
				Female: undefined, }),
			room_id: 0,
			health: 0,
			max_health: 0,
			is_alive: false,
			damage_per_turn: 0,
		drops_numbered_shard: new CairoOption(CairoOptionVariant.None),
		},
		EntityState: {
			entity_id: 0,
		alert_level: new CairoCustomEnum({ 
					Idle: "",
				Alerted: undefined,
				Combat: undefined, }),
			last_action_block: 0,
		},
		EntityStateValue: {
		alert_level: new CairoCustomEnum({ 
					Idle: "",
				Alerted: undefined,
				Combat: undefined, }),
			last_action_block: 0,
		},
		EntityValue: {
		entity_type: new CairoCustomEnum({ 
					Male: "",
				Female: undefined, }),
			room_id: 0,
			health: 0,
			max_health: 0,
			is_alive: false,
			damage_per_turn: 0,
		drops_numbered_shard: new CairoOption(CairoOptionVariant.None),
		},
		GameConfig: {
			config_id: 0,
			grid_size: 0,
			starting_health: 0,
			starting_shards: 0,
			base_damage: 0,
			entity_spawn_rate: 0,
			shard_drop_rate: 0,
			male_entity_damage: 0,
			female_entity_damage: 0,
			door_detection_range: 0,
		},
		GameConfigValue: {
			grid_size: 0,
			starting_health: 0,
			starting_shards: 0,
			base_damage: 0,
			entity_spawn_rate: 0,
			shard_drop_rate: 0,
			male_entity_damage: 0,
			female_entity_damage: 0,
			door_detection_range: 0,
		},
		GameSession: {
			session_id: 0,
			player_id: "",
			start_time: 0,
			end_time: 0,
			rooms_cleared: 0,
			total_shards_collected: 0,
			numbered_shards_collected: 0,
			entities_defeated: 0,
			total_damage_dealt: 0,
			total_damage_taken: 0,
			doors_opened: 0,
			deaths: 0,
			session_complete: false,
			total_actions: 0,
			victory_achieved: false,
		},
		GameSessionValue: {
			player_id: "",
			start_time: 0,
			end_time: 0,
			rooms_cleared: 0,
			total_shards_collected: 0,
			numbered_shards_collected: 0,
			entities_defeated: 0,
			total_damage_dealt: 0,
			total_damage_taken: 0,
			doors_opened: 0,
			deaths: 0,
			session_complete: false,
			total_actions: 0,
			victory_achieved: false,
		},
		Player: {
			player_id: "",
		position: { x: 0, y: 0, },
			current_room: 0,
			health: 0,
			max_health: 0,
			shards: 0,
			game_active: false,
			is_alive: false,
			current_session_id: 0,
			rooms_cleared: 0,
			has_shard_one: false,
			has_shard_two: false,
			has_shard_three: false,
			special_ability_cooldown: 0,
			has_key: false,
		},
		PlayerStats: {
			player_id: "",
			games_played: 0,
			games_won: 0,
			total_shards_collected: 0,
			total_entities_defeated: 0,
			total_playtime: 0,
			best_completion_time: 0,
			highest_room_reached: 0,
			total_damage_dealt: 0,
			total_damage_taken: 0,
			doors_opened: 0,
			total_actions_taken: 0,
			numbered_shards_collected: 0,
		},
		PlayerStatsValue: {
			games_played: 0,
			games_won: 0,
			total_shards_collected: 0,
			total_entities_defeated: 0,
			total_playtime: 0,
			best_completion_time: 0,
			highest_room_reached: 0,
			total_damage_dealt: 0,
			total_damage_taken: 0,
			doors_opened: 0,
			total_actions_taken: 0,
			numbered_shards_collected: 0,
		},
		PlayerValue: {
		position: { x: 0, y: 0, },
			current_room: 0,
			health: 0,
			max_health: 0,
			shards: 0,
			game_active: false,
			is_alive: false,
			current_session_id: 0,
			rooms_cleared: 0,
			has_shard_one: false,
			has_shard_two: false,
			has_shard_three: false,
			special_ability_cooldown: 0,
			has_key: false,
		},
		Position: {
			x: 0,
			y: 0,
		},
		Room: {
			room_id: 0,
			initialized: false,
			cleared: false,
			entity_count: 0,
			active_entities: 0,
			has_treasure: false,
			treasure_collected: false,
		},
		RoomValue: {
			initialized: false,
			cleared: false,
			entity_count: 0,
			active_entities: 0,
			has_treasure: false,
			treasure_collected: false,
		},
		ShardLocation: {
			shard_id: 0,
			room_id: 0,
		numbered_shard: new CairoOption(CairoOptionVariant.None),
			collected: false,
		},
		ShardLocationValue: {
			room_id: 0,
		numbered_shard: new CairoOption(CairoOptionVariant.None),
			collected: false,
		},
		GameCompleted: {
			player_id: "",
			session_id: 0,
			rooms_cleared: 0,
		result: new CairoCustomEnum({ 
					InProgress: "",
				Victory: undefined,
				Defeat: undefined, }),
		},
		GameCompletedValue: {
			session_id: 0,
			rooms_cleared: 0,
		result: new CairoCustomEnum({ 
					InProgress: "",
				Victory: undefined,
				Defeat: undefined, }),
		},
		GameStarted: {
			player_id: "",
			session_id: 0,
			start_time: 0,
		},
		GameStartedValue: {
			session_id: 0,
			start_time: 0,
		},
		NumberedShardCollected: {
			player_id: "",
		shard_type: new CairoCustomEnum({ 
					One: "",
				Two: undefined,
				Three: undefined, }),
			room_id: 0,
		},
		NumberedShardCollectedValue: {
		shard_type: new CairoCustomEnum({ 
					One: "",
				Two: undefined,
				Three: undefined, }),
			room_id: 0,
		},
		PlayerDeath: {
			player_id: "",
			room_id: 0,
			cause: 0,
		},
		PlayerDeathValue: {
			room_id: 0,
			cause: 0,
		},
		RoomCleared: {
			player_id: "",
			room_id: 0,
			entities_defeated: 0,
		},
		RoomClearedValue: {
			room_id: 0,
			entities_defeated: 0,
		},
		RoomEntered: {
			player_id: "",
			room_id: 0,
			door_id: 0,
		},
		RoomEnteredValue: {
			room_id: 0,
			door_id: 0,
		},
		RoomExited: {
			player_id: "",
			room_id: 0,
			door_id: 0,
		},
		RoomExitedValue: {
			room_id: 0,
			door_id: 0,
		},
		VictoryAchieved: {
			player_id: "",
			session_id: 0,
			completion_time: 0,
		},
		VictoryAchievedValue: {
			session_id: 0,
			completion_time: 0,
		},
	},
};
export enum ModelsMapping {
	AlertLevel = 'blockrooms-AlertLevel',
	Entity = 'blockrooms-Entity',
	EntityState = 'blockrooms-EntityState',
	EntityStateValue = 'blockrooms-EntityStateValue',
	EntityType = 'blockrooms-EntityType',
	EntityValue = 'blockrooms-EntityValue',
	GameConfig = 'blockrooms-GameConfig',
	GameConfigValue = 'blockrooms-GameConfigValue',
	GameSession = 'blockrooms-GameSession',
	GameSessionValue = 'blockrooms-GameSessionValue',
	NumberedShard = 'blockrooms-NumberedShard',
	Player = 'blockrooms-Player',
	PlayerStats = 'blockrooms-PlayerStats',
	PlayerStatsValue = 'blockrooms-PlayerStatsValue',
	PlayerValue = 'blockrooms-PlayerValue',
	Position = 'blockrooms-Position',
	Room = 'blockrooms-Room',
	RoomValue = 'blockrooms-RoomValue',
	ShardLocation = 'blockrooms-ShardLocation',
	ShardLocationValue = 'blockrooms-ShardLocationValue',
	GameResult = 'blockrooms-GameResult',
	GameCompleted = 'blockrooms-GameCompleted',
	GameCompletedValue = 'blockrooms-GameCompletedValue',
	GameStarted = 'blockrooms-GameStarted',
	GameStartedValue = 'blockrooms-GameStartedValue',
	NumberedShardCollected = 'blockrooms-NumberedShardCollected',
	NumberedShardCollectedValue = 'blockrooms-NumberedShardCollectedValue',
	PlayerDeath = 'blockrooms-PlayerDeath',
	PlayerDeathValue = 'blockrooms-PlayerDeathValue',
	RoomCleared = 'blockrooms-RoomCleared',
	RoomClearedValue = 'blockrooms-RoomClearedValue',
	RoomEntered = 'blockrooms-RoomEntered',
	RoomEnteredValue = 'blockrooms-RoomEnteredValue',
	RoomExited = 'blockrooms-RoomExited',
	RoomExitedValue = 'blockrooms-RoomExitedValue',
	VictoryAchieved = 'blockrooms-VictoryAchieved',
	VictoryAchievedValue = 'blockrooms-VictoryAchievedValue',
}