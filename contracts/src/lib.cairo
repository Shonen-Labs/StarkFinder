#[starknet::contract]
mod contract {
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address};
    use core::traits::TryInto;
    use core::option::OptionTrait;
    use starknet::storage::StoragePointerWriteAccess;
    use starknet::storage::StoragePointerReadAccess;


    #[storage]
    struct Storage {
        owner: ContractAddress,
        is_active: bool,
        balance: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnershipTransferred: OwnershipTransferred,
        ContractStatusChanged: ContractStatusChanged,
        BalanceUpdated: BalanceUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        previous_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct ContractStatusChanged {
        is_active: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct BalanceUpdated {
        account: ContractAddress,
        new_balance: u256,
    }

    pub mod Errors {
        pub const INVALID_CALLER: felt252 = 'Caller is not the owner';
        pub const CONTRACT_PAUSED: felt252 = 'Contract is paused';
        pub const INVALID_ADDRESS: felt252 = 'Invalid address provided';
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.owner.write(get_caller_address());
        self.is_active.write(true);
        self.balance.write(0);
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        self.assert_only_owner();
        assert(!new_owner.is_zero(), Errors::INVALID_ADDRESS);
        
        let previous_owner = self.owner.read();
        self.owner.write(new_owner);

        self.emit(Event::OwnershipTransferred(OwnershipTransferred {
            previous_owner: previous_owner,
            new_owner: new_owner,
        }));
    }

    #[external(v0)]
    fn set_contract_status(ref self: ContractState, active: bool) {
        self.assert_only_owner();
        self.is_active.write(active);
        
        self.emit(Event::ContractStatusChanged(ContractStatusChanged {
            is_active: active
        }));
    }

    #[external(v0)]
    fn update_balance(ref self: ContractState, amount: u256) {
        self.assert_only_owner();
        self.assert_contract_active();
        
        self.balance.write(amount);
        
        self.emit(Event::BalanceUpdated(BalanceUpdated {
            account: get_caller_address(),
            new_balance: amount
        }));
    }

    #[external(v0)]

    fn get_owner(self: @ContractState) -> ContractAddress {
        self.owner.read()
    }

    #[external(v0)]

    fn get_contract_status(self: @ContractState) -> bool {
        self.is_active.read()
    }

    #[external(v0)]

    fn get_balance(self: @ContractState) -> u256 {
        self.balance.read()
    }

    #[generate_trait]
    impl Private of PrivateTrait {
        fn assert_only_owner(self: @ContractState) {
            assert(get_caller_address() == self.owner.read(), Errors::INVALID_CALLER);
        }

        fn assert_contract_active(self: @ContractState) {
            assert(self.is_active.read(), Errors::CONTRACT_PAUSED);
        }
    }
}


pub mod ConstantProductAmm;
pub mod crowdfunding;
pub mod DefiVault;
pub mod erc20;
pub mod interfaces;
pub mod merkle;
pub mod mock_erc20;
pub mod mock_erc721;
pub mod NFTDutchAuction;
pub mod random_num;
pub mod SimpleStorage;
pub mod EvolvingNFT;
pub mod starkfinder;
pub mod starkidentity;
pub mod timelock;
pub mod upgradable;
