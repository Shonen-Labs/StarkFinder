#[starknet::interface]
trait ISimpleStorage<T> {
    fn set(ref self: T, x: u128);
    fn get(self: @T) -> u128;
    fn increment(ref self: T, amount: u128);
    fn decrement(ref self: T, amount: u128);
}

#[starknet::contract]
mod SimpleStorage {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::info::emit_event;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        StoredDataChanged: StoredDataChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct StoredDataChanged {
        old_value: u128,
        new_value: u128,
        caller: ContractAddress
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
            
            emit_event(
                self, 
                Event::StoredDataChanged(StoredDataChanged { 
                    old_value: old_value, 
                    new_value: x,
                    caller: caller
                })
            );
        }

        fn get(self: @ContractState) -> u128 {
            self.stored_data.read()
        }

        fn increment(ref self: ContractState, amount: u128) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Unauthorized: Only owner');
            
            let current = self.stored_data.read();
            let new_value = current.saturating_add(amount);
            self.stored_data.write(new_value);
            
            emit_event(
                self,
                Event::StoredDataChanged(StoredDataChanged { 
                    old_value: current, 
                    new_value: new_value,
                    caller: caller
                })
            );
        }

        fn decrement(ref self: ContractState, amount: u128) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Unauthorized: Only owner');
            
            let current = self.stored_data.read();
            let new_value = current.saturating_sub(amount);
            self.stored_data.write(new_value);
            
            emit_event(
                self,
                Event::StoredDataChanged(StoredDataChanged { 
                    old_value: current, 
                    new_value: new_value,
                    caller: caller
                })
            );
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let deployer = get_caller_address();
        self.owner.write(deployer);
        self.stored_data.write(0);
    }
}