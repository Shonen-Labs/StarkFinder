use snforge_std::DeclareResultTrait;
use starknet::{ContractAddress, get_block_timestamp};
use snforge_std::{
    declare, ContractClassTrait, start_cheat_caller_address, stop_cheat_caller_address,
    start_cheat_block_timestamp_global, stop_cheat_block_timestamp_global,
};
use staking_contract::interfaces::{
    staking::{IStakingDispatcher, IStakingDispatcherTrait},
    ierc20::{IERC20Dispatcher, IERC20DispatcherTrait},
};

const ONE_E18: u256 = 1000000000000000000_u256;

fn deploy_token(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    address
}

fn deploy_staking(owner: ContractAddress) -> ContractAddress {
    let contract = declare("Staking").unwrap().contract_class();
    let mut calldata = ArrayTrait::new();
    calldata.append(owner.into());
    let (address, _) = contract.deploy(@calldata).unwrap();
    address
}

#[test]
fn test_create_and_stake() {
    let owner = starknet::contract_address_const::<0x123>();
    let user = starknet::contract_address_const::<0x456>();

    // Deploy contracts
    let stake_token = deploy_token("StakingToken");
    let reward_token = deploy_token("RewardToken");
    let staking = deploy_staking(owner);

    let staking_contract = IStakingDispatcher { contract_address: staking };
    let stake_token_contract = IERC20Dispatcher { contract_address: stake_token };
    let reward_token_contract = IERC20Dispatcher { contract_address: reward_token };

    // Setup tokens
    stake_token_contract.mint(user, 1000 * ONE_E18);
    reward_token_contract.mint(owner, 100 * ONE_E18);

    // Create pool
    start_cheat_caller_address(staking, owner);
    let start_time = get_block_timestamp();
    let end_time = start_time + 1000;
    let pool_id = staking_contract
        .create_pool(stake_token, reward_token, ONE_E18, start_time, end_time);
    stop_cheat_caller_address(staking);

    // Stake tokens
    start_cheat_caller_address(stake_token, user);
    stake_token_contract.approve(staking, 100 * ONE_E18);
    stop_cheat_caller_address(stake_token);

    start_cheat_caller_address(staking, user);
    staking_contract.stake(pool_id, 100 * ONE_E18);
    stop_cheat_caller_address(staking);

    // Verify stake
    let user_stake = staking_contract.get_user_stake(pool_id, user);
    assert!(user_stake == 100 * ONE_E18, "Wrong stake amount");
}

#[test]
fn test_rewards_distribution() {
    let owner = starknet::contract_address_const::<0x123>();
    let user = starknet::contract_address_const::<0x456>();

    // Deploy contracts
    let stake_token = deploy_token("StakingToken");
    let reward_token = deploy_token("RewardToken");
    let staking = deploy_staking(owner);

    let staking_contract = IStakingDispatcher { contract_address: staking };
    let stake_token_contract = IERC20Dispatcher { contract_address: stake_token };
    let reward_token_contract = IERC20Dispatcher { contract_address: reward_token };

    // Setup tokens
    stake_token_contract.mint(user, 1000 * ONE_E18);
    reward_token_contract.mint(owner, 10000 * ONE_E18);

    // Create pool
    start_cheat_caller_address(staking, owner);
    let start_time = get_block_timestamp();
    let end_time = start_time + 1000;
    let pool_id = staking_contract
        .create_pool(stake_token, reward_token, ONE_E18, start_time, end_time);
    stop_cheat_caller_address(staking);

    // Setup reward tokens
    start_cheat_caller_address(reward_token, owner);
    reward_token_contract.transfer(staking, 10000 * ONE_E18);
    stop_cheat_caller_address(reward_token);

    // Stake tokens
    start_cheat_caller_address(stake_token, user);
    stake_token_contract.approve(staking, 100 * ONE_E18);
    stop_cheat_caller_address(stake_token);

    start_cheat_caller_address(staking, user);
    staking_contract.stake(pool_id, 100 * ONE_E18);
    stop_cheat_caller_address(staking);

    // Move time forward halfway through the reward period
    start_cheat_block_timestamp_global(start_time + 500);

    // Check rewards
    let rewards = staking_contract.get_rewards(pool_id, user);
    assert!(rewards > 0, "No rewards accumulated");

    // Claim rewards
    start_cheat_caller_address(staking, user);
    staking_contract.claim_rewards(pool_id);
    stop_cheat_caller_address(staking);

    // Verify rewards received
    let reward_balance = reward_token_contract.balance_of(user);
    assert!(reward_balance > 0, "Rewards not received");
    assert!(reward_balance == rewards, "Wrong reward amount received");

    // Move time to end of reward period
    start_cheat_block_timestamp_global(end_time);

    // Check final rewards
    let final_rewards = staking_contract.get_rewards(pool_id, user);
    assert!(final_rewards > 0, "No final rewards accumulated");

    // Claim final rewards
    start_cheat_caller_address(staking, user);
    staking_contract.claim_rewards(pool_id);
    stop_cheat_caller_address(staking);

    // Verify final rewards
    let final_balance = reward_token_contract.balance_of(user);
    assert!(final_balance > reward_balance, "Final rewards not received");

    stop_cheat_block_timestamp_global();
}

