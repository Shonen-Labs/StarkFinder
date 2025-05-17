// Import the contract module itself
use contracts::identityregistry::identity_registry;
// Make the required inner structs available in scope
use contracts::identityregistry::identity_registry::{
    CredentialIssuedEvent, CredentialRevokedEvent, IssuerWhitelistedEvent,
    IssuerRemovedEvent, Event
};


// Traits derived from the interface, allowing to interact with a deployed contract
use contracts::interfaces::IIdentityRegistry::{IIdentityRegistryDispatcher, IIdentityRegistryDispatcherTrait, CredentialId};

// Required for declaring and deploying a contract
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
// Cheatcodes to spy on events and assert their emissions
use snforge_std::{EventSpyAssertionsTrait, spy_events};
// Cheatcodes to cheat environment values - more cheatcodes exist
use snforge_std::{
    start_cheat_block_timestamp, start_cheat_caller_address, stop_cheat_caller_address,
};

use starknet::{ContractAddress, contract_address_const};

use core::result::ResultTrait;


// Helper function to deploy the contract
// The constructor takes an admin ContractAddress
fn deploy_identity_registry(admin_address: ContractAddress) -> IIdentityRegistryDispatcher {
    // Deploy the contract -
    // 1. Declare the contract class
    let contract = declare("identity_registry");

    // 2. Create constructor arguments - serialize each one in a felt252 array
    let mut constructor_args = array![];
    Serde::serialize(@admin_address, ref constructor_args);

    // 3. Deploy the contract
    let (contract_address, _err) = contract
        .unwrap()
        .contract_class()
        .deploy(@constructor_args)
        .unwrap();

    // 4. Create a dispatcher to interact with the contract
    IIdentityRegistryDispatcher { contract_address }
}


#[test]
fn test_add_issuer_by_admin() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let issuer_to_add: ContractAddress = contract_address_const::<'issuer1'>();

    let dispatcher = deploy_identity_registry(admin);
    let mut spy = spy_events();

    // Mock the caller address to be the admin
    start_cheat_caller_address(dispatcher.contract_address, admin);

    // Add the issuer
    dispatcher.add_issuer(issuer_to_add);

    // Stop mocking the caller address
    stop_cheat_caller_address(dispatcher.contract_address);

    // Verify the issuer is whitelisted
    let is_whitelisted = dispatcher.is_issuer_whitelisted(issuer_to_add);
    assert(is_whitelisted, 'Issuer should be whitelisted');

    // Verify event emission
    let expected_event = identity_registry::Event::IssuerWhitelisted(
        IssuerWhitelistedEvent { issuer: issuer_to_add }
    );
    let expected_events = array![(dispatcher.contract_address, expected_event)];
    spy.assert_emitted(@expected_events);
}

#[test]
#[should_panic(expected: 'Only admin can add issuers')]
fn test_add_issuer_by_non_admin_should_panic() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let non_admin: ContractAddress = contract_address_const::<'non_admin'>();
    let issuer_to_add: ContractAddress = contract_address_const::<'issuer1'>();

    let dispatcher = deploy_identity_registry(admin);

    // Mock the caller address to be a non-admin
    start_cheat_caller_address(dispatcher.contract_address, non_admin);

    // Attempt to add the issuer (should panic)
    dispatcher.add_issuer(issuer_to_add);

    // Stop mocking the caller address (this line will not be reached if panic occurs)
    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_remove_issuer_by_admin() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let issuer_to_remove: ContractAddress = contract_address_const::<'issuer1'>();

    let dispatcher = deploy_identity_registry(admin);
    let mut spy = spy_events();

    // First, add the issuer (as admin)
    start_cheat_caller_address(dispatcher.contract_address, admin);
    dispatcher.add_issuer(issuer_to_remove);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Now, remove the issuer (as admin)
    start_cheat_caller_address(dispatcher.contract_address, admin);
    dispatcher.remove_issuer(issuer_to_remove);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Verify the issuer is no longer whitelisted
    let is_whitelisted = dispatcher.is_issuer_whitelisted(issuer_to_remove);
    assert(!is_whitelisted, 'should not be whitelisted');

    // Verify event emission (assuming we only check the last event or clear spy)
    // For simplicity, this test only asserts the *removal* event
    let expected_event = identity_registry::Event::IssuerRemoved(
        IssuerRemovedEvent { issuer: issuer_to_remove }
    );
    let expected_events = array![(dispatcher.contract_address, expected_event)];
    // Note: In a real test, you might want to assert both events or clear the spy between actions
    // For this example, we assert the removal event is present after removal.
    spy.assert_emitted(@expected_events);
}

#[test]
#[should_panic(expected: 'Only admin can remove issuers')]
fn test_remove_issuer_by_non_admin_should_panic() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let non_admin: ContractAddress = contract_address_const::<'non_admin'>();
    let issuer_to_remove: ContractAddress = contract_address_const::<'issuer1'>();

    let dispatcher = deploy_identity_registry(admin);

    // Mock the caller address to be a non-admin
    start_cheat_caller_address(dispatcher.contract_address, non_admin);

    // Attempt to remove the issuer (should panic)
    dispatcher.remove_issuer(issuer_to_remove);

    // Stop mocking the caller address (this line will not be reached if panic occurs)
    stop_cheat_caller_address(dispatcher.contract_address);
}


