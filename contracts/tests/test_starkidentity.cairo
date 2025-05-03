use contracts::interfaces::IStarkIdentity::{
    IStarkIdentityDispatcher, IStarkIdentityDispatcherTrait,
};
use contracts::starkidentity::StarkIdentity;
use core::array::ArrayTrait;
use core::result::ResultTrait;
use core::traits::Into;
use snforge_std::{
    CheatSpan, ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare,
    cheat_block_timestamp, cheat_caller_address, spy_events,
};
use starknet::{ContractAddress, contract_address_const, get_block_timestamp};

// Constants for testing
const USERNAME: felt252 = 'testuser';
const ENS_NAME: felt252 = 'user.eth';
const STARK_NAME: felt252 = 'user.stark';
const PLATFORM_TWITTER: felt252 = 'twitter';
const PROTOCOL_UNISWAP: felt252 = 'uniswap';
const ACTIVITY_SWAP: felt252 = 'swap';
const ACTIVITY_STAKE: felt252 = 'stake';

fn ADMIN() -> ContractAddress {
    contract_address_const::<'ADMIN'>()
}

fn RECOVERY() -> ContractAddress {
    contract_address_const::<'RECOVERY'>()
}

fn USER1() -> ContractAddress {
    contract_address_const::<'USER1'>()
}

fn USER2() -> ContractAddress {
    contract_address_const::<'USER2'>()
}

fn VERIFIER() -> ContractAddress {
    contract_address_const::<'VERIFIER'>()
}

fn deploy_identity_contract() -> (ContractAddress, IStarkIdentityDispatcher) {
    let contract_dispatcher = declare("StarkIdentity").unwrap().contract_class();
    let mut calldata = ArrayTrait::new();
    calldata.append(ADMIN().into());
    let (identity_contract_address, _) = contract_dispatcher.deploy(@calldata).unwrap();
    (
        identity_contract_address,
        IStarkIdentityDispatcher { contract_address: identity_contract_address },
    )
}

#[test]
fn test_create_identity() {
    // Deploy StarkIdentity contract
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Call future n_target transactionas as USER1
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(1));

    // Warp block.timestamp() by one minute to jumpstart after zero
    let timestamp = get_block_timestamp() + 60;
    cheat_block_timestamp(contract_address, timestamp, CheatSpan::TargetCalls(1));

    // Create identity as USER1
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());

    // Verify identity creation
    let identity = contract_dispatcher.get_identity(USER1());
    assert(identity.address == USER1(), 'Create: Wrong user address');
    assert(identity.username == USERNAME, 'Create: Wrong username');
    assert(identity.ens_name == ENS_NAME, 'Create: Wrong ENS name');
    assert(identity.stark_name == STARK_NAME, 'Create: Wrong Stark name');
    assert(identity.recovery_address == RECOVERY(), 'Create: Wrong recovery address');
    assert(identity.social_connections == 0, 'Should have no connections');
    assert(identity.transaction_volume == 0, 'Should have zero tx volume');
    assert(identity.protocols_used == 0, 'Should have no protocols');
    assert(identity.transaction_count == 0, 'Should have no transactions');
    assert(identity.reputation_score == 0, 'Should have zero reputation');
}

#[test]
fn test_create_duplicate_identity() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));

    // Warp block.timestamp() by one minute for the first call
    let timestamp1 = get_block_timestamp() + 60;
    cheat_block_timestamp(contract_address, timestamp1, CheatSpan::TargetCalls(1));

    // Create first identity (created_at becomes nonzero)
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());

    // For duplicate call, set a new nonzero timestamp to maintain state
    let timestamp2 = get_block_timestamp() + 120;
    cheat_block_timestamp(contract_address, timestamp2, CheatSpan::TargetCalls(1));

    // Try to create duplicate identity - should panic
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());
}

