use starknet::ContractAddress;
use core::array::Array;

#[derive(Drop, Copy, PartialEq, Serde, starknet::Store)]
pub struct Proposal {
    pub id: u256,
    pub title: felt252,
    pub description: felt252,
    pub proposer: ContractAddress,
    pub creation_time: u64,
    pub execution_delay: u64,
    pub threshold: u256,
    pub yes_votes: u256,
    pub no_votes: u256,
    pub executed: bool,
    pub active: bool,
}

#[derive(Drop, Copy, PartialEq, Serde, starknet::Store)]
pub struct Delegation {
    pub delegator: ContractAddress,
    pub delegate: ContractAddress,
    pub proposal_category: felt252, // Category-specific delegation
    pub weight: u256,
    pub is_active: bool,
}

#[derive(Drop, Copy, PartialEq, Serde, starknet::Store)]
pub struct Vote {
    pub voter: ContractAddress,
    pub proposal_id: u256,
    pub support: bool, // true for yes, false for no
    pub weight: u256,
    pub timestamp: u64,
}

#[derive(Drop, Copy, PartialEq, Serde, starknet::Store)]
pub struct VotingPower {
    pub direct_power: u256,
    pub delegated_power: u256,
    pub total_power: u256,
}

#[starknet::interface]
pub trait ILiquidDemocracyDAO<TContractState> {
    // Delegation functions
    fn delegate_vote(
        ref self: TContractState,
        delegate: ContractAddress,
        category: felt252,
        weight: u256
    );
    fn revoke_delegation(ref self: TContractState, delegate: ContractAddress, category: felt252);
    fn get_delegation(
        self: @TContractState,
        delegator: ContractAddress,
        delegate: ContractAddress,
        category: felt252
    ) -> Delegation;
    fn get_voting_power(self: @TContractState, voter: ContractAddress, proposal_id: u256) -> VotingPower;
    fn get_delegated_to(self: @TContractState, delegate: ContractAddress, category: felt252) -> Array<ContractAddress>;

    // Proposal functions
    fn create_proposal(
        ref self: TContractState,
        title: felt252,
        description: felt252,
        category: felt252,
        execution_delay: u64
    ) -> u256;
    fn vote_on_proposal(ref self: TContractState, proposal_id: u256, support: bool);
    fn execute_proposal(ref self: TContractState, proposal_id: u256);
    fn get_proposal(self: @TContractState, proposal_id: u256) -> Proposal;
    fn get_vote(self: @TContractState, voter: ContractAddress, proposal_id: u256) -> Vote;

    // DAO management
    fn set_proposal_threshold(ref self: TContractState, threshold: u256);
    fn set_execution_delay(ref self: TContractState, delay: u64);
    fn get_proposal_count(self: @TContractState) -> u256;
    fn is_proposal_executable(self: @TContractState, proposal_id: u256) -> bool;

    // Token functions for voting power
    fn mint_voting_tokens(ref self: TContractState, to: ContractAddress, amount: u256);
    fn get_token_balance(self: @TContractState, account: ContractAddress) -> u256;
} 