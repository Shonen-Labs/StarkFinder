#[starknet::contract]
mod contract {
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    // Storage types + access traits (maps + scalars)
    use starknet::storage::{
        Map,
        StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess,
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        balances: Map<ContractAddress, u256>,
        total_supply: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: TransferEvent,
    }

    #[derive(Drop, starknet::Event)]
    struct TransferEvent {
        from: ContractAddress,
        to: ContractAddress,
        value: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256) {
        let owner = get_caller_address();
        self.owner.write(owner);                 // scalar → StoragePointerWriteAccess
        self.balances.write(owner, initial_supply); // map → StorageMapWriteAccess
        self.total_supply.write(initial_supply); // scalar → StoragePointerWriteAccess
    }

    #[starknet::interface]
    trait IToken<TState> {
        fn transfer(ref self: TState, to: ContractAddress, value: u256);
        fn balance_of(self: @TState, account: ContractAddress) -> u256;
        fn total_supply(self: @TState) -> u256;
        fn owner(self: @TState) -> ContractAddress;
    }

    // Export ABI without per-function attributes
    #[abi(embed_v0)]
    impl TokenImpl of IToken<ContractState> {
        fn transfer(ref self: ContractState, to: ContractAddress, value: u256) {
            let caller = get_caller_address();

            let from_balance = self.balances.read(caller);
            assert(from_balance >= value, 'Insufficient balance');

            let to_balance = self.balances.read(to);
            self.balances.write(caller, from_balance - value);
            self.balances.write(to, to_balance + value);

            self.emit(Event::Transfer(TransferEvent { from: caller, to, value })); // use self.emit
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }
}