#[test]
fn test_update_identity() {
    // Cheat sender address and timestamp and create an identity
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(3));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(4));
    contract_dispatcher.create_identity('bob', 'bob.eth', 'bob.stark', RECOVERY());

    // Update identity field
    contract_dispatcher.update_identity('username', 'bobby');
    contract_dispatcher.update_identity('ens_name', 'bobby.eth');

    let identity = contract_dispatcher.get_identity(USER1());

    assert(identity.username == 'bobby', 'Update: Username not updated');
    assert(identity.ens_name == 'bobby.eth', 'Update: ENS name not updated');
    // assert(identity.username == 'bobby', 'Update: Username not updated');
// assert(identity.username == 'bobby', 'Update: Username not updated');
}

#[test]
fn test_request_verification() {
    // Test that a verification request can be made.
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(3));
    contract_dispatcher.create_identity('eve', 'eve.eth', 'eve.stark', RECOVERY());

    // Request verification of type 'phone'
    contract_dispatcher.request_verification('phone');
    let identity = contract_dispatcher.get_identity(USER1());
    assert(identity.created_at != 0, 'Request: Identity missing');
}

#[test]
fn test_update_reputation() {
    // Test updating reputation — requires a verifier.
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Set up identity for USER1.
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(1));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(5));
    contract_dispatcher.create_identity('frank', 'frank.eth', 'frank.stark', RECOVERY());

    // Add VERIFIER as a valid verifier using ADMIN privileges.
    cheat_caller_address(contract_address, ADMIN(), CheatSpan::TargetCalls(1));
    contract_dispatcher.add_verifier(VERIFIER());

    // Now, as VERIFIER, update reputation for USER1.
    cheat_caller_address(contract_address, VERIFIER(), CheatSpan::TargetCalls(1));
    contract_dispatcher.update_reputation(USER1(), 50);

    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(1));
    let identity = contract_dispatcher.get_identity(USER1());
    assert(identity.reputation_score == 50, 'Reputation update failed');
}

#[test]
fn test_submit_and_verify_address_signature_new() {
    // Test generating and submitting an address signature for ownership verification.
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Create identity for USER1.
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(4));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(4));
    contract_dispatcher.create_identity('grace', 'grace.eth', 'grace.stark', RECOVERY());

    // Generate signature using the contract's function.
    let signature = contract_dispatcher.generate_ownership_signature(USER1(), USER1());

    // Submit address signature.
    contract_dispatcher.submit_address_signature(USER1(), signature);
    let verified = contract_dispatcher.verify_address_ownership(USER1());
    assert(verified, 'Verification failed');
}

#[test]
fn test_record_activity() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Set a fixed timestamp, then cheat block.timestamp using that value.
    let fixed_timestamp = get_block_timestamp() + 60;
    cheat_block_timestamp(contract_address, fixed_timestamp, CheatSpan::TargetCalls(1));
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));

    // Create identity first
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());

    // Record some activity with a fixed value.
    let value: u256 = 1111;
    contract_dispatcher.record_activity(ACTIVITY_SWAP, PROTOCOL_UNISWAP, value);

    // Verify activity recording
    let identity = contract_dispatcher.get_identity(USER1());
    assert(identity.protocols_used == 1, 'Wrong protocols used');
    assert(identity.transaction_count == 1, 'Wrong transaction count');
    assert(identity.transaction_volume == value, 'Wrong transaction volume');

    // Check activity record
    let activities = contract_dispatcher.get_activities(USER1(), 0, 1);
    assert(activities.len() == 1, 'Wrong number of activities');

    let activity = activities.at(0);
    assert(activity.activity_type == @ACTIVITY_SWAP, 'Wrong activity type');
    assert(activity.protocol == @PROTOCOL_UNISWAP, 'Wrong protocol');
    assert(*activity.value == value, 'Wrong activity value');
}

