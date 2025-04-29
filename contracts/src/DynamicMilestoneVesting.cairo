// Define the contract interface
#[starknet::interface]
trait IDynamicMilestoneVesting<TContractState> {
    fn add_milestone(ref self: TContractState, id: u32, description: felt252, unlock_percentage: u8);
    fn achieve_milestone(ref self: TContractState, id: u32);
    fn releasable_amount(self: @TContractState) -> u256;
    fn release(ref self: TContractState);
    fn get_milestone(self: @TContractState, id: u32) -> (felt252, u8, bool);
    fn get_contract_name(self: @TContractState) -> felt252;
}

#[starknet::contract]
pub mod DynamicMilestoneVesting {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    // import LegacyMap
    use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        token: ContractAddress,
        beneficiary: ContractAddress,
        total_allocation: u256,
        milestones: Map<u32, Milestone>,
        milestone_count: u32,
        achieved_milestones: Map<u32, bool>,
        total_percentage_unlocked: u8,
        amount_released: u256,
    }

    #[derive(Copy, Drop, Serde, PartialEq, starknet::Store)]
    struct Milestone {
        id: u32,
        description: felt252,
        unlock_percentage: u8, // Must total 100% across all milestones
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        token: ContractAddress,
        beneficiary: ContractAddress,
        total_allocation: u256
    ) {
        self.owner.write(owner);
        self.token.write(token);
        self.beneficiary.write(beneficiary);
        self.total_allocation.write(total_allocation);
    }

    // --- Owner-only modifier ---
    fn only_owner() {
        let caller = get_caller_address();
        let owner = self.owner.read();
        assert(caller == owner, 'Only owner can call this');
    }

    // --- Beneficiary-only modifier ---
    fn only_beneficiary() {
        let caller = get_caller_address();
        let beneficiary = self.beneficiary.read();
        assert(caller == beneficiary, 'Only beneficiary can call this');
    }

    #[abi(embed_v0)]
    impl DynamicMilestoneVestingImpl of super::IDynamicMilestoneVesting<ContractState> {
        // --- Add a milestone ---
        fn add_milestone(ref self: ContractState, id: u32, description: felt252, unlock_percentage: u8) {
            only_owner();

            let exists = self.milestones.read(id);
            assert(exists.unlock_percentage == 0, 'Milestone already exists');

            self.milestones.write(id, Milestone {
                id,
                description,
                unlock_percentage,
            });

            let count = self.milestone_count.read();
            self.milestone_count.write(count + 1);
        }

        // --- Mark a milestone as achieved ---
        fn achieve_milestone(ref self: ContractState, id: u32) {
            only_owner();

            let milestone = self.milestones.read(id);
            assert(milestone.unlock_percentage != 0, 'Milestone does not exist');

            let already_achieved = self.achieved_milestones.read(id);
            assert(already_achieved == false, 'Milestone already achieved');

            self.achieved_milestones.write(id, true);

            let current_total = self.total_percentage_unlocked.read();
            self.total_percentage_unlocked.write(current_total + milestone.unlock_percentage);
        }

        // --- Check how much is releasable ---
        fn releasable_amount(self: @ContractState) -> u256 {
            let unlocked_percentage = self.total_percentage_unlocked.read();
            let total_allocation = self.total_allocation.read();
            let already_released = self.amount_released.read();

            let unlocked_tokens = total_allocation * unlocked_percentage.into() / 100u8.into();
            let pending = unlocked_tokens - already_released;

            pending
        }

        // --- Release tokens to beneficiary ---
        fn release(ref self: ContractState) {
            only_beneficiary();

            let pending = self.releasable_amount();
            assert(pending > 0_u256, 'No tokens to release');

            self.amount_released.write(self.amount_released.read() + pending);

            // Transfer tokens to beneficiary
            let erc20_dispatcher = IERC20Dispatcher { contract_address: self.token.read() };
            let beneficiary = self.beneficiary.read();
            erc20_dispatcher.transfer(beneficiary, pending);
        }

        // --- Get milestone details ---
        fn get_milestone(self: @ContractState, id: u32) -> (felt252, u8, bool) {
            let milestone = self.milestones.read(id);
            let achieved = self.achieved_milestones.read(id);
            (milestone.description, milestone.unlock_percentage, achieved)
        }

        fn get_contract_name(self: @ContractState) -> felt252 {
            'DynamicMilestoneVesting'
        }
    }

    // ERC20 interface
    #[starknet::interface]
    trait IERC20Dispatcher {
        fn transfer(recipient: ContractAddress, amount: u256);
    }
}

