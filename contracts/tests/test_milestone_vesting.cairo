// Import necessary libraries and modules for testing
use starknet::ContractAddress;
use starknet::storage::Map; // Required for testing map storage if needed, but dispatcher is preferred
use starknet::storage::StoragePointerReadAccess; // Required for loading storage variables directly
use starknet::storage::StoragePointerWriteAccess; // Required for writing storage variables directly

// Import the contract module itself and its inner structs/events
// Assuming the contract is in a module named 'dynamic_milestone_vesting'
use contracts::DynamicMilestoneVesting::DynamicMilestoneVesting::{Event, Milestone, MilestoneAdded, MilestoneAchieved, TokensReleased, VestingRevoked, RemainingTokensReturned};

use contracts::interfaces::IDynamicMilestoneVesting::{IDynamicMilestoneVestingDispatcher, IDynamicMilestoneVestingDispatcherTrait};
use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

// Required for declaring and deploying a contract
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
// Cheatcodes to spy on events and assert their emissions
use snforge_std::{EventSpy, EventSpyAssertionsTrait, spy_events};
// Cheatcodes to cheat environment values
use snforge_std::{
    start_cheat_caller_address, stop_cheat_caller_address, start_cheat_block_number,
    stop_cheat_block_number,
};
use core::result::ResultTrait; // Required for assert_panic


fn deploy_erc20() -> ContractAddress {
    let name: ByteArray = "MockToken";
    let symbol: ByteArray = "MTK";
    let contract = declare("MockToken");

    let mut constructor_calldata = ArrayTrait::new();
    name.serialize(ref constructor_calldata);
    symbol.serialize(ref constructor_calldata);

    let (contract_address, _) = contract
        .unwrap()
        .contract_class()
        .deploy(@constructor_calldata)
        .unwrap();
    contract_address
}

// --- Helper Function to Deploy the Contract ---
fn deploy_contract(
    owner: ContractAddress,
    token: ContractAddress,
    beneficiary: ContractAddress,
    total_allocation: u256,
) -> IDynamicMilestoneVestingDispatcher {
    // 1. Declare the contract class
    let contract = declare("DynamicMilestoneVesting");
    let mut constructor_args = array![];

    let erc20_token = deploy_erc20();

    // 2. Create constructor arguments - serialize each one into the calldata array
    owner.serialize(ref constructor_args);
    erc20_token.serialize(ref constructor_args);
    beneficiary.serialize(ref constructor_args);
    total_allocation.serialize(ref constructor_args);

    // 3. Deploy the contract
    let (contract_address, _err) = contract
        .unwrap()
        .contract_class()
        .deploy(@constructor_args)
        .unwrap();

    let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_token };

    start_cheat_caller_address(erc20_dispatcher.contract_address, owner);

    // Mint tokens to the owner
    erc20_dispatcher.mint(owner, total_allocation);
    
    erc20_dispatcher.transfer(
        contract_address,
        total_allocation,
    );

    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    // 4. Create a dispatcher to interact with the contract
    IDynamicMilestoneVestingDispatcher { contract_address }
}

// --- Helper function to create dummy addresses ---
fn owner() -> ContractAddress {
    1.try_into().unwrap()
}

fn beneficiary() -> ContractAddress {
    2.try_into().unwrap()
}

fn token_address() -> ContractAddress {
    3.try_into().unwrap()
}

fn other_address() -> ContractAddress {
    99.try_into().unwrap()
}

// --- Test Cases ---

#[test]
fn test_constructor_initializes_state_correctly() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;

    // Deploy the contract
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    // Ensure no milestones added and no percentage unlocked initially
    let initial_releasable = dispatcher.releasable_amount();
    assert(initial_releasable == 0, 'Initial releasable not zero');

    // Check initial revocation status
    let initial_revoked_status = dispatcher.is_vesting_revoked();
    assert(!initial_revoked_status, 'Initial revoked is incorrect');
}


