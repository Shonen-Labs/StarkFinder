export const simpleContract = `
/// This interface allows modification and retrieval of the contract balance.
#[starknet::interface]
pub trait IHelloStarknet<TContractState> {
    /// Increase contract balance.
    fn increase_balance(ref self: TContractState, amount: felt252);
    /// Retrieve contract balance.
    fn get_balance(self: @TContractState) -> felt252;
}

/// Simple contract for managing balance.
#[starknet::contract]
mod HelloStarknet {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        balance: felt252,
    }

    #[abi(embed_v0)]
    impl HelloStarknetImpl of super::IHelloStarknet<ContractState> {
        fn increase_balance(ref self: ContractState, amount: felt252) {
            assert(amount != 0, 'Amount cannot be 0');
            self.balance.write(self.balance.read() + amount);
        }

        fn get_balance(self: @ContractState) -> felt252 {
            self.balance.read()
        }
    }
}
`;

export const contractWithConstructor = `
use starknet::{ContractAddress};

#[starknet::interface]
pub trait IStarknetContract<TContractState> {
    /// Transfer token
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256);
    /// Retrieve balance.
    fn get_balance(self: @TContractState, account: ContractAddress) -> u256;
    /// Retrieve total supply
    fn get_total_supply(self: @TContractState) -> u256;
}

#[starknet::contract]
mod contract {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, Map, StorageMapReadAccess,
        StorageMapWriteAccess,
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        balance: Map<ContractAddress, u256>,
        total_supply: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        value: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256) {
        let sender = get_caller_address();
        self.owner.write(sender);
        self.total_supply.write(initial_supply);
        self.balance.write(sender, initial_supply);
    }

    #[abi(embed_v0)]
    impl StarknetImpl of super::IStarknetContract<ContractState> {
        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            let sender = get_caller_address();
            let sender_balance = self.balance.read(sender);
            assert(sender_balance >= amount, 'Insufficient balance');

            self.balance.write(sender, sender_balance - amount);
            self.balance.write(recipient, self.balance.read(recipient) + amount);

            self.emit(Event::Transfer(Transfer { from: sender, to: recipient, value: amount }));
        }

        fn get_balance(self: @ContractState, account: ContractAddress) -> u256 {
            self.balance.read(account)
        }

        fn get_total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }
    }
}
`;

export const validScarbToml = `
[package]
name = "generated_contract"
version = "0.1.0"
edition = "2024_07"
cairo_version = "2.8.0"

[dependencies]
starknet = "2.8.0"

[[target.starknet-contract]]
sierra = true
casm = true

[cairo]
sierra-replace-ids = true
`;

export const badContract = `
/// Simple contract for managing balance.
#[starknet::contract]
mod HelloStarknet {
    #[storage]
    struct Storage {
        balance: felt252,
    }

    #[abi(embed_v0)]
    impl HelloStarknetImpl of super::IHelloStarknet<ContractState> {
        fn increase_balance(ref self: ContractState, amount: felt252) {
            assert(amount != 0, 'Amount cannot be 0');
            self.balance.write(self.balance.read() + amount);
        }

        fn get_balance(self: @ContractState) -> felt252 {
            self.balance.read()
        }
    }
}
`;
