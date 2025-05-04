use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct Credential {
    pub owner: ContractAddress,
    pub issuer: ContractAddress,
    pub data: felt252,             // Encrypted or hashed data
    pub issued_at: u64,
    pub expires_at: u64,
    pub revocation_nonce: felt252, // Used for revocation Merkle tree
    pub verified: bool,
}

#[derive(Copy, Drop, Serde, Hash, starknet::Store)]
pub struct CredentialId {
    pub owner: ContractAddress,
    pub issuer: ContractAddress,
    pub issued_at: u64,
}

#[starknet::interface]
pub trait IIdentityRegistry<TContractState> {
    // Identity functions
    fn issue_credential(
        ref self: TContractState,
        owner: ContractAddress,
        data: felt252,
        expires_at: u64,
        revocation_nonce: felt252
    );
    fn revoke_credential(ref self: TContractState, credential_id: CredentialId);

    fn update_revocation_root(ref self: TContractState, new_root: felt252);
    fn assert_valid_proof(ref self: TContractState, root: felt252, leaf: CredentialId, proof: Span<felt252>);
    fn compute_merkle_root(ref self: TContractState, current: felt252, proof: Span<felt252>) -> felt252;

    // Governance functions
    fn add_issuer(ref self: TContractState, issuer: ContractAddress);
    fn remove_issuer(ref self: TContractState, issuer: ContractAddress);

    // View functions
    fn get_credential(self: @TContractState, credential_id: CredentialId) -> Credential;
    fn is_issuer_whitelisted(self: @TContractState, issuer: ContractAddress) -> bool;
    fn get_revocation_root(self: @TContractState) -> felt252;
}