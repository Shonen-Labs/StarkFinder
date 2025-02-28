use starknet::ContractAddress;

#[starknet::interface]
pub trait IConstantProductAmm<TContractState> {
    fn swap(ref self: TContractState, token_in: ContractAddress, amount_in: u256) -> u256;
    fn add_liquidity(ref self: TContractState, amount0: u256, amount1: u256) -> u256;
    fn remove_liquidity(ref self: TContractState, shares: u256) -> (u256, u256);
}

