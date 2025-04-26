#[starknet::contract]
mod contract {
    use starknet::{ContractAddress, get_caller_address};
    use core::traits::Into;
    use core::option::OptionTrait;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        is_active: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnershipTransferred: OwnershipTransferred,
        StatusChanged: StatusChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        previous_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct StatusChanged {
        status: bool,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.owner.write(get_caller_address());
        self.is_active.write(true);
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        self.only_owner();
        assert(!new_owner.is_zero(), 'New owner is zero address');
        let previous_owner = self.owner.read();
        self.owner.write(new_owner);
        
        self.emit(Event::OwnershipTransferred(OwnershipTransferred {
            previous_owner: previous_owner,
            new_owner: new_owner,
        }));
    }

    #[external(v0)]
    fn set_status(ref self: ContractState, status: bool) {
        self.only_owner();
        self.is_active.write(status);
        
        self.emit(Event::StatusChanged(StatusChanged { status }));
    }

    #[external(v0)]
    fn get_status(self: @ContractState) -> bool {
        self.is_active.read()
    }

    #[external(v0)]
    fn get_owner(self: @ContractState) -> ContractAddress {
        self.owner.read()
    }

    trait OwnershipChecks {
        fn only_owner(ref self: ContractState);
    }

    impl OwnershipChecksImpl of OwnershipChecks {
        fn only_owner(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Caller is not the owner');
        }
    }
}