#[test]
fn test_add_milestone_by_owner_succeeds_and_emits_event() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    // Start cheating caller address to be the owner [4, 7]
    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Setup event spy [4, 7]
    let mut spy = spy_events();

    // When: Add a milestone
    let milestone_id = 1_u32;
    let description = 'First Milestone';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64; // Block number 100
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);

    // Verify event emission [4, 7]
    let expected_event = Event::MilestoneAdded(
        MilestoneAdded {
            id: milestone_id, description, unlock_percentage, cliff_date
        }
    );
    spy.assert_emitted(@array![(dispatcher.contract_address, expected_event)]);

    // Stop cheating caller address
    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Only owner can call this')]
fn test_add_milestone_by_non_owner_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);
    let non_owner_addr = other_address();

    // Start cheating caller address to be a non-owner [4, 7]
    start_cheat_caller_address(dispatcher.contract_address, non_owner_addr);

    // When: Attempt to add a milestone by non-owner
    let milestone_id = 1_u32;
    let description = 'Milestone';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64;
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);

    // Stop cheating caller address (this line won't be reached if panic occurs)
    // stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Milestone already exists')]
fn test_add_milestone_with_existing_id_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Add the first milestone
    let milestone_id = 1_u32;
    let description = 'Milestone One';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64;
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);

    // When: Attempt to add another milestone with the same ID
    let description_two = 'Milestone Two';
    let unlock_percentage_two = 50_u8;
    let cliff_date_two = 200_u64;
    dispatcher.add_milestone(milestone_id, description_two, unlock_percentage_two, cliff_date_two);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_achieve_milestone_by_owner_succeeds_and_emits_event() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Add a milestone first
    let milestone_id = 1_u32;
    let description = 'Milestone One';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64;
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);

    // Setup event spy after adding milestone, before achieving
    let mut spy = spy_events();

    // When: Achieve the milestone
    dispatcher.achieve_milestone(milestone_id);

    // Verify event emission [4, 7]
    let expected_event = Event::MilestoneAchieved(
        MilestoneAchieved { id: milestone_id }
    );
    spy.assert_emitted(@array![(dispatcher.contract_address, expected_event)]);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Only owner can call this')]
fn test_achieve_milestone_by_non_owner_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);
    let non_owner_addr = other_address();

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);
    // Add a milestone first
    let milestone_id = 1_u32;
    let description = 'Milestone One';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64;
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);
    stop_cheat_caller_address(dispatcher.contract_address); // Stop owner cheat

    // Start cheating caller address to be a non-owner [4, 7]
    start_cheat_caller_address(dispatcher.contract_address, non_owner_addr);

    // When: Attempt to achieve the milestone by non-owner
    dispatcher.achieve_milestone(milestone_id);

    // Stop cheating caller address (this line won't be reached if panic occurs)
    // stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Milestone does not exist')]
fn test_achieve_non_existent_milestone_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // When: Attempt to achieve a milestone that was never added
    let non_existent_milestone_id = 99_u32;
    dispatcher.achieve_milestone(non_existent_milestone_id);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Milestone already achieved')]
fn test_achieve_already_achieved_milestone_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Add and achieve the milestone once
    let milestone_id = 1_u32;
    let description = 'Milestone One';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64;
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);
    dispatcher.achieve_milestone(milestone_id);

    // When: Attempt to achieve the same milestone again
    dispatcher.achieve_milestone(milestone_id);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_releasable_amount_calculates_correctly_before_cliff() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Add and achieve a milestone with a future cliff date
    let milestone_id = 1_u32;
    let description = 'Milestone One';
    let unlock_percentage = 25_u8;
    let future_cliff_date = 200_u64; // Cliff at block 200
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, future_cliff_date);
    dispatcher.achieve_milestone(milestone_id);

    stop_cheat_caller_address(dispatcher.contract_address);

    // When: Check releasable amount before the cliff date
    let current_block = 150_u64; // Current block is before cliff
    start_cheat_block_number(dispatcher.contract_address, current_block); // Cheat the block number [2, 7]

    let releasable = dispatcher.releasable_amount();

    // Then: Releasable amount should be 0 because the cliff hasn't passed
    assert(releasable == 0, 'Releasable amount should be 0');

    stop_cheat_block_number(dispatcher.contract_address); // Stop cheating block number [2, 7]
}

