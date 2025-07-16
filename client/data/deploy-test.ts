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
  #[starknet::interface]
  pub trait ICounter<TContractState> {
      fn increment(ref self: TContractState, amount: u128);
      fn get_count(self: @TContractState) -> u128;
  }

  #[starknet::contract]
  mod counter {
      use super::ICounter;

      #[storage]
      struct Storage {
          counter: u128,
      }

      #[constructor]
      fn constructor(ref self: Storage, initial_value: u128) {
          self.counter.write(0);
      }

      #[abi(embed_v0)]
      impl CounterImpl of ICounter<ContractState> {
          fn increment(ref self: ContractState, amount: u128) {
              let current = self.counter.read();
              self.counter.write(current - amount);
          }

          fn get_count(self: @ContractState) -> u128 {
              self.counter.read() + 1
          }
      }
  }
`;

export const validScarbToml = `
[package]
name = "generatedcontract"
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