#[test]
fn test_unstake() {
    let owner = starknet::contract_address_const::<0x123>();
    let user = starknet::contract_address_const::<0x456>();

    // Deploy contracts
    let stake_token = deploy_token("StakingToken");
    let reward_token = deploy_token("RewardToken");
    let staking = deploy_staking(owner);

    let staking_contract = IStakingDispatcher { contract_address: staking };
    let stake_token_contract = IERC20Dispatcher { contract_address: stake_token };
    let reward_token_contract = IERC20Dispatcher { contract_address: reward_token };

    // Setup tokens
    stake_token_contract.mint(user, 1000 * ONE_E18);
    reward_token_contract.mint(owner, 100 * ONE_E18);

    // Create pool
    start_cheat_caller_address(staking, owner);
    let start_time = get_block_timestamp();
    let end_time = start_time + 1000;
    let pool_id = staking_contract
        .create_pool(stake_token, reward_token, ONE_E18, start_time, end_time);
    stop_cheat_caller_address(staking);

    // Stake tokens
    start_cheat_caller_address(stake_token, user);
    stake_token_contract.approve(staking, 100 * ONE_E18);
    stop_cheat_caller_address(stake_token);

    start_cheat_caller_address(staking, user);
    staking_contract.stake(pool_id, 100 * ONE_E18);
    stop_cheat_caller_address(staking);

    // Verify initial stake
    let initial_stake = staking_contract.get_user_stake(pool_id, user);
    assert!(initial_stake == 100 * ONE_E18, "Wrong initial stake amount");

    // Move time forward and accumulate some rewards
    start_cheat_block_timestamp_global(start_time + 500);

    // Check rewards before unstake
    let rewards_before = staking_contract.get_rewards(pool_id, user);
    assert!(rewards_before > 0, "No rewards before unstake");

    // Unstake half
    start_cheat_caller_address(staking, user);
    staking_contract.unstake(pool_id, 50 * ONE_E18);
    stop_cheat_caller_address(staking);

    // Verify partial unstake
    let remaining_stake = staking_contract.get_user_stake(pool_id, user);
    assert!(remaining_stake == 50 * ONE_E18, "Wrong stake amount after unstake");

    let token_balance = stake_token_contract.balance_of(user);
    assert!(token_balance == 950 * ONE_E18, "Wrong token balance after unstake");

    // Check rewards after partial unstake
    let rewards_after = staking_contract.get_rewards(pool_id, user);
    assert!(rewards_after > 0, "No rewards after unstake");

    // Unstake remaining amount
    start_cheat_caller_address(staking, user);
    staking_contract.unstake(pool_id, 50 * ONE_E18);
    stop_cheat_caller_address(staking);

    // Verify complete unstake
    let final_stake = staking_contract.get_user_stake(pool_id, user);
    assert!(final_stake == 0, "Stake should be zero after full unstake");

    let final_balance = stake_token_contract.balance_of(user);
    assert!(final_balance == 1000 * ONE_E18, "Should have all tokens back after full unstake");

    stop_cheat_block_timestamp_global();
}