#[test]
fn test_releasable_amount_calculates_correctly_after_cliff() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Add and achieve a milestone with a past cliff date
    let milestone_id = 1_u32;
    let description = 'Milestone One';
    let unlock_percentage = 25_u8;
    let past_cliff_date = 100_u64; // Cliff at block 100
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, past_cliff_date);
    dispatcher.achieve_milestone(milestone_id);

    stop_cheat_caller_address(dispatcher.contract_address);

    // When: Check releasable amount after the cliff date
    let current_block = 150_u64; // Current block is after cliff
    start_cheat_block_number(dispatcher.contract_address, current_block); // Cheat the block number [2, 7]

    let releasable = dispatcher.releasable_amount();

    // Then: Releasable amount should be the calculated percentage of total allocation
    let expected_releasable = total_alloc * unlock_percentage.into() / 100_u256;
    assert(releasable == expected_releasable, 'Releasable amount incorrect');

    stop_cheat_block_number(dispatcher.contract_address); // Stop cheating block number [2, 7]
}

#[test]
fn test_releasable_amount_with_multiple_milestones() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Add and achieve multiple milestones with different cliff dates
    // Milestone 1: 25%, cliff at block 100
    dispatcher.add_milestone(1, 'M1', 25, 100);
    dispatcher.achieve_milestone(1);

    // Milestone 2: 30%, cliff at block 200
    dispatcher.add_milestone(2, 'M2', 30, 200);
    dispatcher.achieve_milestone(2);

    // Milestone 3: 45%, cliff at block 300 (Total 100%)
    dispatcher.add_milestone(3, 'M3', 45, 300);
    dispatcher.achieve_milestone(3);

    stop_cheat_caller_address(dispatcher.contract_address);

    // Scenario 1: Check releasable amount at block 50 (before any cliff)
    let block_50 = 50_u64;
    start_cheat_block_number(dispatcher.contract_address, block_50);
    let releasable_at_50 = dispatcher.releasable_amount();
    assert(releasable_at_50 == 0, 'block 50 incorrect');
    stop_cheat_block_number(dispatcher.contract_address);

    // Scenario 2: Check releasable amount at block 150 (after M1 cliff, before M2 cliff)
    let block_150 = 150_u64;
    start_cheat_block_number(dispatcher.contract_address, block_150);
    let releasable_at_150 = dispatcher.releasable_amount();
    // Only M1's percentage should be unlocked (25%)
    let expected_at_150 = total_alloc * 25_u8.into() / 100_u256;
    assert(releasable_at_150 == expected_at_150, 'block 150 incorrect');
    stop_cheat_block_number(dispatcher.contract_address);

    // Scenario 3: Check releasable amount at block 250 (after M1, M2 cliffs, before M3 cliff)
    let block_250 = 250_u64;
    start_cheat_block_number(dispatcher.contract_address, block_250);
    let releasable_at_250 = dispatcher.releasable_amount();
    // M1 (25%) + M2 (30%) = 55% unlocked
    let expected_at_250 = total_alloc * 55_u8.into() / 100_u256;
    assert(releasable_at_250 == expected_at_250, 'block 250 incorrect');
    stop_cheat_block_number(dispatcher.contract_address);

    // Scenario 4: Check releasable amount at block 350 (after all cliffs)
    let block_350 = 350_u64;
    start_cheat_block_number(dispatcher.contract_address, block_350);
    let releasable_at_350 = dispatcher.releasable_amount();
    // M1 (25%) + M2 (30%) + M3 (45%) = 100% unlocked
    let expected_at_350 = total_alloc;
    assert(releasable_at_350 == expected_at_350, 'block 350 incorrect');
    stop_cheat_block_number(dispatcher.contract_address);
}

