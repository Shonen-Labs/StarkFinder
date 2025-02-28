use starknet::ContractAddress;

#[starknet::interface]
pub trait ICoinFlip<TContractState> {
    fn flip(ref self: TContractState);
    fn cancel_stale_flip(ref self: TContractState, flip_id: u64);
}

#[starknet::interface]
pub trait IPragmaVRF<TContractState> {
    fn receive_random_words(
        ref self: TContractState,
        requestor_address: ContractAddress,
        request_id: u64,
        random_words: Span<felt252>,
        calldata: Array<felt252>,
    );
}

#[starknet::contract]
pub mod CoinFlip {
    use core::num::traits::zero::Zero;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    use starknet::storage::{
        Map, StoragePointerReadAccess, StoragePathEntry, StoragePointerWriteAccess,
    };
    use contracts::interfaces::IRandomness::{IRandomnessDispatcher, IRandomnessDispatcherTrait};

    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};


    #[storage]
    struct Storage {
        eth_dispatcher: IERC20Dispatcher,
        flips: Map<u64, ContractAddress>,
        flip_timestamps: Map<u64, u64>,
        nonce: u64,
        randomness_contract_address: ContractAddress,
        callback_fee_limit: u128,
        max_callback_fee_deposit: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Flipped: Flipped,
        Landed: Landed,
        FlipCancelled: FlipCancelled,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Flipped {
        pub flip_id: u64,
        pub flipper: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Landed {
        pub flip_id: u64,
        pub flipper: ContractAddress,
        pub side: Side,
        pub random_value: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FlipCancelled {
        pub flip_id: u64,
        pub flipper: ContractAddress,
    }

    #[derive(Drop, Debug, PartialEq, Serde)]
    pub enum Side {
        Heads,
        Tails,
    }

    pub mod Errors {
        pub const CALLER_NOT_RANDOMNESS: felt252 = 'Caller not randomness contract';
        pub const INVALID_ADDRESS: felt252 = 'Invalid address';
        pub const INVALID_FLIP_ID: felt252 = 'No flip with the given ID';
        pub const REQUESTOR_NOT_SELF: felt252 = 'Requestor is not self';
        pub const TRANSFER_FAILED: felt252 = 'Transfer failed';
        pub const FLIP_NOT_EXPIRED: felt252 = 'Flip not expired';
        pub const UNAUTHORIZED_CANCELLATION: felt252 = 'Only flipper can cancel';
    }

    pub const PUBLISH_DELAY: u64 = 1;
    pub const NUM_OF_WORDS: u64 = 1;
    pub const FLIP_TIMEOUT: u64 = 300; // 5 minutes (assuming 1 second blocks)

    #[constructor]
    fn constructor(
        ref self: ContractState,
        randomness_contract_address: ContractAddress,
        eth_address: ContractAddress,
    ) {
        assert(randomness_contract_address.is_non_zero(), Errors::INVALID_ADDRESS);
        assert(eth_address.is_non_zero(), Errors::INVALID_ADDRESS);

        self.randomness_contract_address.write(randomness_contract_address);
        self.eth_dispatcher.write(IERC20Dispatcher { contract_address: eth_address });
        self.callback_fee_limit.write(100_000_000_000_000); // 0.0001 ETH
        self.max_callback_fee_deposit.write(500_000_000_000_000); // 0.0005 ETH
    }

    #[abi(embed_v0)]
    impl CoinFlip of super::ICoinFlip<ContractState> {
        fn flip(ref self: ContractState) {
            let flip_id = self._request_my_randomness();
            let flipper = get_caller_address();
            self.flips.entry(flip_id).write(flipper);
            self.flip_timestamps.entry(flip_id).write(get_block_timestamp());
            self.emit(Event::Flipped(Flipped { flip_id, flipper }));
        }

        fn cancel_stale_flip(ref self: ContractState, flip_id: u64) {
            let flipper = self.flips.entry(flip_id).read();
            assert(flipper == get_caller_address(), Errors::UNAUTHORIZED_CANCELLATION);

            let timestamp = self.flip_timestamps.entry(flip_id).read();
            assert(get_block_timestamp() - timestamp > FLIP_TIMEOUT, Errors::FLIP_NOT_EXPIRED);

            self.flips.entry(flip_id).write('0'.try_into().unwrap());
            self.flip_timestamps.entry(flip_id).write(0);
            self.emit(Event::FlipCancelled(FlipCancelled { flip_id, flipper }));
        }
    }

    #[abi(embed_v0)]
    impl PragmaVRF of super::IPragmaVRF<ContractState> {
        fn receive_random_words(
            ref self: ContractState,
            requestor_address: ContractAddress,
            request_id: u64,
            random_words: Span<felt252>,
            calldata: Array<felt252>,
        ) {
            let caller = get_caller_address();
            assert(
                caller == self.randomness_contract_address.read(), Errors::CALLER_NOT_RANDOMNESS,
            );
            assert(requestor_address == get_contract_address(), Errors::REQUESTOR_NOT_SELF);

            self._process_coin_flip(request_id, random_words.at(0));
        }
    }

    #[generate_trait]
    impl Private of PrivateTrait {
        fn _request_my_randomness(ref self: ContractState) -> u64 {
            let randomness_contract_address = self.randomness_contract_address.read();
            let eth_dispatcher = self.eth_dispatcher.read();

            // Dynamic fee adjustment check
            let current_fee_limit = self.callback_fee_limit.read();
            let max_deposit = self.max_callback_fee_deposit.read();

            // Verify contract has sufficient balance
            let balance = eth_dispatcher.balance_of(get_contract_address());
            assert(balance >= max_deposit.into(), Errors::TRANSFER_FAILED);

            eth_dispatcher.approve(randomness_contract_address, max_deposit);

            let nonce = self.nonce.read();
            let randomness_dispatcher = IRandomnessDispatcher {
                contract_address: randomness_contract_address,
            };

            let request_id = randomness_dispatcher
                .request_random(
                    nonce,
                    get_contract_address(),
                    current_fee_limit,
                    PUBLISH_DELAY,
                    NUM_OF_WORDS,
                    array![],
                );

            self.nonce.write(nonce + 1);
            request_id
        }

        fn _process_coin_flip(ref self: ContractState, flip_id: u64, random_value: @felt252) {
            let flipper = self.flips.entry(flip_id).read();
            assert(flipper.is_non_zero(), Errors::INVALID_FLIP_ID);

            self.flips.entry(flip_id).write('0'.try_into().unwrap());
            self.flip_timestamps.entry(flip_id).write(0);

            let random_num: u256 = (*random_value).into();
            let side = if random_num % 2 == 0 {
                Side::Heads
            } else {
                Side::Tails
            };

            self
                .emit(
                    Event::Landed(Landed { flip_id, flipper, side, random_value: *random_value }),
                );
        }
    }

    #[external(v0)]
    fn update_callback_fee(ref self: ContractState, new_fee_limit: u128, new_max_deposit: u256) {
        self.callback_fee_limit.write(new_fee_limit);
        self.max_callback_fee_deposit.write(new_max_deposit);
    }
}
