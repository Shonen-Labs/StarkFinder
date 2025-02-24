use core::array::ArrayTrait;
use core::byte_array::ByteArray;
use core::result::ResultTrait;
use core::traits::Into;
use contracts::starkidentity::{
    IStarkIdentityDispatcher, IStarkIdentityDispatcherTrait, StarkIdentity, Identity,
    ActivityRecord, ProtocolUsage, SocialProof,
};
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare, spy_events,
    start_cheat_caller_address, stop_cheat_caller_address,
};
use starknet::{ContractAddress, contract_address_const};

// Constants for testing
const ENS_NAME: felt252 = 'test.eth';
const STARK_NAME: felt252 = 'test.stark';
const USERNAME: felt252 = 'testuser';
const PLATFORM_TWITTER: felt252 = 'twitter';
const PROTOCOL_UNISWAP: felt252 = 'uniswap';

fn ADMIN() -> ContractAddress {
    contract_address_const::<'ADMIN'>()
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

fn deploy_identity_contract() -> ContractAddress {
    let contract = declare("StarkIdentity").unwrap().contract_class();
    let mut calldata = ArrayTrait::new();
    calldata.append(ADMIN().into());
    let (address, _) = contract.deploy(@calldata).unwrap();
    address
}

#[test]
fn test_create_identity() {
    let contract_address = deploy_identity_contract();
    let contract = IStarkIdentityDispatcher { contract_address };

    // Create identity as USER1
    start_cheat_caller_address(contract_address, USER1());
    contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);
    stop_cheat_caller_address(contract_address);

    // Verify identity creation
    let identity = contract.get_identity(USER1());
    assert(identity.username == USERNAME, 'Wrong username');
    assert(identity.ens_name == ENS_NAME, 'Wrong ENS name');
    assert(identity.stark_name == STARK_NAME, 'Wrong Stark name');
    assert(identity.social_connections == 0, 'Should have no connections');
    assert(identity.transaction_count == 0, 'Should have no transactions');
    assert(!identity.is_verified, 'Should not be verified');
}

#[test]
#[should_panic(expected: 'Identity already exists')]
fn test_create_duplicate_identity() {
    let contract_address = deploy_identity_contract();
    let contract = IStarkIdentityDispatcher { contract_address };

    start_cheat_caller_address(contract_address, USER1());
    // Create first identity
    contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);
    // Try to create duplicate identity - should fail
    contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);
    stop_cheat_caller_address(contract_address);
}
// #[test]
// fn test_record_activity() {
//     let contract_address = deploy_identity_contract();
//     let contract = IStarkIdentityDispatcher { contract_address };

//     // Create identity first
//     start_cheat_caller_address(contract_address, USER1());
//     contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);

//     // Record some activity
//     let value: u256 = 1000;
//     contract.record_activity(PROTOCOL_UNISWAP, 'swap', value);
//     stop_cheat_caller_address(contract_address);

//     // Verify activity recording
//     let identity = contract.get_identity(USER1());
//     assert(identity.transaction_count == 1, 'Wrong transaction count');
//     assert(identity.transaction_volume == value, 'Wrong transaction volume');

//     // Check activity record
//     let activities = contract.get_activities(USER1(), 0, 1);
//     assert(activities.len() == 1, 'Wrong number of activities');
//     let activity = activities.at(0);
//     assert(activity.protocol == PROTOCOL_UNISWAP, 'Wrong protocol');
//     assert(activity.value == value, 'Wrong activity value');
// }

// #[test]
// fn test_social_verification() {
//     let contract_address = deploy_identity_contract();
//     let contract = IStarkIdentityDispatcher { contract_address };

//     // Setup verifier
//     start_cheat_caller_address(contract_address, ADMIN());
//     contract.add_verifier(VERIFIER());
//     stop_cheat_caller_address(contract_address);

//     // Create identity
//     start_cheat_caller_address(contract_address, USER1());
//     contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);
//     stop_cheat_caller_address(contract_address);