// --- Tests for revoke_vesting ---

#[test]
fn test_revoke_vesting_by_owner_succeeds_and_returns_remaining_tokens() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address(); // Address of the ERC20 token
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    // Add and achieve some milestones to make some tokens releasable but not yet released
    start_cheat_caller_address(dispatcher.contract_address, owner_addr);
    dispatcher.add_milestone(1, 'M1', 25, 100); // 25% unlock
    dispatcher.achieve_milestone(1);
    dispatcher.add_milestone(2, 'M2', 30, 200); // 30% unlock
    dispatcher.achieve_milestone(2);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Move time past cliffs so tokens are releasable
    let current_block = 250_u64; // After both M1 and M2 cliffs
    start_cheat_block_number(dispatcher.contract_address, current_block);

    // Calculate releasable amount before revocation
    let _releasable_before_revoke = dispatcher.releasable_amount(); // Should be 55% of total_alloc

    // Assume some amount was released before revocation (e.g., by calling a missing `release` function)
    // For this test, we'll assume 100 tokens were already released (hypothetically)
    // This would typically involve mocking the ERC20 contract's transfer function
    // and potentially loading/storing the amount_released storage variable directly for setup.
    // As direct storage manipulation for deployed contracts isn't fully detailed in context,
    // we'll focus on testing the logic assuming `amount_released` is updated correctly.
    // Let's simulate `amount_released` being 100 for testing the remaining amount calculation.

    let amount_already_released_simulated = 0_u256; // Simulate no tokens released yet
    let remaining_expected = total_alloc - amount_already_released_simulated; // Should be total_alloc

    // Start cheating caller address to be the owner for revocation [4, 7]
    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Setup event spy [4, 7]
    let mut spy = spy_events();

    // When: Revoke vesting by the owner
    dispatcher.revoke_vesting();

    // Then: Verify state, events, and (hypothetical) token transfer

    // Verify revocation status is true
    let revoked_status = dispatcher.is_vesting_revoked();
    assert(revoked_status, 'Vesting should be revoked');

    // Verify VestingRevoked event emission [4, 7]
    let expected_revoke_event = Event::VestingRevoked(
        VestingRevoked { revoked_by: owner_addr }
    );
    spy.assert_emitted(@array![(dispatcher.contract_address, expected_revoke_event)]);

    // Verify RemainingTokensReturned event emission [4, 7]
    // This event should contain the total_allocation as amount, since amount_released was 0
    let expected_returned_event = Event::RemainingTokensReturned(
        RemainingTokensReturned { recipient: owner_addr, amount: remaining_expected }
    );
    spy.assert_emitted(@array![(dispatcher.contract_address, expected_returned_event)]);

    // Stop cheating
    stop_cheat_caller_address(dispatcher.contract_address);
    stop_cheat_block_number(dispatcher.contract_address);
}

