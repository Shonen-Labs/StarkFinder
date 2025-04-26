#[starknet::contract]

mod EvolvingNFT {
    use starknet::get_caller_address;
    use starknet::ContractAddress;
    use starknet::get_block_timestamp;
    use array::ArrayTrait;
    use opinion::OpinionTrait;
    use traits::Into;
    use zeroable::Zeroable;


    //Main storage for NFT data
    #[storage]
    struct Storage {
        name: felt252;
        symbol: felt252;
        owner: ContractAddress;


        //NFT Storage
        token_uri_base: felt252;
        token_owners: LegacyMap<u256, ContractAddress>;
        balances: LegacyMap<ContractAddress, u256>;
        total_supply: u256;

        //metadata evolution storage
        metadata_hashes: LegacyMap<u256, felt252>;

        // Time-based evolution tracking
        evolution_timestamps: LegacyMap<u256, u64>;
        evolution_stages: LegacyMap<u256, u8>;
        max_evolution_stage: u8;


        //Interaction-based evolution tracking
        interaction_counts: LegacyMap<u256, u32>;
        interaction_threshold: u32;

        // Authorized Updater
        authorized_updaters: LegacyMap<ContractAddress, bool>;
    }


    //Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        Metadata Updated: MetadataUpdated,
        Evolution Stage Changed: EvolutionStageChanged,
        Authorization Changed: AuthorizationChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct MetadataUpdated {
        token_id: u256,
        new_hash: felt252
    }


    #[derive(Drop, starknet::Event)]
    struct AuthorizationChanged {
        updater: ContractAddress,
        authorized: bool
    }


    //Contract Errors
    mod Errors {
        const UNAUTHORIZED: felt252 = 'Caller not authorized';
        const TOKEN_NONEXISTENT: felt252 = 'Token does not exist';
        const NOT_OWNER: felt252 = 'Caller is not owner';
        const INVALID_STAGE: felt252 = 'Invalid evolution stage';
        const EVOLUTION_REQUIREMENT_NOT_MET: felt252 = 'Evolution requirement not met';
    }


    //Constructor
    #[constructor]
    fn constructor (
        ref self: ContractState,
        name: felt252,
        symbol: felt252,
        token_uri_base: felt252,
        max_evolution_stage: u8,
        interaction_threshold: u32,
    ) {
        let caller = get_caller_address();
        self.name.write(name);
        self.symbol.write(symbol);
        self.owner.write(caller);
        self.token_uri_base.write(token_uri_base);
        self.max_evolution_stage.write(max_evolution_stage);
        self.interaction_threshold.write(interaction_threshold);
        self.total_supply.write(0);


        // Initialize the authorized updater to the contract owner
        self.authorized_updaters.write(caller, true)
    }

    #[external(v0)]
    impl EvolvingNFTImpl of super:: IEvolvingNFT<ContractState> {
        //NFT functionality
        fn name(self: @ContractState) -> felt252 {
            self.name.read()
        }


        fn symbol(self: @ContractState) -> felt252 {
            self.symbol.read()
        }

        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let owner = self.token_owners.read(token_id);
            assert(!owner.is_zero(), Errors::TOKEN_NONEXISTENT);
            owner
        }

        fn balance_of(self: @ContractState, owner: ContractAddress) -> u256{
            self.balances.read(owner)
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            // Verify token exists
            let owner = self.token_owners.read(token_id);
            assert(!owner.is_zero(), Errors::TOKEN_NONEXISTENT);


            // Get the evolution stage for the token
            let stage = self.evolution_stages.read(token_id);

            // Get metadata hash for the token
            let metadata_hash = self.metadata_hashes.read(token_id);

            // Construct the token URI
            let token_id_str = u256_to_string(token_id);


            // Get base URI
            let base_uri = self.token_uri_base.read();
            let base_uri_bytes = felt252_to_bytes(base_uri);

            // Construct the full token URI
            // Format: {base_uri}/{token_id}/{stage}/{metadata_hash}
            let mut complete_uri = base_uri_bytes;

            // Add slash at the end of base_uri if not present
            if !ends_with_char(complete_uri, '/') {
                complete_uri.append_byte(0x2f);
            }

            // Append token_id
            complete_uri.append(token_id_str);
            complete_uri.append_byte(0x2f);


            // Append stage
            let stage_str = u8_to_string(stage);
            complete_uri.append(stage_str);
        }
    }



}