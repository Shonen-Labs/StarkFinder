use starknet::{ContractAddress};

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct ActivityRecord {
    pub activity_type: felt252, // 'Transaction', 'Stake', 'Swap'
    pub protocol: felt252,
    pub value: u256,
    pub timestamp: u64,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct Identity {
    // Basic Identity
    pub address: ContractAddress,
    pub username: felt252,
    // Web3 Identity Components
    pub ens_name: felt252,
    pub stark_name: felt252,
    pub social_connections: u32,
    pub recovery_address: ContractAddress,
    // DeFi Identity
    pub transaction_volume: u256,
    pub protocols_used: u32,
    // Activity Metrics
    pub last_active: u64,
    pub created_at: u64,
    pub transaction_count: u32,
    pub reputation_score: u32,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct ProtocolUsage {
    pub protocol: felt252,
    pub first_used: u64,
    pub last_used: u64,
    pub interaction_count: u32,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct SocialProof {
    pub platform: felt252,
    pub signature: felt252,
    pub verified_by: ContractAddress,
    pub timestamp: u64,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct VerificationRequest {
    pub requester: ContractAddress,
    pub verification_type: felt252,
    pub status: u8,
    pub timestamp: u64,
}

#[starknet::contract]
pub mod StarkIdentity {
    use super::{ActivityRecord, Identity, ProtocolUsage, SocialProof, VerificationRequest};
    use contracts::interfaces::IStarkIdentity::IStarkIdentity;
    use core::array::ArrayTrait;
    use core::hash::{HashStateTrait};
    use core::poseidon::PoseidonTrait;
    use starknet::{
        ContractAddress, get_block_timestamp, get_caller_address,
        storage::{
            Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
            StoragePointerWriteAccess,
        },
    };

    #[storage]
    struct Storage {
        admin: ContractAddress,
        identities: Map<ContractAddress, Identity>,
        connected_addresses: Map<(ContractAddress, ContractAddress), bool>,
        address_signatures: Map<ContractAddress, felt252>,
        social_verifications: Map<(ContractAddress, felt252), bool>,
        verification_requests: Map<(ContractAddress, felt252), VerificationRequest>,
        verifiers: Map<ContractAddress, bool>,
        social_proofs: Map<(ContractAddress, felt252), SocialProof>,
        protocol_usage: Map<(ContractAddress, felt252), ProtocolUsage>,
        activity_records: Map<(ContractAddress, u256), ActivityRecord>,
        activity_count: Map<ContractAddress, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ActivityRecorded: ActivityRecorded,
        AddressLinked: AddressLinked,
        IdentityCreated: IdentityCreated,
        IdentityUpdated: IdentityUpdated,
        ReputationUpdated: ReputationUpdated,
        SocialVerificationAdded: SocialVerificationAdded,
        VerificationRequested: VerificationRequested,
        VerificationStatusChanged: VerificationStatusChanged,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ActivityRecorded {
        pub address: ContractAddress,
        pub activity_type: felt252,
        pub protocol: felt252,
        pub value: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AddressLinked {
        pub primary_address: ContractAddress,
        pub linked_address: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct IdentityCreated {
        pub address: ContractAddress,
        pub username: felt252,
        pub ens_name: felt252,
        pub stark_name: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct IdentityUpdated {
        pub address: ContractAddress,
        pub field: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ReputationUpdated {
        pub address: ContractAddress,
        pub old_score: u32,
        pub new_score: u32,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SocialVerificationAdded {
        pub address: ContractAddress,
        pub platform: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VerificationRequested {
        pub requester: ContractAddress,
        pub verification_type: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VerificationStatusChanged {
        pub address: ContractAddress,
        pub verification_type: felt252,
        pub status: u8,
        pub timestamp: u64,
    }

    const PROOF_EXPIRY_IN_SECONDS: u64 = 60 * 60 * 24 * 90; // THREE MONTHS IN SECONDS

    const VERIFICATION_PENDING: u8 = 0;
    const VERIFICATION_APPROVED: u8 = 1;
    const VERIFICATION_REJECTED: u8 = 2;

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
    }

    #[abi(embed_v0)]
    impl IStarkIdentityImpl of IStarkIdentity<ContractState> {
        // Create a user identity
        fn create_identity(
            ref self: ContractState,
            username: felt252,
            ens_name: felt252,
            stark_name: felt252,
            recovery_address: ContractAddress,
        ) {
            let caller = get_caller_address();
            assert(!self.identity_exists(caller), 'Identity already exists');

            let identity = Identity {
                address: caller,
                username,
                ens_name,
                stark_name,
                recovery_address,
                social_connections: 0,
                transaction_volume: 0,
                protocols_used: 0,
                last_active: get_block_timestamp(),
                created_at: get_block_timestamp(),
                transaction_count: 0,
                reputation_score: 0,
            };

            self.identities.write(caller, identity);
            self
                .emit(
                    IdentityCreated {
                        address: caller,
                        username,
                        ens_name,
                        stark_name,
                        timestamp: get_block_timestamp(),
                    },
                );
        }

        // Update identity fields with passed value
        fn update_identity(ref self: ContractState, field: felt252, value: felt252) {
            let caller = get_caller_address();
            assert(self.identity_exists(caller), 'Identity does not exist');

            let mut identity = self.identities.read(caller);
            if field == 'username' {
                identity.username = value;
            } else if field == 'ens_name' {
                identity.ens_name = value;
            } else if field == 'stark_name' {
                identity.stark_name = value;
            } else if field == 'recovery_address' {
                identity.recovery_address = value.try_into().unwrap();
            } else {
                // Handle unknown field or error
                assert(false, 'Unknown field');
            }

            self.identities.write(caller, identity);
            self.emit(IdentityUpdated { address: caller, field, timestamp: get_block_timestamp() });
        }

        fn get_identity(self: @ContractState, address: ContractAddress) -> Identity {
            assert(self.identity_exists(address), 'Identity does not exist');
            self.identities.read(address)
        }

        fn identity_exists(self: @ContractState, address: ContractAddress) -> bool {
            let identity = self.identities.read(address);
            identity.created_at != 0
        }

        // Link multiple addresses to one identity
        fn link_address(ref self: ContractState, address_to_link: ContractAddress) {
            let caller = get_caller_address();
            assert(self.identity_exists(caller), 'Identity does not exist');
            assert(
                self.verify_address_ownership(address_to_link), 'Address ownership not verified',
            );

            self.connected_addresses.write((caller, address_to_link), true);
            self
                .emit(
                    AddressLinked {
                        primary_address: caller,
                        linked_address: address_to_link,
                        timestamp: get_block_timestamp(),
                    },
                );
        }

        fn verify_linked_addresses(
            self: @ContractState, address1: ContractAddress, address2: ContractAddress,
        ) -> bool {
            self.connected_addresses.read((address1, address2))
        }

        fn add_verifier(ref self: ContractState, verifier: ContractAddress) {
            let caller = get_caller_address();
            let stored_admin = self.admin.read();
            assert(caller == stored_admin, 'Only caller can add verifier');
            self.verifiers.write(verifier, true);
        }

        fn add_social_verification(
            ref self: ContractState, platform: felt252, verification_proof: felt252,
        ) {
            let caller = get_caller_address();
            assert(self.identity_exists(caller), 'Identity does not exist');
            assert(self.verify_social_proof(platform, verification_proof), 'Invalid verification');

            self.social_verifications.write((caller, platform), true);

            let mut identity = self.identities.read(caller);
            identity.social_connections += 1;
            self.identities.write(caller, identity);

            self
                .emit(
                    SocialVerificationAdded {
                        address: caller, platform, timestamp: get_block_timestamp(),
                    },
                );
        }

        fn submit_social_proof(
            ref self: ContractState,
            platform: felt252,
            user_address: ContractAddress,
            signature: felt252,
        ) {
            let caller = get_caller_address();
            assert(self.verifiers.read(caller), 'Only verifiers submit proofs');

            let proof = SocialProof {
                platform, signature, verified_by: caller, timestamp: get_block_timestamp(),
            };

            self.social_proofs.write((user_address, platform), proof);
        }

        fn verify_social_proof(self: @ContractState, platform: felt252, proof: felt252) -> bool {
            let caller = get_caller_address();
            let stored_proof = self.social_proofs.read((caller, platform));

            // Check that a proof exists.
            if stored_proof.timestamp == 0 {
                return false;
            }

            // Verify that the proof was submitted by a valid verifier.
            let is_verifier = self.verifiers.read(stored_proof.verified_by);
            if !is_verifier {
                return false;
            }

            // Ensure the proof is within the allowed time window.
            let current_time = get_block_timestamp();
            let proof_age = current_time - stored_proof.timestamp;
            if proof_age >= PROOF_EXPIRY_IN_SECONDS {
                return false;
            }

            stored_proof.signature == proof
        }

        fn record_activity(
            ref self: ContractState, activity_type: felt252, protocol: felt252, value: u256,
        ) {
            let caller = get_caller_address();
            assert(self.identity_exists(caller), 'Identity does not exist');

            let current_count = self.activity_count.read(caller);
            let activity = ActivityRecord {
                activity_type, protocol, value, timestamp: get_block_timestamp(),
            };

            self.activity_records.write((caller, current_count), activity);
            self.activity_count.write(caller, current_count + 1);

            let mut identity = self.identities.read(caller);
            identity.transaction_count += 1;
            identity.transaction_volume += value;
            identity.last_active = get_block_timestamp();

            if !self.has_used_protocol(caller, protocol) {
                identity.protocols_used += 1;
            }

            self.identities.write(caller, identity);

            self
                .emit(
                    ActivityRecorded {
                        address: caller,
                        activity_type,
                        protocol,
                        value,
                        timestamp: get_block_timestamp(),
                    },
                );
        }

        fn get_activities(
            self: @ContractState, address: ContractAddress, start_index: u256, limit: u256,
        ) -> Array<ActivityRecord> {
            let mut activities: Array<ActivityRecord> = ArrayTrait::new();
            let total_activities = self.activity_count.read(address);

            let mut i = start_index;
            let end_index = if start_index + limit < total_activities {
                start_index + limit
            } else {
                total_activities
            };

            while i < end_index {
                activities.append(self.activity_records.read((address, i)));
                i += 1;
            };

            activities
        }

        fn request_verification(ref self: ContractState, verification_type: felt252) {
            let caller = get_caller_address();
            assert(self.identity_exists(caller), 'Identity does not exist');

            let request = VerificationRequest {
                requester: caller,
                verification_type,
                status: VERIFICATION_PENDING,
                timestamp: get_block_timestamp(),
            };

            self.verification_requests.write((caller, verification_type), request);
            self
                .emit(
                    VerificationRequested {
                        requester: caller, verification_type, timestamp: get_block_timestamp(),
                    },
                );
        }

        fn update_reputation(ref self: ContractState, address: ContractAddress, points: i32) {
            let caller = get_caller_address();
            assert(self.verifiers.read(caller), 'Not authorized');

            let mut identity = self.identities.read(address);
            assert(self.identity_exists(address), 'Identity does not exist');
            let old_score = identity.reputation_score;

            // Update score (handle overflow/underflow)
            if points >= 0 {
                identity.reputation_score += points.try_into().unwrap();
            } else {
                // Safe subtraction to prevent underflow
                let absolute_points: u32 = (-points).try_into().unwrap();
                if identity.reputation_score >= absolute_points {
                    identity.reputation_score -= absolute_points;
                } else {
                    identity.reputation_score = 0; // Don't go below zero
                }
            }

            self.identities.write(address, identity);
            self
                .emit(
                    ReputationUpdated {
                        address,
                        old_score,
                        new_score: identity.reputation_score,
                        timestamp: get_block_timestamp(),
                    },
                );
        }

        fn record_protocol_usage(
            ref self: ContractState, address: ContractAddress, protocol: felt252,
        ) {
            let current_time = get_block_timestamp();
            let mut usage = self.protocol_usage.read((address, protocol));

            if usage.first_used == 0 {
                usage =
                    ProtocolUsage {
                        protocol,
                        first_used: current_time,
                        last_used: current_time,
                        interaction_count: 1,
                    };
            } else {
                usage.last_used = current_time;
                usage.interaction_count += 1;
            }

            self.protocol_usage.write((address, protocol), usage);
        }

        fn has_used_protocol(
            self: @ContractState, address: ContractAddress, protocol: felt252,
        ) -> bool {
            let usage = self.protocol_usage.read((address, protocol));
            usage.first_used != 0
        }

        fn verify_address_ownership(self: @ContractState, address: ContractAddress) -> bool {
            let caller = get_caller_address();
            if caller == address {
                return true;
            }

            let stored_signature = self.address_signatures.read(caller);
            if stored_signature == 0 {
                return false;
            }

            let expected_signature = self.generate_ownership_signature(caller, address);
            stored_signature == expected_signature
        }

        fn generate_ownership_signature(
            self: @ContractState, owner: ContractAddress, address: ContractAddress,
        ) -> felt252 {
            // Convert ContractAddress to felt252 for hashing
            let owner_felt: felt252 = owner.into();
            let address_felt: felt252 = address.into();

            // Simple hash implementation without using update_with
            let hash_state = PoseidonTrait::new();
            let hash_state = hash_state.update(owner_felt);
            let hash_state = hash_state.update(address_felt);
            hash_state.finalize()
        }

        fn submit_address_signature(
            ref self: ContractState, address: ContractAddress, signature: felt252,
        ) {
            let caller = get_caller_address();
            assert(caller == address, 'Only address owner can submit');
            self.address_signatures.write(address, signature);
        }

        fn update_verification_request(
            ref self: ContractState,
            user: ContractAddress,
            verification_type: felt252,
            new_status: u8,
        ) {
            let caller = get_caller_address();
            assert(self.verifiers.read(caller), 'Not authorized');

            // Retrieve the existing request.
            let mut request = self.verification_requests.read((user, verification_type));
            assert(request.timestamp != 0, 'Verification request not found');

            request.status = new_status;
            self.verification_requests.write((user, verification_type), request);

            self
                .emit(
                    VerificationStatusChanged {
                        address: user,
                        verification_type: verification_type,
                        status: new_status,
                        timestamp: get_block_timestamp(),
                    },
                );
        }
    }
}
