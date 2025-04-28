#[starknet::contract]
mod EvolvingNFT {
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Map, StorageMapReadAccess, StorageMapWriteAccess
    };
    use contracts::interfaces::IERC721::{IERC721Dispatcher, IERC721DispatcherTrait};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};



    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        owners: Map<u256, ContractAddress>,
        balances: Map<ContractAddress, u256>,
        total_supply: u256,
        token_metadata: Map<u256, felt252>,
        evolution_stages: Map<u256, u8>,
        evolution_timestamps: Map<u256, u64>,
        interaction_counts: Map<u256, u32>,
        authorized_updaters: Map<ContractAddress, bool>,
        token_id_counter: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        MetadataUpdated: MetadataUpdated,
        EvolutionStageChanged: EvolutionStageChanged,
        InteractionRegistered: InteractionRegistered,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct MetadataUpdated {
        token_id: u256,
        new_metadata_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct EvolutionStageChanged {
        token_id: u256,
        new_stage: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct InteractionRegistered {
        token_id: u256,
        interaction_count: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, name_: felt252, symbol_: felt252) {
        self.name.write(name_);
        self.symbol.write(symbol_);
        self.token_id_counter.write(0);
    }

    #[abi(embed_v0)]
    impl EvolvingNFTImpl of super::IEvolvingNFT<ContractState> {
        // Basic NFT Functionality
        fn name(self: @ContractState) -> felt252 {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> felt252 {
            self.symbol.read()
        }

        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let owner = self.owners.read(token_id);
            assert(owner.is_non_zero(), 'Token does not exist');
            owner
        }

        fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
            assert(owner.is_non_zero(), 'Invalid address');
            self.balances.read(owner)
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            let metadata_hash = self.token_metadata.read(token_id);
            // Convert metadata hash to string for URI
            metadata_hash.to_string()
        }

        fn mint(ref self: ContractState, to: ContractAddress, initial_metadata_hash: felt252) -> u256 {
            assert(to.is_non_zero(), 'Invalid recipient');
            let token_id = self.token_id_counter.read() + 1;
            self.token_id_counter.write(token_id);

            self.owners.write(token_id, to);
            self.balances.write(to, self.balances.read(to) + 1);
            self.total_supply.write(self.total_supply.read() + 1);
            self.token_metadata.write(token_id, initial_metadata_hash);
            self.evolution_stages.write(token_id, 0);
            self.evolution_timestamps.write(token_id, get_block_timestamp());
            self.interaction_counts.write(token_id, 0);

            self.emit(Transfer { from: Zeroable::zero(), to, token_id });
            self.emit(MetadataUpdated { token_id, new_metadata_hash: initial_metadata_hash });
            token_id
        }

        // Evolution Mechanics
        fn get_evolution_stage(self: @ContractState, token_id: u256) -> u8 {
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            self.evolution_stages.read(token_id)
        }

        fn evolve_by_time(ref self: ContractState, token_id: u256) {
            let owner = self.owners.read(token_id);
            assert(owner.is_non_zero(), 'Token does not exist');
            let current_stage = self.evolution_stages.read(token_id);
            let last_evolution = self.evolution_timestamps.read(token_id);
            let current_time = get_block_timestamp();

            // Example: Evolve every 1 day (86400 seconds)
            if current_time >= last_evolution + 86400 && current_stage < 255 {
                let new_stage = current_stage + 1;
                self.evolution_stages.write(token_id, new_stage);
                self.evolution_timestamps.write(token_id, current_time);
                self.emit(EvolutionStageChanged { token_id, new_stage });
            }
        }

        fn register_interaction(ref self: ContractState, token_id: u256) {
            let owner = self.owners.read(token_id);
            assert(owner.is_non_zero(), 'Token does not exist');
            let new_count = self.interaction_counts.read(token_id) + 1;
            self.interaction_counts.write(token_id, new_count);
            self.emit(InteractionRegistered { token_id, interaction_count: new_count });

            // Optional: Trigger evolution based on interactions
            let current_stage = self.evolution_stages.read(token_id);
            if new_count % 10 == 0 && current_stage < 255 {
                let new_stage = current_stage + 1;
                self.evolution_stages.write(token_id, new_stage);
                self.evolution_timestamps.write(token_id, get_block_timestamp());
                self.emit(EvolutionStageChanged { token_id, new_stage });
            }
        }

        // Metadata Management
        fn update_metadata(ref self: ContractState, token_id: u256, new_metadata_hash: felt252) {
            let caller = get_caller_address();
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            assert(self.is_authorized_updater(caller), 'Unauthorized updater');
            self.token_metadata.write(token_id, new_metadata_hash);
            self.emit(MetadataUpdated { token_id, new_metadata_hash });
        }

        fn update_metadata_if_conditions_met(
            ref self: ContractState,
            token_id: u256,
            new_metadata_hash: felt252,
            required_stage: u8
        ) {
            let caller = get_caller_address();
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            assert(self.is_authorized_updater(caller), 'Unauthorized updater');
            let current_stage = self.evolution_stages.read(token_id);
            assert(current_stage >= required_stage, 'Stage requirement not met');
            self.token_metadata.write(token_id, new_metadata_hash);
            self.emit(MetadataUpdated { token_id, new_metadata_hash });
        }

        // Access Control
        fn set_authorized_updater(ref self: ContractState, updater: ContractAddress, authorized: bool) {
            // In practice, add ownership check
            assert(updater.is_non_zero(), 'Invalid address');
            self.authorized_updaters.write(updater, authorized);
        }

        fn is_authorized_updater(self: @ContractState, address: ContractAddress) -> bool {
            self.authorized_updaters.read(address)
        }

        // Additional Getters
        fn get_metadata_hash(self: @ContractState, token_id: u256) -> felt252 {
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            self.token_metadata.read(token_id)
        }

        fn get_evolution_timestamp(self: @ContractState, token_id: u256) -> u64 {
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            self.evolution_timestamps.read(token_id)
        }

        fn get_interaction_count(self: @ContractState, token_id: u256) -> u32 {
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            self.interaction_counts.read(token_id)
        }

        fn set_evolution_stage(ref self: ContractState, token_id: u256, stage: u8) {
            let caller = get_caller_address();
            assert(self.owners.read(token_id).is_non_zero(), 'Token does not exist');
            assert(self.is_authorized_updater(caller), 'Unauthorized updater');
            self.evolution_stages.write(token_id, stage);
            self.evolution_timestamps.write(token_id, get_block_timestamp());
            self.emit(EvolutionStageChanged { token_id, new_stage: stage });
        }
    }
}