#[test]
fn test_issue_credential_by_whitelisted_issuer() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let issuer: ContractAddress = contract_address_const::<'issuer1'>();
    let owner: ContractAddress = contract_address_const::<'owner1'>();
    let credential_data: felt252 = 12345;
    let expires_at: u64 = 987654321;
    let revocation_nonce: felt252 = 67890;
    let issued_at_timestamp: u64 = 123456789; // Mocked timestamp

    let dispatcher = deploy_identity_registry(admin);
    let mut spy = spy_events();

    // Whitelist the issuer (as admin)
    start_cheat_caller_address(dispatcher.contract_address, admin);
    dispatcher.add_issuer(issuer);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Mock the caller address to be the issuer and the block timestamp
    start_cheat_caller_address(dispatcher.contract_address, issuer);
    start_cheat_block_timestamp(dispatcher.contract_address, issued_at_timestamp);

    // Issue the credential
    dispatcher.issue_credential(owner, credential_data, expires_at, revocation_nonce);

    // Stop mocking
    stop_cheat_caller_address(dispatcher.contract_address);
    // stop_cheat_block_timestamp(dispatcher.contract_address); // No stop_cheat_block_timestamp available in context

    // Verify the credential was stored and can be retrieved
    let credential_id = CredentialId { owner, issuer, issued_at: issued_at_timestamp };
    let retrieved_credential = dispatcher.get_credential(credential_id);

    assert(retrieved_credential.owner == owner, 'Credential owner mismatch');
    assert(retrieved_credential.issuer == issuer, 'Credential issuer mismatch');
    assert(retrieved_credential.data == credential_data, 'Credential data mismatch');
    assert(retrieved_credential.issued_at == issued_at_timestamp, 'Credential issued_at mismatch');
    assert(retrieved_credential.expires_at == expires_at, 'Credential expires_at mismatch');
    assert(retrieved_credential.revocation_nonce == revocation_nonce, 'Credential nonce mismatch');
    assert(retrieved_credential.verified, 'Credential should be verified');

    // Verify event emission
    let expected_event = identity_registry::Event::CredentialIssued(
        CredentialIssuedEvent { owner, issuer }
    );
    let expected_events = array![(dispatcher.contract_address, expected_event)];
    spy.assert_emitted(@expected_events);
}

#[test]
#[should_panic(expected: 'Issuer not whitelisted')]
fn test_issue_credential_by_non_whitelisted_issuer_should_panic() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let non_whitelisted_issuer: ContractAddress = contract_address_const::<'bad_issuer'>();
    let owner: ContractAddress = contract_address_const::<'owner1'>();
    let credential_data: felt252 = 12345;
    let expires_at: u64 = 987654321;
    let revocation_nonce: felt252 = 67890;
    let issued_at_timestamp: u64 = 123456789; // Mocked timestamp

    let dispatcher = deploy_identity_registry(admin);
    // Do NOT whitelist the issuer

    // Mock the caller address to be the non-whitelisted issuer and the block timestamp
    start_cheat_caller_address(dispatcher.contract_address, non_whitelisted_issuer);
    start_cheat_block_timestamp(dispatcher.contract_address, issued_at_timestamp);

    // Attempt to issue the credential (should panic)
    dispatcher.issue_credential(owner, credential_data, expires_at, revocation_nonce);

    // Stop mocking (this line will not be reached if panic occurs)
    stop_cheat_caller_address(dispatcher.contract_address);
    // stop_cheat_block_timestamp(dispatcher.contract_address); // No stop_cheat_block_timestamp available in context
}

#[test]
fn test_revoke_credential_by_correct_issuer() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let issuer: ContractAddress = contract_address_const::<'issuer1'>();
    let owner: ContractAddress = contract_address_const::<'owner1'>();
    let credential_data: felt252 = 12345;
    let expires_at: u64 = 987654321;
    let revocation_nonce: felt252 = 67890;
    let issued_at_timestamp: u64 = 123456789; // Mocked timestamp

    let dispatcher = deploy_identity_registry(admin);
    let mut spy = spy_events();

    // Whitelist the issuer and issue a credential first
    start_cheat_caller_address(dispatcher.contract_address, admin);
    dispatcher.add_issuer(issuer);
    stop_cheat_caller_address(dispatcher.contract_address);

    start_cheat_caller_address(dispatcher.contract_address, issuer);
    start_cheat_block_timestamp(dispatcher.contract_address, issued_at_timestamp);
    dispatcher.issue_credential(owner, credential_data, expires_at, revocation_nonce);
    stop_cheat_caller_address(dispatcher.contract_address);
    // stop_cheat_block_timestamp(dispatcher.contract_address); // No stop_cheat_block_timestamp available in context

    // Get the credential ID
    let credential_id = CredentialId { owner, issuer, issued_at: issued_at_timestamp };

    // Mock the caller address to be the correct issuer and revoke the credential
    start_cheat_caller_address(dispatcher.contract_address, issuer);
    dispatcher.revoke_credential(credential_id);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Verify the credential's verified status is false
    let retrieved_credential = dispatcher.get_credential(credential_id);
    assert(!retrieved_credential.verified, 'Credential should be unverified');

    // Verify event emission
    let expected_event = identity_registry::Event::CredentialRevoked(
        CredentialRevokedEvent { owner, issuer }
    );
    let expected_events = array![(dispatcher.contract_address, expected_event)];
    spy.assert_emitted(@expected_events);
}

