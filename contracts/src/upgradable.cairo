use starknet::class_hash::ClassHash;

#[starknet::interface]
pub trait IUpgradeableContract<TContractState> {
    fn upgrade(ref self: TContractState, impl_hash: ClassHash);
    fn version(self: @TContractState) -> u8;
    fn upgradeWithAuth(ref self: TContractState, impl_hash: ClassHash);
    fn setAdmin(ref self: TContractState, new_admin: felt252);
    fn getAdmin(self: @TContractState) -> felt252;
}

#[starknet::contract]
pub mod UpgradeableContract_V0 {
    use starknet::class_hash::ClassHash;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        admin: felt252,
    }

    #[event]
    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub enum Event {
        Upgraded: Upgraded,
        AdminChanged: AdminChanged,
    }

    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub struct Upgraded {
        pub implementation: ClassHash,
    }

    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub struct AdminChanged {
        pub new_admin: felt252,
    }

    #[abi(embed_v0)]
    impl UpgradeableContract of super::IUpgradeableContract<ContractState> {
        fn upgrade(ref self: ContractState, impl_hash: ClassHash) {
            assert(impl_hash.is_non_zero(), "Class hash cannot be zero");
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
            self.emit(Event::Upgraded(Upgraded { implementation: impl_hash }))
        }

        fn version(self: @ContractState) -> u8 {
            0
        }

        fn upgradeWithAuth(ref self: ContractState, impl_hash: ClassHash) {
            let caller = get_caller_address().unwrap();
            assert(caller == self.admin, "Only admin can upgrade");
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
        }

        fn setAdmin(ref self: ContractState, new_admin: felt252) {
            self.admin = new_admin;
            self.emit(Event::AdminChanged(AdminChanged { new_admin }));
        }

        fn getAdmin(self: @ContractState) -> felt252 {
            self.admin
        }
    }
}


#[starknet::contract]
pub mod UpgradeableContract_V1 {
    use starknet::class_hash::ClassHash;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        admin: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Upgraded: Upgraded,
        AdminChanged: AdminChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct Upgraded {
        implementation: ClassHash,
    }

    #[derive(Drop, starknet::Event)]
    struct AdminChanged {
        new_admin: felt252,
    }

    #[abi(embed_v0)]
    impl UpgradeableContract of super::IUpgradeableContract<ContractState> {
        fn upgrade(ref self: ContractState, impl_hash: ClassHash) {
            assert(impl_hash.is_non_zero(), "Class hash cannot be zero");
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
            self.emit(Event::Upgraded(Upgraded { implementation: impl_hash }))
        }

        fn version(self: @ContractState) -> u8 {
            1
        }

        fn upgradeWithAuth(ref self: ContractState, impl_hash: ClassHash) {
            let caller = get_caller_address().unwrap();
            assert(caller == self.admin, "Only admin can upgrade");
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
        }

        fn setAdmin(ref self: ContractState, new_admin: felt252) {
            self.admin = new_admin;
            self.emit(Event::AdminChanged(AdminChanged { new_admin }));
        }

        fn getAdmin(self: @ContractState) -> felt252 {
            self.admin
        }
    }
}

