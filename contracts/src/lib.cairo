use starknet::{
    ContractAddress,
    get_caller_address,
    storage::{
        StorageMapReadAccess,
        StorageMapWriteAccess,
        StoragePointerReadAccess,
        StoragePointerWriteAccess,
        Map
    },
};

#[starknet::interface]
pub trait IToken<TState> {
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn owner(self: @TState) -> ContractAddress;
    fn transfer(ref self: TState, to: ContractAddress, value: u256);
}

#[starknet::contract]
pub mod contract {
    use super::{
        ContractAddress,
        get_caller_address,
        StorageMapReadAccess,
        StorageMapWriteAccess,
        StoragePointerReadAccess,
        StoragePointerWriteAccess,
        Map,
        IToken,
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        balances: Map<ContractAddress, u256>,
        total_supply: u256
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: TransferEvent
    }

    #[derive(Drop, starknet::Event)]
    struct TransferEvent {
        from: ContractAddress,
        to: ContractAddress,
        value: u256
    }

    #[constructor]
    pub fn constructor(ref self: ContractState, initial_supply: u256) {
        let owner = get_caller_address();
        self.owner.write(owner);
        self.balances.write(owner, initial_supply);
        self.total_supply.write(initial_supply);
    }

    #[abi(embed_v0)]
    pub impl ITokenImpl of IToken<ContractState> {
        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn transfer(ref self: ContractState, to: ContractAddress, value: u256) {
            let caller = get_caller_address();
            let from_balance = self.balances.read(caller);
            assert(from_balance >= value, 'Insufficient balance');

            let to_balance = self.balances.read(to);
            self.balances.write(caller, from_balance - value);
            self.balances.write(to, to_balance + value);

            self.emit(Event::Transfer(TransferEvent { from: caller, to, value }));
        }
    }
}