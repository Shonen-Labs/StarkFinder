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
}