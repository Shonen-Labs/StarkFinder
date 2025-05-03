import { Globe, Layers, Grid3X3, FileText, Box } from "lucide-react";

export const dojoBlocks = {
  "World": [
    {
      id: "dojo-world",
      content: "Create World",
      color: "bg-[#2D3748]",
      borderColor: "border-[#4A5568]",
      hoverBorderColor: "hover:border-[#718096]",
      icon: Globe,
      code: `#[starknet::contract]
#[dojo::contract]
mod world {
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        WorldCreated: WorldCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct WorldCreated {
        world_address: ContractAddress,
    }

    #[storage]
    struct Storage {
        // define your storage variables here
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        // Initialize your world here
        self.emit(Event::WorldCreated(WorldCreated { 
            world_address: starknet::get_contract_address() 
        }));
    }
}`,
    }
  ],
  "Namespace": [
    {
      id: "dojo-namespace",
      content: "Create Namespace",
      color: "bg-[#2A4365]",
      borderColor: "border-[#3182CE]",
      hoverBorderColor: "hover:border-[#63B3ED]",
      icon: Layers,
      code: `// Namespace definition
// Used to organize your Dojo resources and permissions
mod namespace {
    use dojo::world;

    fn register_namespace(world: ContractAddress, namespace_name: felt252) {
        // Register a new namespace to the world
        world::register_namespace(world, namespace_name);
    }
}`,
    }
  ],
  "Model": [
    {
      id: "dojo-model-position",
      content: "Position Model",
      color: "bg-[#285E61]",
      borderColor: "border-[#38B2AC]",
      hoverBorderColor: "hover:border-[#4FD1C5]",
      icon: Grid3X3,
      code: `use dojo::model;

#[derive(Model, Copy, Drop, Serde)]
struct Position {
    #[key]
    entity_id: felt252,
    x: u32,
    y: u32,
}`,
    },
    {
      id: "dojo-model-player",
      content: "Player Model",
      color: "bg-[#285E61]",
      borderColor: "border-[#38B2AC]",
      hoverBorderColor: "hover:border-[#4FD1C5]",
      icon: Grid3X3,
      code: `use dojo::model;

#[derive(Model, Copy, Drop, Serde)]
struct Player {
    #[key]
    player_id: felt252,
    health: u16,
    experience: u32,
    level: u8,
}`,
    }
  ],
  "Event": [
    {
      id: "dojo-event",
      content: "Game Event",
      color: "bg-[#44337A]",
      borderColor: "border-[#6B46C1]",
      hoverBorderColor: "hover:border-[#9F7AEA]",
      icon: FileText,
      code: `#[event]
#[derive(Drop, starknet::Event)]
enum GameEvent {
    PlayerMoved: PlayerMoved,
    PlayerAttacked: PlayerAttacked,
}

#[derive(Drop, starknet::Event)]
struct PlayerMoved {
    player_id: felt252,
    x: u32,
    y: u32,
    timestamp: u64,
}

#[derive(Drop, starknet::Event)]
struct PlayerAttacked {
    attacker_id: felt252,
    target_id: felt252,
    damage: u16,
    timestamp: u64,
}`,
    }
  ],
  "Contract": [
    {
      id: "dojo-contract-movement",
      content: "Movement System",
      color: "bg-[#702459]",
      borderColor: "border-[#B83280]",
      hoverBorderColor: "hover:border-[#ED64A6]",
      icon: Box,
      code: `#[starknet::contract]
#[dojo::contract]
mod movement_system {
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use game::models::position::Position;

    #[storage]
    struct Storage {
        world: IWorldDispatcher,
    }

    #[external(v0)]
    fn move(self: @ContractState, entity_id: felt252, x: u32, y: u32) {
        // Get the world dispatcher
        let world = self.world.read();
        
        // Get the current position of the entity
        let position = get!(world, entity_id, Position);
        
        // Update the position
        set!(
            world,
            Position {
                entity_id,
                x,
                y,
            }
        );
        
        // Emit an event if needed
        // emit!(world, PlayerMoved { player_id: entity_id, x, y, timestamp: starknet::get_block_timestamp() });
    }
}`,
    },
    {
      id: "dojo-contract-combat",
      content: "Combat System",
      color: "bg-[#702459]",
      borderColor: "border-[#B83280]",
      hoverBorderColor: "hover:border-[#ED64A6]",
      icon: Box,
      code: `#[starknet::contract]
#[dojo::contract]
mod combat_system {
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use game::models::player::Player;

    #[storage]
    struct Storage {
        world: IWorldDispatcher,
    }

    #[external(v0)]
    fn attack(self: @ContractState, attacker_id: felt252, target_id: felt252, damage: u16) {
        // Get the world dispatcher
        let world = self.world.read();
        
        // Get the target's current stats
        let mut target = get!(world, target_id, Player);
        
        // Apply damage
        if damage >= target.health {
            target.health = 0;
        } else {
            target.health -= damage;
        }
        
        // Update the target's stats
        set!(world, target);
        
        // Emit an event if needed
        // emit!(world, PlayerAttacked { 
        //     attacker_id, 
        //     target_id, 
        //     damage, 
        //     timestamp: starknet::get_block_timestamp() 
        // });
    }
}`,
    }
  ],
};

export default dojoBlocks;