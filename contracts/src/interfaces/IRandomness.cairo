use starknet::ContractAddress;

#[starknet::interface]
pub trait IRandomness<TContractState> {
    fn request_random(
        ref self: TContractState,
        seed: u64,
        callback_address: ContractAddress,
        callback_fee_limit: u128,
        publish_delay: u64,
        num_words: u64,
        calldata: Array<felt252>,
    ) -> u64;
    fn cancel_random_request(
        ref self: TContractState,
        request_id: u64,
        requestor_address: ContractAddress,
        seed: u64,
        minimum_block_number: u64,
        callback_address: ContractAddress,
        callback_fee_limit: u128,
        num_words: u64,
    );
    fn submit_random(
        ref self: TContractState,
        request_id: u64,
        requestor_address: ContractAddress,
        seed: u64,
        minimum_block_number: u64,
        callback_address: ContractAddress,
        callback_fee_limit: u128,
        callback_fee: u128,
        random_words: Span<felt252>,
        proof: Span<felt252>,
        calldata: Array<felt252>,
    );
    fn get_pending_requests(
        self: @TContractState, requestor_address: ContractAddress, offset: u64, max_len: u64,
    ) -> Span<felt252>;


    fn requestor_current_index(self: @TContractState, requestor_address: ContractAddress) -> u64;
    fn get_public_key(self: @TContractState, requestor_address: ContractAddress) -> felt252;
    fn get_payment_token(self: @TContractState) -> ContractAddress;
    fn set_payment_token(ref self: TContractState, token_contract: ContractAddress);

    fn refund_operation(ref self: TContractState, caller_address: ContractAddress, request_id: u64);
    fn get_total_fees(
        self: @TContractState, caller_address: ContractAddress, request_id: u64,
    ) -> u256;
    fn get_out_of_gas_requests(
        self: @TContractState, requestor_address: ContractAddress,
    ) -> Span<u64>;
    fn withdraw_funds(ref self: TContractState, receiver_address: ContractAddress);
    fn get_contract_balance(self: @TContractState) -> u256;
    fn compute_premium_fee(self: @TContractState, caller_address: ContractAddress) -> u128;
    fn get_admin_address(self: @TContractState) -> ContractAddress;
    fn set_admin_address(ref self: TContractState, new_admin_address: ContractAddress);
}
