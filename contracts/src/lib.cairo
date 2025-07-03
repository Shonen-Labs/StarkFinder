mod contract {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage_access::StorageBase;
    use starknet::storage_access::StorageMap;
    use starknet::storage_access::StorageValue;

    #[storage]
    struct Storage {
        owner: StorageValue<ContractAddress>,
        balances: StorageMap<ContractAddress, u256>,
        total_supply: StorageValue<u256>,
    }

    #[event]
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
    fn constructor(initial_supply: u256) {
        let owner = get_caller_address();
        storage.owner.write(owner);
        storage.balances.write(owner, initial_supply);
        storage.total_supply.write(initial_supply);
    }

    #[external]
    fn transfer(to: ContractAddress, value: u256) {
        let caller = get_caller_address();
        let from_balance = storage.balances.read(caller);
        assert(from_balance >= value, 'Insufficient balance');

        let to_balance = storage.balances.read(to);
        storage.balances.write(caller, from_balance - value);
        storage.balances.write(to, to_balance + value);

        emit!(Event::Transfer(TransferEvent { from: caller, to, value }));
    }

    #[external]
    fn balance_of(account: ContractAddress) -> u256 {
        storage.balances.read(account)
    }

    #[external]
    fn total_supply() -> u256 {
        storage.total_supply.read()
    }

    #[external]
    fn owner() -> ContractAddress {
        storage.owner.read()
    }
}