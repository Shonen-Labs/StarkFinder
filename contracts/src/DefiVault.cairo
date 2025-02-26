#[starknet::contract]
mod DefiVault {
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{get_caller_address, get_contract_address, get_block_timestamp};
    use core::integer::u256;
    use core::num::traits::Zero;
    use contracts::interfaces::IDefiVault::IDefiVault;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::starknet::storage::Map;
    use starknet::storage::StorageMapReadAccess;
    use starknet::storage::StorageMapWriteAccess;

    #[storage]
    struct Storage {
        balances: Map<(ContractAddress, ContractAddress), u256>,
        deposit_timestamps: Map<(ContractAddress, ContractAddress), u64>,
        interest_rate: u256,
        reentrancy_guard: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Deposit: Deposit,
        Withdraw: Withdraw,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposit {
        #[key]
        sender: ContractAddress,
        token: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct Withdraw {
        #[key]
        recipient: ContractAddress,
        token: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, interest_rate: u256) {
        assert(interest_rate > 0, 'Interest_rate_must_be_positive');
        self.interest_rate.write(interest_rate);
        self.reentrancy_guard.write(false);
    }

    #[abi(embed_v0)]
    impl DeFiVault of IDefiVault<ContractState> {
        /// Deposit ERC-20 tokens into the vault.
        fn deposit(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            let caller = get_caller_address();

            assert(amount > 0, 'Deposit_amount_must_be > 0');
            assert(!token_address.is_zero(), 'Invalid_token_address');

            let erc20 = IERC20Dispatcher { contract_address: token_address };

            // Transfer tokens from user to vault
            erc20.transfer_from(caller, get_contract_address(), amount);

            // Update balance
            let key = (caller, token_address);
            let current_balance = self.balances.read(key);
            self.balances.write(key, current_balance + amount);
            self.deposit_timestamps.write(key, get_block_timestamp());

            self.emit(Event::Deposit(Deposit { sender: caller, token: token_address, amount }));
        }

        /// Withdraw ERC-20 tokens from the vault.
        fn withdraw(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            // Reentrancy protection
            assert(!self.reentrancy_guard.read(), 'Reentrancy detected');
            self.reentrancy_guard.write(true);

            let caller = get_caller_address();
            let key = (caller, token_address);

            // FIX: Ensure balance includes yield
            let balance = self.get_balance(caller, token_address);

            assert(amount > 0, 'Withdraw_amount_must_be > 0');
            assert(balance >= amount, 'Insufficient balance');

            // Deduct the withdrawal amount
            let new_balance = balance - amount;
            self.balances.write(key, new_balance);

            // Reset deposit timestamp after withdrawal
            if new_balance == 0 {
                self.deposit_timestamps.write(key, 0);
            } else {
                self.deposit_timestamps.write(key, get_block_timestamp());
            }

            let erc20 = IERC20Dispatcher { contract_address: token_address };

            // Ensure contract holds enough tokens
            let contract_balance = erc20.balance_of(get_contract_address());
            assert(contract_balance >= amount, 'Vault_not have enough tokens');

            // Transfer tokens
            let success = erc20.transfer(caller, amount);
            assert(success, 'Token transfer failed');

            self
                .emit(
                    Event::Withdraw(Withdraw { recipient: caller, token: token_address, amount }),
                );

            // Reset reentrancy guard
            self.reentrancy_guard.write(false);
        }


        /// Get user balance for a specific token with yield
        fn get_balance(
            self: @ContractState, user: ContractAddress, token_address: ContractAddress,
        ) -> u256 {
            self.balances.read((user, token_address)) + self.calculate_yield(user, token_address)
        }

        /// Calculate yield based on deposit duration.
        fn calculate_yield(
            self: @ContractState, user: ContractAddress, token_address: ContractAddress,
        ) -> u256 {
            let key = (user, token_address);
            let balance = self.balances.read(key);
            let deposit_time = self.deposit_timestamps.read(key);

            assert(balance >= 0, 'No balance found');

            let time_elapsed = get_block_timestamp() - deposit_time;
            let rate = self.interest_rate.read();

            (balance * rate * time_elapsed.into()) / 1000000
        }
    }
}