//     // Submit social verification as verifier
//     start_cheat_caller_address(contract_address, VERIFIER());
//     let proof: felt252 = 123;
//     contract.submit_social_proof(PLATFORM_TWITTER, proof);
//     stop_cheat_caller_address(contract_address);

//     // Verify social proof
//     start_cheat_caller_address(contract_address, USER1());
//     let is_verified = contract.verify_social_proof(PLATFORM_TWITTER, proof);
//     assert(is_verified, 'Social proof should be verified');

//     // Check identity update
//     let identity = contract.get_identity(USER1());
//     assert(identity.social_connections == 1, 'Wrong social connection count');
//     stop_cheat_caller_address(contract_address);
// }

// #[test]
// fn test_protocol_usage() {
//     let contract_address = deploy_identity_contract();
//     let contract = IStarkIdentityDispatcher { contract_address };

//     // Create identity and record protocol usage
//     start_cheat_caller_address(contract_address, USER1());
//     contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);

//     // Record multiple protocol interactions
//     let value: u256 = 1000;
//     contract.record_activity(PROTOCOL_UNISWAP, 'swap', value);
//     contract.record_activity(PROTOCOL_UNISWAP, 'swap', value);
//     stop_cheat_caller_address(contract_address);

//     // Verify protocol usage
//     let has_used = contract.has_used_protocol(USER1(), PROTOCOL_UNISWAP);
//     assert(has_used, 'Should have used protocol');

//     let usage = contract.get_protocol_usage(USER1(), PROTOCOL_UNISWAP);
//     assert(usage.interaction_count == 2, 'Wrong interaction count');
// }

// #[test]
// fn test_address_linking() {
//     let contract_address = deploy_identity_contract();
//     let contract = IStarkIdentityDispatcher { contract_address };

//     // Create identity for USER1
//     start_cheat_caller_address(contract_address, USER1());
//     contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);

//     // Generate and submit signature for USER2
//     let signature = contract.generate_ownership_signature(USER1(), USER2());
//     contract.submit_address_signature(USER2(), signature);

//     // Link USER2's address
//     contract.link_address(USER2());
//     stop_cheat_caller_address(contract_address);

//     // Verify address linking
//     let is_linked = contract.are_addresses_linked(USER1(), USER2());
//     assert(is_linked, 'Addresses should be linked');
// }

// #[test]
// fn test_events() {
//     let contract_address = deploy_identity_contract();
//     let contract = IStarkIdentityDispatcher { contract_address };

//     // Start event spy
//     let mut spy = spy_events();

//     // Create identity
//     start_cheat_caller_address(contract_address, USER1());
//     contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);
//     stop_cheat_caller_address(contract_address);

//     // Verify IdentityCreated event
//     spy
//         .assert_emitted(
//             contract_address,
//             StarkIdentity::Event::IdentityCreated(
//                 IdentityCreated {
//                     address: USER1(),
//                     username: USERNAME,
//                     ens_name: ENS_NAME,
//                     stark_name: STARK_NAME,
//                     timestamp: get_block_timestamp(),
//                 },
//             ),
//         );
// }

// #[test]
// fn test_time_based_operations() {
//     let contract_address = deploy_identity_contract();
//     let contract = IStarkIdentityDispatcher { contract_address };

//     // Create identity
//     start_cheat_caller_address(contract_address, USER1());
//     contract.create_identity(USERNAME, ENS_NAME, STARK_NAME);

//     // Record activity at current time
//     let initial_time = 1000;
//     start_warp(contract_address, initial_time);
//     contract.record_activity(PROTOCOL_UNISWAP, 'swap', 1000);

//     // Warp time forward and record another activity
//     let new_time = initial_time + 3600; // 1 hour later
//     start_warp(contract_address, new_time);
//     contract.record_activity(PROTOCOL_UNISWAP, 'swap', 2000);
//     stop_warp(contract_address);

//     // Verify timestamps in activity records
//     let activities = contract.get_activities(USER1(), 0, 2);
//     assert(activities.at(0).timestamp == initial_time, 'Wrong initial timestamp');
//     assert(activities.at(1).timestamp == new_time, 'Wrong second timestamp');
//     stop_cheat_caller_address(contract_address);
// }