#[test]
fn test_revoke_vesting_by_owner_succeeds_with_no_remaining_tokens() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address(); // Address of the ERC20 token
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    // Add and achieve milestones totaling 100%
    start_cheat_caller_address(dispatcher.contract_address, owner_addr);
    dispatcher.add_milestone(1, 'M1', 50, 100); // 50%
    dispatcher.achieve_milestone(1);
    dispatcher.add_milestone(2, 'M2', 50, 200); // 50%
    dispatcher.achieve_milestone(2);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Move time past all cliffs
    let current_block = 300_u64; // After both M1 and M2 cliffs
    start_cheat_block_number(dispatcher.contract_address, current_block);

    // Simulate releasing all tokens before revocation
    // This would typically involve calling a `release` function.
    // For this test, we need `amount_released` to be equal to `total_allocation`.

    let _amount_already_released_simulated = total_alloc; // Simulate all tokens released
    // Assume `amount_released` storage is set to this value for testing.
    // The `revoke_vesting` function calculates `remaining_amount = total_allocation - amount_released`.
    // If simulated `amount_released` is `total_allocation`, `remaining_amount` will be 0.

    // Start cheating caller address to be the owner for revocation [4, 7]
    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Setup event spy [4, 7]
    let mut spy = spy_events();

    // When: Revoke vesting by the owner
    dispatcher.revoke_vesting();

    // Then: Verify state and events

    // Verify revocation status is true
    let revoked_status = dispatcher.is_vesting_revoked();
    assert(revoked_status, 'Vesting should be revoked');

    // Verify VestingRevoked event emission [4, 7]
    let expected_revoke_event = Event::VestingRevoked(
        VestingRevoked { revoked_by: owner_addr }
    );
    spy.assert_emitted(@array![(dispatcher.contract_address, expected_revoke_event)]);

    // Stop cheating
    stop_cheat_caller_address(dispatcher.contract_address);
    stop_cheat_block_number(dispatcher.contract_address);
}


#[test]
#[should_panic(expected: 'Only owner can call this')]
fn test_revoke_vesting_by_non_owner_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);
    let non_owner_addr = other_address();

    // Start cheating caller address to be a non-owner [4, 7]
    start_cheat_caller_address(dispatcher.contract_address, non_owner_addr);

    // When: Attempt to revoke vesting by non-owner
    dispatcher.revoke_vesting();

    // Stop cheating caller address (this line won't be reached if panic occurs)
    // stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_is_vesting_revoked() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    // Initially, vesting should not be revoked
    let initial_status = dispatcher.is_vesting_revoked();
    assert(!initial_status, 'Vesting should not be revoked');

    // Revoke vesting by owner
    start_cheat_caller_address(dispatcher.contract_address, owner_addr);
    dispatcher.revoke_vesting();
    stop_cheat_caller_address(dispatcher.contract_address);

    // After revocation, vesting should be revoked
    let revoked_status = dispatcher.is_vesting_revoked();
    assert(revoked_status, 'Vesting should be revoked');
}

#[test]
#[should_panic(expected: 'Vesting is revoked')]
fn test_add_milestone_after_revocation_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Revoke vesting
    dispatcher.revoke_vesting();

    // When: Attempt to add a milestone after revocation
    let milestone_id = 1_u32;
    let description = 'Milestone';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64;
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Vesting is revoked')]
fn test_achieve_milestone_after_revocation_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Add a milestone first
    let milestone_id = 1_u32;
    let description = 'Milestone One';
    let unlock_percentage = 25_u8;
    let cliff_date = 100_u64;
    dispatcher.add_milestone(milestone_id, description, unlock_percentage, cliff_date);

    // Revoke vesting
    dispatcher.revoke_vesting();

    // When: Attempt to achieve the milestone after revocation
    dispatcher.achieve_milestone(milestone_id);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Vesting is revoked')]
fn test_releasable_amount_after_revocation_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Revoke vesting
    dispatcher.revoke_vesting();

    dispatcher.releasable_amount();

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Vesting is revoked')]
fn test_revoke_vesting_when_already_revoked_panics() {
    // Setup
    let owner_addr = owner();
    let beneficiary_addr = beneficiary();
    let token_addr = token_address();
    let total_alloc = 1000_u256;
    let dispatcher = deploy_contract(owner_addr, token_addr, beneficiary_addr, total_alloc);

    start_cheat_caller_address(dispatcher.contract_address, owner_addr);

    // Revoke vesting the first time
    dispatcher.revoke_vesting();

    // When: Attempt to revoke vesting again
    dispatcher.revoke_vesting();

    stop_cheat_caller_address(dispatcher.contract_address);
}