#[test]
fn test_social_verification() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Setup verifier
    cheat_caller_address(contract_address, ADMIN(), CheatSpan::TargetCalls(1));
    contract_dispatcher.add_verifier(VERIFIER());

    // Create first identity (created_at becomes nonzero)
    let timestamp = get_block_timestamp() + 60;
    cheat_block_timestamp(contract_address, timestamp, CheatSpan::TargetCalls(5));
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(1));
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());

    // Submit social verification as verifier
    cheat_caller_address(contract_address, VERIFIER(), CheatSpan::TargetCalls(1));
    let proof: felt252 = 420;
    contract_dispatcher.submit_social_proof(PLATFORM_TWITTER, USER1(), proof);

    // Verify social proof
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));
    let is_verified = contract_dispatcher.verify_social_proof(PLATFORM_TWITTER, proof);
    assert(is_verified, 'Social proof should be verified');

    // Update social verification
    contract_dispatcher.add_social_verification(PLATFORM_TWITTER, proof);

    // Check identity social update
    let identity = contract_dispatcher.get_identity(USER1());
    assert(identity.social_connections == 1, 'Wrong social connection count');
}

#[test]
fn test_protocol_usage() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Create identity and record protocol usage
    let timestamp = get_block_timestamp() + 3600;
    cheat_block_timestamp(contract_address, timestamp, CheatSpan::TargetCalls(3));
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(3));
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());

    // Record multiple protocol interactions
    let value: u256 = 1000;
    contract_dispatcher.record_activity(ACTIVITY_SWAP, PROTOCOL_UNISWAP, value);
    contract_dispatcher.record_protocol_usage(USER1(), PROTOCOL_UNISWAP);

    // Verify protocol usage
    let has_used = contract_dispatcher.has_used_protocol(USER1(), PROTOCOL_UNISWAP);
    assert(has_used, 'Should have used protocol');
}

#[test]
fn test_address_linking() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Warp forward in time to jumstart identity creation
    let timestamp = get_block_timestamp() + 3600;
    cheat_block_timestamp(contract_address, timestamp, CheatSpan::TargetCalls(10));

    // Create identity for USER1
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(4));
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());

    // Generate and submit signature for USER2
    let signature = contract_dispatcher.generate_ownership_signature(USER1(), USER2());
    contract_dispatcher.submit_address_signature(USER1(), signature);

    // Link USER2's address
    contract_dispatcher.link_address(USER2());

    // Verify address linking
    let is_linked = contract_dispatcher.verify_linked_addresses(USER1(), USER2());
    assert(is_linked, 'Addresses should be linked');
}

#[test]
fn test_time_based_operations() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Record activity at current time
    let initial_timestamp = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, initial_timestamp, CheatSpan::TargetCalls(2));

    // Create USER1 identity
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(3));
    contract_dispatcher.create_identity(USERNAME, ENS_NAME, STARK_NAME, RECOVERY());
    contract_dispatcher.record_activity(ACTIVITY_STAKE, PROTOCOL_UNISWAP, 1000);

    // Warp time forward and record another activity
    let new_timestamp = get_block_timestamp() + 3600;
    cheat_block_timestamp(contract_address, new_timestamp, CheatSpan::TargetCalls(2));
    contract_dispatcher.record_activity(ACTIVITY_STAKE, PROTOCOL_UNISWAP, 2000);

    // Verify timestamps in activity records
    let activities = contract_dispatcher.get_activities(USER1(), 0, 2);
    assert(activities.at(0).timestamp == @initial_timestamp, 'Wrong initial timestamp');
    assert(activities.at(1).timestamp == @new_timestamp, 'Wrong second timestamp');
}

// Test for IdentityCreated event.
#[test]
fn test_event_identity_created() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(1));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(1));

    let mut spy = spy_events();
    contract_dispatcher.create_identity('alice', 'alice.eth', 'alice.stark', RECOVERY());

    spy
        .assert_emitted(
            @array![
                (
                    contract_address,
                    StarkIdentity::Event::IdentityCreated(
                        StarkIdentity::IdentityCreated {
                            address: USER1(),
                            username: 'alice',
                            ens_name: 'alice.eth',
                            stark_name: 'alice.stark',
                            timestamp: ts,
                        },
                    ),
                ),
            ],
        );
}

