import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_attackEntity_calldata = (entityId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "attack_entity",
			calldata: [entityId],
		};
	};

	const actions_attackEntity = async (snAccount: Account | AccountInterface, entityId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_attackEntity_calldata(entityId),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_collectShard_calldata = (shardId: BigNumberish, roomId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "collect_shard",
			calldata: [shardId, roomId],
		};
	};

	const actions_collectShard = async (snAccount: Account | AccountInterface, shardId: BigNumberish, roomId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_collectShard_calldata(shardId, roomId),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_endGame_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "end_game",
			calldata: [],
		};
	};

	const actions_endGame = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_endGame_calldata(),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_enterDoor_calldata = (doorId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "enter_door",
			calldata: [doorId],
		};
	};

	const actions_enterDoor = async (snAccount: Account | AccountInterface, doorId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_enterDoor_calldata(doorId),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_exitDoor_calldata = (doorId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "exit_door",
			calldata: [doorId],
		};
	};

	const actions_exitDoor = async (snAccount: Account | AccountInterface, doorId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_exitDoor_calldata(doorId),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getEntitiesInRoom_calldata = (roomId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_entities_in_room",
			calldata: [roomId],
		};
	};

	const actions_getEntitiesInRoom = async (roomId: BigNumberish) => {
		try {
			return await provider.call("blockrooms", build_actions_getEntitiesInRoom_calldata(roomId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getGameStatus_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_game_status",
			calldata: [],
		};
	};

	const actions_getGameStatus = async () => {
		try {
			return await provider.call("blockrooms", build_actions_getGameStatus_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getNearbyDoors_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_nearby_doors",
			calldata: [],
		};
	};

	const actions_getNearbyDoors = async () => {
		try {
			return await provider.call("blockrooms", build_actions_getNearbyDoors_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getPlayerState_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_player_state",
			calldata: [],
		};
	};

	const actions_getPlayerState = async () => {
		try {
			return await provider.call("blockrooms", build_actions_getPlayerState_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getRoomState_calldata = (roomId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_room_state",
			calldata: [roomId],
		};
	};

	const actions_getRoomState = async (roomId: BigNumberish) => {
		try {
			return await provider.call("blockrooms", build_actions_getRoomState_calldata(roomId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getShardsInRoom_calldata = (roomId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_shards_in_room",
			calldata: [roomId],
		};
	};

	const actions_getShardsInRoom = async (roomId: BigNumberish) => {
		try {
			return await provider.call("blockrooms", build_actions_getShardsInRoom_calldata(roomId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_initializePlayer_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "initialize_player",
			calldata: [],
		};
	};

	const actions_initializePlayer = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_initializePlayer_calldata(),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_movePlayer_calldata = (xDelta: BigNumberish, yDelta: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "move_player",
			calldata: [xDelta, yDelta],
		};
	};

	const actions_movePlayer = async (snAccount: Account | AccountInterface, xDelta: BigNumberish, yDelta: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_movePlayer_calldata(xDelta, yDelta),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_respawnPlayer_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "respawn_player",
			calldata: [],
		};
	};

	const actions_respawnPlayer = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_respawnPlayer_calldata(),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_startGame_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "start_game",
			calldata: [],
		};
	};

	const actions_startGame = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_startGame_calldata(),
				"blockrooms",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			attackEntity: actions_attackEntity,
			buildAttackEntityCalldata: build_actions_attackEntity_calldata,
			collectShard: actions_collectShard,
			buildCollectShardCalldata: build_actions_collectShard_calldata,
			endGame: actions_endGame,
			buildEndGameCalldata: build_actions_endGame_calldata,
			enterDoor: actions_enterDoor,
			buildEnterDoorCalldata: build_actions_enterDoor_calldata,
			exitDoor: actions_exitDoor,
			buildExitDoorCalldata: build_actions_exitDoor_calldata,
			getEntitiesInRoom: actions_getEntitiesInRoom,
			buildGetEntitiesInRoomCalldata: build_actions_getEntitiesInRoom_calldata,
			getGameStatus: actions_getGameStatus,
			buildGetGameStatusCalldata: build_actions_getGameStatus_calldata,
			getNearbyDoors: actions_getNearbyDoors,
			buildGetNearbyDoorsCalldata: build_actions_getNearbyDoors_calldata,
			getPlayerState: actions_getPlayerState,
			buildGetPlayerStateCalldata: build_actions_getPlayerState_calldata,
			getRoomState: actions_getRoomState,
			buildGetRoomStateCalldata: build_actions_getRoomState_calldata,
			getShardsInRoom: actions_getShardsInRoom,
			buildGetShardsInRoomCalldata: build_actions_getShardsInRoom_calldata,
			initializePlayer: actions_initializePlayer,
			buildInitializePlayerCalldata: build_actions_initializePlayer_calldata,
			movePlayer: actions_movePlayer,
			buildMovePlayerCalldata: build_actions_movePlayer_calldata,
			respawnPlayer: actions_respawnPlayer,
			buildRespawnPlayerCalldata: build_actions_respawnPlayer_calldata,
			startGame: actions_startGame,
			buildStartGameCalldata: build_actions_startGame_calldata,
		},
	};
}