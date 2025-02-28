use starknet::class_hash::ClassHash;
use starknet::{ContractAddress};

#[starknet::interface]
pub trait IUpgradeableContract<TContractState> {
    fn upgrade(ref self: TContractState, impl_hash: ClassHash);
    fn version(self: @TContractState) -> u8;
    fn upgradeWithAuth(ref self: TContractState, impl_hash: ClassHash);
    fn setAdmin(ref self: TContractState, new_admin: ContractAddress);
    fn getAdmin(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod UpgradeableContract_V0 {
    use super::IUpgradeableContract;
    use starknet::class_hash::ClassHash;
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address};
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        admin: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Upgraded: Upgraded,
        AdminChanged: AdminChanged,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Upgraded {
        pub implementation: ClassHash,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AdminChanged {
        pub new_admin: ContractAddress,
    }

    #[abi(embed_v0)]
    impl UpgradeableContract of IUpgradeableContract<ContractState> {
        fn upgrade(ref self: ContractState, impl_hash: ClassHash) {
            assert(impl_hash.is_non_zero(), 'Class hash cannot be zero');
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
            self.emit(Event::Upgraded(Upgraded { implementation: impl_hash }));
        }

        fn version(self: @ContractState) -> u8 {
            0
        }

        fn upgradeWithAuth(ref self: ContractState, impl_hash: ClassHash) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin can upgrade');
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
        }

        fn setAdmin(ref self: ContractState, new_admin: ContractAddress) {
            self.admin.write(new_admin);
            self.emit(Event::AdminChanged(AdminChanged { new_admin }));
        }

        fn getAdmin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }
    }
}

#[starknet::contract]
pub mod UpgradeableContract_V1 {
    use super::IUpgradeableContract;
    use starknet::class_hash::ClassHash;
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address};
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        admin: ContractAddress,
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
        new_admin: ContractAddress,
    }

    #[abi(embed_v0)]
    impl UpgradeableContract of IUpgradeableContract<ContractState> {
        fn upgrade(ref self: ContractState, impl_hash: ClassHash) {
            assert(impl_hash.is_non_zero(), 'Class hash cannot be zero');
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
            self.emit(Event::Upgraded(Upgraded { implementation: impl_hash }))
        }

        fn version(self: @ContractState) -> u8 {
            1
        }

        fn upgradeWithAuth(ref self: ContractState, impl_hash: ClassHash) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin can upgrade');
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
        }

        fn setAdmin(ref self: ContractState, new_admin: ContractAddress) {
            self.admin.write(new_admin);
            self.emit(Event::AdminChanged(AdminChanged { new_admin }));
        }

        fn getAdmin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }
    }
}

