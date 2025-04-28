use starknet::ContractAddress;

#[starknet::interface]
pub trait IEvolvingNFT<TContractState> {
    // Basic NFT FUnctionality
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u256;
    fn total_supply(self: @TContractState) -> u256;
    fn token_uri(self: @TContractState, token_id: u256) -> felt252;
    fn mint(ref self: TContractState, to: ContractAddress, initial_metadata_hash: felt252) -> u256;

    //Evolution Mechanics
    fn get_evolution_stage(self: @TContractState, token_id: u256) -> u256;
    fn evolve_by_time(ref self: TContractState, token_id: u256);
    fn register_interaction(ref self: TContractState, token_id: u256);


    // Metadata Management
    fn update_metadata(ref self: TContractState, token_id: u256, new_metadata_hash: felt252);
    fn update_metadata_if_condition_met(ref self: TContractState, token_id: u256, new_metadata_hash: felt252, required_stage: u8);




    // Access Control
    fn set_authorized_updater(ref self: TContractState, updater: ContractAddress, authorized: bool);
    fn is_authorized_updater(self: @TContractState, address: ContractAddress) -> bool;
    fn name(self: @ContractState) -> felt252;
    fn symbol(self: @ContractState) -> felt252;
    fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress;
    fn balance_of(self: @ContractState, owner: ContractAddress) -> u256;
    fn total_supply(self: @ContractState) -> u256;
    fn token_uri(self: @ContractState, token_id: u256) -> ByteArray;
    fn mint(ref self: ContractState, to: ContractAddress, initial_metadata_hash: felt252) -> u256;
    fn get_evolution_stage(self: @ContractState, token_id: u256) -> u8;
    fn evolve_by_time(ref self: ContractState, token_id: u256);
    fn register_interaction(ref self: ContractState, token_id: u256);
    fn update_metadata(ref self: ContractState, token_id: u256, new_metadata_hash: felt252);
    fn set_authorized_updater(ref self: ContractState, updater: ContractAddress, authorized: bool);
    fn is_authorized_updater(self: @ContractState, address: ContractAddress) -> bool;
    fn update_metadata_if_conditions_met(ref self: ContractState, token_id: u256, new_metadata_hash: felt252, required_stage: u8);
    
    fn get_metadata_hash(self: @ContractState, token_id: u256) -> felt252;
    fn get_evolution_timestamp(self: @ContractState, token_id: u256) -> u64;
    fn get_interaction_count(self: @ContractState, token_id: u256) -> u32;
    fn set_evolution_stage(ref self: ContractState, token_id: u256, stage: u8);
}