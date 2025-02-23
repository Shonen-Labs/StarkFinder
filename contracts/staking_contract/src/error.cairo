#[derive(Drop)]
pub mod Error {
    pub const NOT_AUTHORIZED: felt252 = 'not authorized';

    // Pool errors
    pub const POOL_NOT_ACTIVE: felt252 = 'pool not active';
    pub const INVALID_POOL_ID: felt252 = 'invalid pool id';
    pub const INVALID_TIME_RANGE: felt252 = 'invalid time range';
    pub const INVALID_STAKE_TOKEN: felt252 = 'invalid stake token';
    pub const INVALID_REWARD_TOKEN: felt252 = 'invalid reward token';
    pub const INVALID_REWARD_RATE: felt252 = 'invalid reward rate';

    // Staking errors
    pub const ZERO_STAKE_AMOUNT: felt252 = 'cannot stake 0';
    pub const INSUFFICIENT_STAKE: felt252 = 'insufficient stake';
    pub const NO_REWARDS_TO_CLAIM: felt252 = 'no rewards to claim';

    // Transfer errors
    pub const STAKE_TRANSFER_FAILED: felt252 = 'stake transfer failed';
    pub const REWARD_TRANSFER_FAILED: felt252 = 'reward transfer failed';
}

