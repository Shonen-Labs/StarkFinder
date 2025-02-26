use starknet::ContractAddress;

#[starknet::interface]
pub trait ITimelock<TContractState> {
    /// Retrieves the lock delay of the Timelock.
    fn lock_delay(self: @TContractState) -> u64;
    /// Sets the lock delay of the Timelock, only callable by owner.
    fn set_lock_delay(ref self: TContractState, lock_delay: u64);
    /// Allows a user to deposit ERC-20 tokens in the Timelock.
    fn deposit(ref self: TContractState, token_address: ContractAddress, amount: u256);
    /// Allows a user to withdraw ERC-20 tokens from the Timelockk.
    fn withdraw(ref self: TContractState, token_address: ContractAddress, amount: u256);
    /// Retrieves the withdrawable balance of a depositor for a specific ERC-20 token.
    fn withdrawable_balance_of(
        self: @TContractState, depositor_address: ContractAddress, token_address: ContractAddress,
    ) -> u256;
    /// Retrieves the balance of a depositor for a specific ERC-20 token.
    fn balance_of(
        self: @TContractState, depositor_address: ContractAddress, token_address: ContractAddress,
    ) -> u256;
}