#[test]
#[should_panic(expected: 'Only issuer can revoke')]
fn test_revoke_credential_by_wrong_issuer_should_panic() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let issuer: ContractAddress = contract_address_const::<'issuer1'>();
    let wrong_issuer: ContractAddress = contract_address_const::<'wrong_issuer'>();
    let owner: ContractAddress = contract_address_const::<'owner1'>();
    let credential_data: felt252 = 12345;
    let expires_at: u64 = 987654321;
    let revocation_nonce: felt252 = 67890;
    let issued_at_timestamp: u64 = 123456789; // Mocked timestamp

    let dispatcher = deploy_identity_registry(admin);

    // Whitelist the correct issuer and issue a credential first
    start_cheat_caller_address(dispatcher.contract_address, admin);
    dispatcher.add_issuer(issuer);
    stop_cheat_caller_address(dispatcher.contract_address);

    start_cheat_caller_address(dispatcher.contract_address, issuer);
    start_cheat_block_timestamp(dispatcher.contract_address, issued_at_timestamp);
    dispatcher.issue_credential(owner, credential_data, expires_at, revocation_nonce);
    stop_cheat_caller_address(dispatcher.contract_address);
    // stop_cheat_block_timestamp(dispatcher.contract_address); // No stop_cheat_block_timestamp available in context


    // Get the credential ID
    let credential_id = CredentialId { owner, issuer, issued_at: issued_at_timestamp };

    // Mock the caller address to be a *wrong* issuer and attempt to revoke
    start_cheat_caller_address(dispatcher.contract_address, wrong_issuer);
    dispatcher.revoke_credential(credential_id);
    stop_cheat_caller_address(dispatcher.contract_address); // This line will not be reached if panic occurs
}


#[test]
fn test_update_revocation_root_by_admin() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let new_root: felt252 = 1122334455;

    let dispatcher = deploy_identity_registry(admin);

    // Mock the caller address to be the admin
    start_cheat_caller_address(dispatcher.contract_address, admin);

    // Update the root
    dispatcher.update_revocation_root(new_root);

    // Stop mocking
    stop_cheat_caller_address(dispatcher.contract_address);

    // Verify the root was updated
    let current_root = dispatcher.get_revocation_root();
    assert(current_root == new_root, 'Revocation root not updated');
}

#[test]
#[should_panic(expected: 'Only admin can update root')]
fn test_update_revocation_root_by_non_admin_should_panic() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let non_admin: ContractAddress = contract_address_const::<'non_admin'>();
    let new_root: felt252 = 1122334455;

    let dispatcher = deploy_identity_registry(admin);

    // Mock the caller address to be a non-admin
    start_cheat_caller_address(dispatcher.contract_address, non_admin);

    // Attempt to update the root (should panic)
    dispatcher.update_revocation_root(new_root);

    // Stop mocking (this line will not be reached if panic occurs)
    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_is_issuer_whitelisted() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let issuer1: ContractAddress = contract_address_const::<'issuer1'>();
    let issuer2: ContractAddress = contract_address_const::<'issuer2'>(); // Will not be whitelisted

    let dispatcher = deploy_identity_registry(admin);

    // Whitelist issuer1 (as admin)
    start_cheat_caller_address(dispatcher.contract_address, admin);
    dispatcher.add_issuer(issuer1);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Check status for issuer1
    let is_whitelisted1 = dispatcher.is_issuer_whitelisted(issuer1);
    assert(is_whitelisted1, 'Issuer1 should be whitelisted');

    // Check status for issuer2
    let is_whitelisted2 = dispatcher.is_issuer_whitelisted(issuer2);
    assert(!is_whitelisted2, 'should not be whitelisted');
}

#[test]
fn test_get_revocation_root() {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let initial_root: felt252 = 0; // Assuming initial root is 0
    let new_root: felt252 = 99887766;

    let dispatcher = deploy_identity_registry(admin);

    // Verify initial root (assuming default value)
    let current_root = dispatcher.get_revocation_root();
    // Note: Default felt252 might not be 0, depends on storage initialization.
    // If the contract doesn't set it in constructor, it might be address 0.
    // Let's assume it's 0 based on typical initialization.
    assert(current_root == initial_root, 'Initial root incorrect');

    // Update the root (as admin)
    start_cheat_caller_address(dispatcher.contract_address, admin);
    dispatcher.update_revocation_root(new_root);
    stop_cheat_caller_address(dispatcher.contract_address);

    // Verify the updated root
    let updated_root = dispatcher.get_revocation_root();
    assert(updated_root == new_root, 'Updated root incorrect');
}
