use starknet::ContractAddress;
use contracts::starkidentity::{ActivityRecord, Identity};

#[starknet::interface]
pub trait IStarkIdentity<TContractState> {
    /// Creates new identity caller with username, ENS name, Stark name, and recovery address.
    fn create_identity(
        ref self: TContractState,
        username: felt252,
        ens_name: felt252,
        stark_name: felt252,
        recovery_address: ContractAddress,
    );
    /// Updates a specific field of the caller's identity.
    fn update_identity(ref self: TContractState, field: felt252, value: felt252);
    /// Retrieves the identity of the specified address.
    fn get_identity(self: @TContractState, address: ContractAddress) -> Identity;
    /// Checks if the identity exists for the specified address.
    fn identity_exists(self: @TContractState, address: ContractAddress) -> bool;
    /// Links an additional address to the caller's identity.
    fn link_address(ref self: TContractState, address_to_link: ContractAddress);
    /// Checks if two addresses are linked
    fn verify_linked_addresses(
        self: @TContractState, address1: ContractAddress, address2: ContractAddress,
    ) -> bool;
    /// Adds a new verifier (admin only).
    fn add_verifier(ref self: TContractState, verifier: ContractAddress);
    /// Adds social verification for the caller's identity.
    fn add_social_verification(
        ref self: TContractState, platform: felt252, verification_proof: felt252,
    );
    /// Submits social proof for a user's identity (verifiers only).
    fn submit_social_proof(
        ref self: TContractState,
        platform: felt252,
        user_address: ContractAddress,
        signature: felt252,
    );
    /// Verifies the provided social proof.
    fn verify_social_proof(self: @TContractState, platform: felt252, proof: felt252) -> bool;
    /// Records a new activity for the caller's identity.
    fn record_activity(
        ref self: TContractState, activity_type: felt252, protocol: felt252, value: u256,
    );
    /// Retrieves recorded activities for the specified address.
    fn get_activities(
        self: @TContractState, address: ContractAddress, start_index: u256, limit: u256,
    ) -> Array<ActivityRecord>;
    /// Sends a verification request for the caller's identity.
    fn request_verification(ref self: TContractState, verification_type: felt252);
    /// Updates the status of the user's verification request (verifiers only).
    fn update_verification_request(
        ref self: TContractState, user: ContractAddress, verification_type: felt252, new_status: u8,
    );
    /// Updates the reputation score of a user's identity.
    fn update_reputation(ref self: TContractState, address: ContractAddress, points: i32);
    /// Records protocol usage for the specified address.
    fn record_protocol_usage(ref self: TContractState, address: ContractAddress, protocol: felt252);
    /// Checks if the specified address has used a given protocol.
    fn has_used_protocol(
        self: @TContractState, address: ContractAddress, protocol: felt252,
    ) -> bool;
    /// Verifies the ownership of an address.
    fn verify_address_ownership(self: @TContractState, address: ContractAddress) -> bool;
    /// Generates an ownership signature for the specified address.
    fn generate_ownership_signature(
        self: @TContractState, owner: ContractAddress, address: ContractAddress,
    ) -> felt252;
    /// Submits the signature to verify address ownership.
    fn submit_address_signature(
        ref self: TContractState, address: ContractAddress, signature: felt252,
    );
}
