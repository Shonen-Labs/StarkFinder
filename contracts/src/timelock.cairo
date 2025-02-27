#[starknet::contract]
pub mod Timelock {
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
        MutableVecTrait,
    };
    use openzeppelin::access::ownable::OwnableComponent;
    use contracts::interfaces::timelock::ITimelock;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        lock_delay: u64,
        deposits: Map<(ContractAddress, ContractAddress), Vec<(u64, u256)>>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        Deposit: Deposit,
        Withdraw: Withdraw,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Deposit {
        #[key]
        pub depositor: ContractAddress,
        #[key]
        pub token: ContractAddress,
        #[key]
        pub timestamp: u64,
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Withdraw {
        #[key]
        pub withdrawer: ContractAddress,
        #[key]
        pub token: ContractAddress,
        #[key]
        pub timestamp: u64,
        pub amount: u256,
    }

    pub mod Errors {
        pub const DEPOSIT_AMOUNT_ZERO: felt252 = 'Deposit amount must be > 0';
        pub const INVALID_TOKEN_ADDRESS: felt252 = 'Invalid token address';
        pub const INVALID_DEPOSITOR_ADDRESS: felt252 = 'Invalid depositor address';
        pub const INSUFFICIENT_WITHDRAWABLE_BALANCE: felt252 = 'Insufficient balance';
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, lock_delay: u64) {
        self.ownable.initializer(owner);
        self.lock_delay.write(lock_delay);
    }

    #[abi(embed_v0)]
    impl TimelockImpl of ITimelock<ContractState> {
        /// Retrieves the lock delay of the Timelock.
        fn lock_delay(self: @ContractState) -> u64 {
            self.lock_delay.read()
        }
        /// Sets the lock delay of the Timelock, only callable by owner.
        fn set_lock_delay(ref self: ContractState, lock_delay: u64) {
            self.ownable.assert_only_owner();
            self.lock_delay.write(lock_delay);
        }
        /// Allows a user to deposit ERC-20 tokens in the Timelock.
        fn deposit(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            // Check if parameters are valid
            assert(!token_address.is_zero(), Errors::INVALID_TOKEN_ADDRESS);
            assert(amount > 0, Errors::DEPOSIT_AMOUNT_ZERO);

            let erc20 = IERC20Dispatcher { contract_address: token_address };
            let caller = get_caller_address();

            // Transfer tokens from user to Timelock
            erc20.transfer_from(caller, get_contract_address(), amount);

            let block_timestamp = get_block_timestamp();
            // Update balance
            self.deposits.entry((caller, token_address)).append().write((block_timestamp, amount));

            // Emit corresponding event
            self
                .emit(
                    Deposit {
                        depositor: caller, token: token_address, timestamp: block_timestamp, amount,
                    },
                );
        }
        /// Allows a user to withdraw ERC-20 tokens from the Timelock.
        fn withdraw(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            // Check if parameters are valid
            assert(!token_address.is_zero(), Errors::INVALID_TOKEN_ADDRESS);
            assert(amount > 0, Errors::DEPOSIT_AMOUNT_ZERO);

            let caller = get_caller_address();
            let withdrawable_balance = self.withdrawable_balance_of(caller, token_address);

            // Check if the withdrawable balance is sufficient
            assert(withdrawable_balance >= amount, Errors::INSUFFICIENT_WITHDRAWABLE_BALANCE);

            let deposits = self.deposits.entry((caller, token_address));
            let block_timestamp = get_block_timestamp();
            let lock_delay = self.lock_delay.read();
            let mut remaining_amount = amount;
            // Update balance
            for i in 0..deposits.len() {
                let (deposit_timestamp, deposit_amount) = deposits.at(i).read();
                if deposit_amount > 0 && block_timestamp >= deposit_timestamp + lock_delay {
                    let remaining_deposit_amount = if remaining_amount > deposit_amount {
                        0
                    } else {
                        deposit_amount - remaining_amount
                    };
                    deposits.at(i).write((deposit_timestamp, remaining_deposit_amount));
                    remaining_amount -= deposit_amount - remaining_deposit_amount;
                }
            };

            let erc20 = IERC20Dispatcher { contract_address: token_address };

            // Transfer tokens from Timelock to user
            erc20.transfer(caller, amount);

            // Emit corresponding event
            self
                .emit(
                    Withdraw {
                        withdrawer: caller,
                        token: token_address,
                        timestamp: block_timestamp,
                        amount,
                    },
                );
        }
        /// Retrieves the withdrawable balance of a depositor for a specific ERC-20 token.
        fn withdrawable_balance_of(
            self: @ContractState,
            depositor_address: ContractAddress,
            token_address: ContractAddress,
        ) -> u256 {
            self._balance_of(depositor_address, token_address, true)
        }
        /// Retrieves the balance of a depositor for a specific ERC-20 token.
        fn balance_of(
            self: @ContractState,
            depositor_address: ContractAddress,
            token_address: ContractAddress,
        ) -> u256 {
            self._balance_of(depositor_address, token_address, false)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _balance_of(
            self: @ContractState,
            depositor_address: ContractAddress,
            token_address: ContractAddress,
            withdrawable: bool,
        ) -> u256 {
            let block_timestamp = get_block_timestamp();
            let lock_delay = self.lock_delay.read();

            // Check if parameters are valid
            assert(!depositor_address.is_zero(), Errors::INVALID_DEPOSITOR_ADDRESS);
            assert(!token_address.is_zero(), Errors::INVALID_TOKEN_ADDRESS);

            let deposits = self.deposits.entry((depositor_address, token_address));
            let mut balance = 0;
            for i in 0..deposits.len() {
                let (deposit_timestamp, deposit_amount) = deposits.at(i).read();
                let condition = if withdrawable {
                    block_timestamp >= deposit_timestamp + lock_delay
                } else {
                    true
                };
                if condition {
                    balance += deposit_amount;
                }
            };
            balance
        }
    }
}
