// Define the contract interface
#[starknet::interface]
pub trait IDynamicMilestoneVesting<TContractState> {
    fn add_milestone(
        ref self: TContractState,
        id: u32,
        description: felt252,
        unlock_percentage: u8,
        cliff_date: u64,
    ); // Added cliff_date
    fn achieve_milestone(ref self: TContractState, id: u32);
    fn releasable_amount(self: @TContractState) -> u256;
    fn release(ref self: TContractState);
    fn get_milestone(
        self: @TContractState, id: u32,
    ) -> (felt252, u8, u64, bool); // Added cliff_date to return type
    fn get_contract_name(self: @TContractState) -> felt252;
    fn revoke_vesting(ref self: TContractState); // Added revocation function
    fn is_vesting_revoked(self: @TContractState) -> bool; // Added check for revocation status
}

