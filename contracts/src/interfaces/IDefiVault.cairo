use starknet::ContractAddress;
use starknet::storage::{Map, Vec};

#[starknet::interface]
pub trait IDefiVault<TContractState> {
    /// Allows a user to deposit ERC-20 tokens into the vault.
    fn deposit(ref self: TContractState, token_address: ContractAddress, amount: u256);

    /// Allows a user to withdraw ERC-20 tokens from the vault.
    fn withdraw(ref self: TContractState, token_address: ContractAddress, amount: u256);

    /// Retrieves the balance of a user for a specific ERC-20 token.
    fn get_balance(
        self: @TContractState, user: ContractAddress, token_address: ContractAddress,
    ) -> u256;

    /// Calculates the accumulated yield for a user.
    fn calculate_yield(
        self: @TContractState, user: ContractAddress, token_address: ContractAddress,
    ) -> u256;
}