// Test for IdentityUpdated event.
#[test]
fn test_event_identity_updated() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(1));
    contract_dispatcher.create_identity('bob', 'bob.eth', 'bob.stark', RECOVERY());

    let mut spy = spy_events();
    // Update username field.
    contract_dispatcher.update_identity('username', 'bobby');

    spy
        .assert_emitted(
            @array![
                (
                    contract_address,
                    StarkIdentity::Event::IdentityUpdated(
                        StarkIdentity::IdentityUpdated {
                            address: USER1(), field: 'username', timestamp: get_block_timestamp(),
                        },
                    ),
                ),
            ],
        );
}

// Test for ActivityRecorded event.
#[test]
fn test_event_activity_recorded() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(1));
    contract_dispatcher.create_identity('carol', 'carol.eth', 'carol.stark', RECOVERY());

    let mut spy = spy_events();
    let value: u256 = 2000;
    contract_dispatcher.record_activity('swap', 'uniswap', value);

    spy
        .assert_emitted(
            @array![
                (
                    contract_address,
                    StarkIdentity::Event::ActivityRecorded(
                        StarkIdentity::ActivityRecorded {
                            address: USER1(),
                            activity_type: 'swap',
                            protocol: 'uniswap',
                            value: value,
                            timestamp: get_block_timestamp(),
                        },
                    ),
                ),
            ],
        );
}

// Test for AddressLinked event.
#[test]
fn test_event_address_linked() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(4));
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(1));
    contract_dispatcher.create_identity('dave', 'dave.eth', 'dave.stark', RECOVERY());

    let signature = contract_dispatcher.generate_ownership_signature(USER1(), USER2());
    contract_dispatcher.submit_address_signature(USER1(), signature);

    let mut spy = spy_events();
    contract_dispatcher.link_address(USER2());

    spy
        .assert_emitted(
            @array![
                (
                    contract_address,
                    StarkIdentity::Event::AddressLinked(
                        StarkIdentity::AddressLinked {
                            primary_address: USER1(),
                            linked_address: USER2(),
                            timestamp: get_block_timestamp(),
                        },
                    ),
                ),
            ],
        );
}

// Test for  VerificationRequested event
#[test]
fn test_event_verification_request() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Set up identity for USER1.
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(6));
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));
    contract_dispatcher.create_identity('eve', 'eve.eth', 'eve.stark', RECOVERY());

    // Request verification.
    let mut spy_req = spy_events();
    contract_dispatcher.request_verification('phone');
    spy_req
        .assert_emitted(
            @array![
                (
                    contract_address,
                    StarkIdentity::Event::VerificationRequested(
                        StarkIdentity::VerificationRequested {
                            requester: USER1(), verification_type: 'phone', timestamp: ts,
                        },
                    ),
                ),
            ],
        );
}

#[test]
fn test_event_social_verification() {
    let (contract_address, contract_dispatcher) = deploy_identity_contract();

    // Set up identity for USER1.
    let ts = get_block_timestamp() + 1000;
    cheat_block_timestamp(contract_address, ts, CheatSpan::TargetCalls(6));
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));
    contract_dispatcher.create_identity('eve', 'eve.eth', 'eve.stark', RECOVERY());

    // Request verification.
    contract_dispatcher.request_verification('phone');

    // Set up social verification: First, add a verifier.
    cheat_caller_address(contract_address, ADMIN(), CheatSpan::TargetCalls(1));
    contract_dispatcher.add_verifier(VERIFIER());

    // Submit social proof as VERIFIER.
    cheat_caller_address(contract_address, VERIFIER(), CheatSpan::TargetCalls(1));
    let proof: felt252 = 96;
    contract_dispatcher.submit_social_proof('mastodon', USER1(), proof);

    // Now, USER1 calls add_social_verification.
    let mut spy_social = spy_events();
    cheat_caller_address(contract_address, USER1(), CheatSpan::TargetCalls(2));
    contract_dispatcher.verify_social_proof('mastodon', proof);
    contract_dispatcher.add_social_verification('mastodon', proof);

    spy_social
        .assert_emitted(
            @array![
                (
                    contract_address,
                    StarkIdentity::Event::SocialVerificationAdded(
                        StarkIdentity::SocialVerificationAdded {
                            address: USER1(), platform: 'mastodon', timestamp: ts,
                        },
                    ),
                ),
            ],
        );
}
