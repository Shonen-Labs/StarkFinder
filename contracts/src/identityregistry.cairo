#[starknet::contract]
pub mod identity_registry {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use contracts::interfaces::IIdentityRegistry::{IIdentityRegistry, Credential, CredentialId};
    use core::starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::poseidon::{PoseidonTrait, poseidon_hash_span};
    use core::hash::{HashStateTrait};

    #[storage]
    struct Storage {
        pub credentials: Map<CredentialId, Credential>,
        pub whitelisted_issuers: Map<ContractAddress, bool>,
        pub revocation_root: felt252, // Merkle Root of revoked credentials
        pub admin: ContractAddress,   // Contract owner (admin)
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CredentialIssued: CredentialIssuedEvent,
        CredentialRevoked: CredentialRevokedEvent,
        IssuerWhitelisted: IssuerWhitelistedEvent,
        IssuerRemoved: IssuerRemovedEvent,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CredentialIssuedEvent {
        pub owner: ContractAddress,
        pub issuer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CredentialRevokedEvent {
        pub owner: ContractAddress,
        pub issuer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct IssuerWhitelistedEvent {
        pub issuer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct IssuerRemovedEvent {
        pub issuer: ContractAddress,
    }

    /// Hash wrapper trait.
    /// Assumes T derives Serde.
    trait HashSerializable<T> {
        fn hash(self: @T) -> felt252;
    }

    /// Implements the HashSerializable trait for any type T that derives Serde,
    /// using Poseidon.
    impl HashSerializableImpl<T, impl TSerde: Serde<T>> of HashSerializable<T> {
        fn hash(self: @T) -> felt252 {
            let mut serialized = array![];
            Serde::<T>::serialize(self, ref serialized); // Serialize the struct
            // Use poseidon_hash_span for hashing the serialized data
            let hashed = poseidon_hash_span(serialized.span());
            hashed
        }
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

            credential.verified = false;
            self.credentials.write(credential_id, credential);

            self.emit(Event::CredentialRevoked(CredentialRevokedEvent {
                owner: credential.owner,
                issuer,
            }));
        }

        fn update_revocation_root(ref self: ContractState, new_root: felt252) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin can update root');
        
            self.revocation_root.write(new_root);
        }

        /// Asserts that the given proof is valid for the given leaf and root.
        fn assert_valid_proof(ref self: ContractState, root: felt252, leaf: CredentialId, proof: Span<felt252>) {
            let leaf_node = leaf.hash();
            let computed_root = self.compute_merkle_root(leaf_node, proof);
            assert(computed_root == root, 'Merkle: Invalid proof');
        }
        
        fn compute_merkle_root(ref self: ContractState, current: felt252, proof: Span<felt252>) -> felt252 {
            let mut current = current;
            let mut proof = proof;
            loop {
                match proof.pop_front() {
                    Option::Some(val) => {
                        let p_u256: u256 = (*val).into();
                        // Hash the current node and the proof element using PoseidonTrait 
                        // Maintain ordering based on comparison
                        if current.into() >= p_u256 {
                            // Initialize state, update with current and val, finalize
                            current = PoseidonTrait::new().update(current).update(*val).finalize();
                        } else {
                            // Initialize state, update with val and current, finalize 
                            current = PoseidonTrait::new().update(*val).update(current).finalize();
                        };
                    },
                    Option::None => { break current; },
                };
            }
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
