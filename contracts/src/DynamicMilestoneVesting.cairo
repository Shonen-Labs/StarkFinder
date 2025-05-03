#[starknet::contract]
pub mod DynamicMilestoneVesting {
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};
    // import LegacyMap
    use starknet::storage::{
        Map, StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess,
        StorageMapWriteAccess,
    };
    use contracts::interfaces::IDynamicMilestoneVesting::IDynamicMilestoneVesting;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::starknet::get_block_number;

    // Define storage variables
    #[storage]
    pub struct Storage {
        owner: ContractAddress,
        token: ContractAddress,
        beneficiary: ContractAddress,
        total_allocation: u256,
        milestones: Map<u32, Milestone>,
        milestone_count: u32,
        achieved_milestones: Map<u32, bool>,
        total_percentage_unlocked: u8,
        amount_released: u256,
        is_revoked: bool // Added state variable for revocation
    }

    #[derive(Copy, Drop, Serde, PartialEq, starknet::Store)]
    pub struct Milestone {
        pub id: u32,
        pub description: felt252,
        pub unlock_percentage: u8, // Must total 100% across all milestones
        pub cliff_date: u64 // Added cliff date (e.g., block number or timestamp)
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        token: ContractAddress,
        beneficiary: ContractAddress,
        total_allocation: u256,
    ) {
        self.owner.write(owner);
        self.token.write(token);
        self.beneficiary.write(beneficiary);
        self.total_allocation.write(total_allocation);
        self.is_revoked.write(false); // Initialize revocation status
    }

    // --- Events ---
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        MilestoneAdded: MilestoneAdded,
        MilestoneAchieved: MilestoneAchieved,
        TokensReleased: TokensReleased,
        VestingRevoked: VestingRevoked, // Added revocation event
        RemainingTokensReturned: RemainingTokensReturned // Added event for returning tokens
    }

    #[derive(Drop, starknet::Event)]
    pub struct MilestoneAdded {
        pub id: u32,
        pub description: felt252,
        pub unlock_percentage: u8,
        pub cliff_date: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MilestoneAchieved {
        pub id: u32,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokensReleased {
        pub beneficiary: ContractAddress,
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VestingRevoked {
        pub revoked_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RemainingTokensReturned {
        pub recipient: ContractAddress,
        pub amount: u256,
    }

    // --- Internal Functions ---
    // Define internal helper functions in an impl block with #[generate_trait]
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        // Owner-only check
        fn only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner can call this');
        }

        // Beneficiary-only check
        fn only_beneficiary(self: @ContractState) {
            let caller = get_caller_address();
            let beneficiary = self.beneficiary.read();
            assert(caller == beneficiary, 'Only beneficiary can call this');
        }

        // Check if vesting is not revoked
        fn assert_not_revoked(self: @ContractState) {
            assert(!self.is_revoked.read(), 'Vesting is revoked');
        }
    }

    // Implement the contract interface
    #[abi(embed_v0)]
    pub impl DynamicMilestoneVestingImpl of IDynamicMilestoneVesting<ContractState> {
        // --- Add a milestone ---
        fn add_milestone(
            ref self: ContractState,
            id: u32,
            description: felt252,
            unlock_percentage: u8,
            cliff_date: u64,
        ) {
            self.only_owner();
            self.assert_not_revoked(); // Cannot add milestones after revocation

            let exists = self.milestones.read(id);
            // Check if milestone exists by checking if unlock_percentage is non-zero
            assert(exists.unlock_percentage == 0, 'Milestone already exists');

            self
                .milestones
                .write(
                    id,
                    Milestone {
                        id, description, unlock_percentage, cliff_date // Store cliff date
                    },
                );

            let count = self.milestone_count.read();
            self.milestone_count.write(count + 1);

            self
                .emit(
                    Event::MilestoneAdded(
                        MilestoneAdded { id, description, unlock_percentage, cliff_date },
                    ),
                );
        }

        // --- Mark a milestone as achieved ---
        fn achieve_milestone(ref self: ContractState, id: u32) {
            self.only_owner();
            self.assert_not_revoked(); // Cannot achieve milestones after revocation

            let milestone = self.milestones.read(id);
            assert(milestone.unlock_percentage != 0, 'Milestone does not exist');

            let already_achieved = self.achieved_milestones.read(id);
            assert(already_achieved == false, 'Milestone already achieved');

            self.achieved_milestones.write(id, true);

            let current_total = self.total_percentage_unlocked.read();
            self.total_percentage_unlocked.write(current_total + milestone.unlock_percentage);

            self.emit(Event::MilestoneAchieved(MilestoneAchieved { id }));
        }

        // --- Check how much is releasable ---
        fn releasable_amount(self: @ContractState) -> u256 {
            self.assert_not_revoked();

            let total_allocation = self.total_allocation.read();
            let already_released = self.amount_released.read();
            let milestone_count = self.milestone_count.read(); // Max milestone ID added
            let current_block = get_block_number(); // Get current block number 

            let mut effective_unlocked_percentage =
                0_u8; // Calculate percentage from achieved milestones whose cliff passed

            // Iterate through possible milestone IDs
            let mut i = 1_u32;
            loop {
                if i > milestone_count {
                    break;
                }

                let achieved = self.achieved_milestones.read(i);
                if achieved {
                    let milestone = self.milestones.read(i);
                    // Check if cliff date has passed for this achieved milestone
                    if current_block >= milestone.cliff_date {
                        effective_unlocked_percentage += milestone.unlock_percentage;
                    }
                }

                i += 1;
            };

            // Perform calculation using u256 with the effective percentage
            let unlocked_tokens: u256 = total_allocation
                * effective_unlocked_percentage.into()
                / 100_u256;
            let pending = unlocked_tokens - already_released;

            pending
        }

        // --- Release tokens to beneficiary ---
        fn release(ref self: ContractState) {
            self.only_beneficiary();
            self.assert_not_revoked(); // Cannot release if revoked

            let pending = self.releasable_amount();
            assert(pending > 0_u256, 'No tokens to release');

            self.amount_released.write(self.amount_released.read() + pending);

            // Transfer tokens to beneficiary
            let erc20_dispatcher = IERC20Dispatcher { contract_address: self.token.read() };
            let beneficiary = self.beneficiary.read();
            erc20_dispatcher.transfer(beneficiary, pending);

            self.emit(Event::TokensReleased(TokensReleased { beneficiary, amount: pending }));
        }

        // --- Get milestone details ---
        fn get_milestone(
            self: @ContractState, id: u32,
        ) -> (felt252, u8, u64, bool) { // Updated return type
            let milestone = self.milestones.read(id);
            let achieved = self.achieved_milestones.read(id);
            (
                milestone.description, milestone.unlock_percentage, milestone.cliff_date, achieved,
            ) // Include cliff_date
        }

        fn get_contract_name(self: @ContractState) -> felt252 {
            'DynamicMilestoneVesting'
        }

        // --- Revoke Vesting ---
        fn revoke_vesting(ref self: ContractState) {
            self.only_owner();
            self.assert_not_revoked();

            self.is_revoked.write(true);

            let caller = get_caller_address();
            self.emit(Event::VestingRevoked(VestingRevoked { revoked_by: caller }));

            // Handle remaining tokens: calculate and return to owner
            let total_allocation = self.total_allocation.read();
            let amount_released = self.amount_released.read();
            let remaining_amount = total_allocation - amount_released;

            if remaining_amount > 0_u256 {
                let token_address = self.token.read();
                let owner_address = self.owner.read();
                let erc20_dispatcher = IERC20Dispatcher { contract_address: token_address };

                // Transfer remaining tokens from this contract to the owner
                erc20_dispatcher
                    .transfer(
                        owner_address, remaining_amount,
                    ); // Uses the contract's balance [4, 9]

                // Update amount_released to reflect that all tokens are now accounted for (released
                // or returned)
                self.amount_released.write(total_allocation);

                self
                    .emit(
                        Event::RemainingTokensReturned(
                            RemainingTokensReturned {
                                recipient: owner_address, amount: remaining_amount,
                            },
                        ),
                    );
            }
        }

        // --- Check revocation status ---
        fn is_vesting_revoked(self: @ContractState) -> bool {
            self.is_revoked.read()
        }
    }
}

