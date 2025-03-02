use starknet::ContractAddress;
use staking_contract::staking::Staking::PoolInfo;

#[starknet::interface]
pub trait IStaking<TContractState> {
    // Pool management
    fn create_pool(
        ref self: TContractState,
        stake_token: ContractAddress,
        reward_token: ContractAddress,
        reward_rate: u256,
        start_time: u64,
        end_time: u64,
    ) -> u32; // returns pool_id

    // View functions
    fn get_pool_info(self: @TContractState, pool_id: u32) -> PoolInfo;
    fn get_user_stake(self: @TContractState, pool_id: u32, user: ContractAddress) -> u256;
    fn get_rewards(self: @TContractState, pool_id: u32, user: ContractAddress) -> u256;
    fn get_pool_count(self: @TContractState) -> u32;

    // External functions
    fn stake(ref self: TContractState, pool_id: u32, amount: u256);
    fn unstake(ref self: TContractState, pool_id: u32, amount: u256);
    fn claim_rewards(ref self: TContractState, pool_id: u32);

    // admin functions
    fn set_reward_rate(ref self: TContractState, pool_id: u32, new_rate: u256);
    fn end_pool_staking(ref self: TContractState, pool_id: u32);
}
