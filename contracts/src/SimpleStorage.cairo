#[starknet::interface]
pub trait ISimpleStorage<TContractState> {
    fn set(ref self: TContractState, x: u128);
    fn get(self: @TContractState) -> u128;
    fn increment(ref self: TContractState, amount: u128);
    fn decrement(ref self: TContractState, amount: u128);
}

#[starknet::contract]
mod SimpleStorage {
    use starknet::event::EventEmitter;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::ContractAddress;
    use starknet::get_caller_address;


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        StoredDataChanged: StoredDataChanged,
    }


    #[derive(Drop, starknet::Event)]
    struct StoredDataChanged {
        old_value: u128,
        new_value: u128,
        caller: ContractAddress,
    }

    #[storage]
    struct Storage {
        stored_data: u128,
        owner: ContractAddress,
    }

    #[abi(embed_v0)]
    impl SimpleStorage of super::ISimpleStorage<ContractState> {
        fn set(ref self: ContractState, x: u128) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Unauthorized: Only owner');

            let old_value = self.stored_data.read();
            self.stored_data.write(x);

            self.emit(StoredDataChanged { old_value, new_value: x, caller });
        }

        fn get(self: @ContractState) -> u128 {
            self.stored_data.read()
        }

        fn increment(ref self: ContractState, amount: u128) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Unauthorized: Only owner');

            let current = self.stored_data.read();
            let new_value = current + amount;
            self.stored_data.write(new_value);

            self.emit(StoredDataChanged { old_value: current, new_value, caller });
        }

        fn decrement(ref self: ContractState, amount: u128) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Unauthorized: Only owner');

            let current = self.stored_data.read();
            let new_value = if amount > current {
                0
            } else {
                current - amount
            };
            self.stored_data.write(new_value);

            self.emit(StoredDataChanged { old_value: current, new_value, caller });
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.owner.write(admin);
        self.stored_data.write(0);
    }
}
