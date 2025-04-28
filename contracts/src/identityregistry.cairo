#[starknet::contract]
mod identity_registry {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use contracts::interfaces::IIdentityRegistry::{IIdentityRegistry, Credential, CredentialId};
    use core::starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        credentials: Map<CredentialId, Credential>,
        whitelisted_issuers: Map<ContractAddress, bool>,
        revocation_root: felt252, // Merkle Root of revoked credentials
        admin: ContractAddress,   // Contract owner (admin)
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CredentialIssued: CredentialIssuedEvent,
        CredentialRevoked: CredentialRevokedEvent,
        IssuerWhitelisted: IssuerWhitelistedEvent,
        IssuerRemoved: IssuerRemovedEvent,
    }

    #[derive(Drop, starknet::Event)]
    struct CredentialIssuedEvent {
        owner: ContractAddress,
        issuer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct CredentialRevokedEvent {
        owner: ContractAddress,
        issuer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct IssuerWhitelistedEvent {
        issuer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct IssuerRemovedEvent {
        issuer: ContractAddress,
    }

    #[abi(embed_v0)]
    impl IdentityRegistryImpl of IIdentityRegistry<ContractState> {
        fn issue_credential(
            ref self: ContractState,
            owner: ContractAddress,
            data: felt252,
            expires_at: u64,
            revocation_nonce: felt252
        ) {
            let issuer = get_caller_address();
            assert(self.whitelisted_issuers.read(issuer), 'Issuer not whitelisted');

            let issued_at = get_block_timestamp(); // Use block timestamp
            let credential_id = CredentialId { owner, issuer, issued_at };

            let credential = Credential {
                owner,
                issuer,
                data,
                issued_at,
                expires_at,
                revocation_nonce,
                verified: true,
            };

            self.credentials.write(credential_id, credential);
            self.emit(Event::CredentialIssued(CredentialIssuedEvent { owner, issuer }));
        }

        fn revoke_credential(ref self: ContractState, credential_id: CredentialId) {
            let issuer = get_caller_address();
            let mut credential = self.credentials.read(credential_id);

            assert(credential.issuer == issuer, 'Only issuer can revoke');
            // Here, you need to OFF-CHAIN update Merkle tree, then update root on-chain

            credential.verified = false;
            self.credentials.write(credential_id, credential);

            self.emit(Event::CredentialRevoked(CredentialRevokedEvent {
                owner: credential.owner,
                issuer,
            }));
        }

        fn verify_proof(self: @ContractState, owner: ContractAddress, proof_data: felt252) -> bool {
            // TODO: Validate zk-STARK proof here
            // Dummy logic for now
            true
        }

        fn add_issuer(ref self: ContractState, issuer: ContractAddress) {
            let mut caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin can add issuers');

            self.whitelisted_issuers.write(issuer, true);
            self.emit(Event::IssuerWhitelisted(IssuerWhitelistedEvent { issuer }));
        }

        fn remove_issuer(ref self: ContractState, issuer: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin can remove issuers');

            self.whitelisted_issuers.write(issuer, false);
            self.emit(Event::IssuerRemoved(IssuerRemovedEvent { issuer }));
        }

        fn get_credential(self: @ContractState, credential_id: CredentialId) -> Credential {
            self.credentials.read(credential_id)
        }

        fn is_issuer_whitelisted(self: @ContractState, issuer: ContractAddress) -> bool {
            self.whitelisted_issuers.read(issuer)
        }

        fn get_revocation_root(self: @ContractState) -> felt252 {
            self.revocation_root.read()
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
    }
}
