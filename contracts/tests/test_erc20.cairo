use starknet::ContractAddress;

use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
    stop_cheat_caller_address,
};

#[starknet::interface]
pub trait IERC20Combined<TContractState> {
    // IERC20 methods
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata methods
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;

    fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256);
}

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

#[cfg(test)]
fn test_constructor() {
    let contract_address = deploy_contract("NatToken");

    let nat_token_contract = IERC20CombinedDispatcher { contract_address };

    let token_name = nat_token_contract.name();
    let token_symbol = nat_token_contract.symbol();

    assert(token_name == "Nat Token", 'wrong name');
    assert(token_symbol == "NAT", 'wrong symbol');
}

#[cfg(test)]
fn test_total_supply() {
    let contract_address = deploy_contract("NatToken");

    let nat_token_contract = IERC20CombinedDispatcher { contract_address };

    let mint_amount: u256 = 1000_u256;
    let token_recipient: ContractAddress = starknet::contract_address_const::<0x123456711>();

    nat_token_contract.mint(token_recipient, mint_amount);

    assert(nat_token_contract.total_supply() == mint_amount, 'wrong supply');
}

#[cfg(test)]
fn test_balance_of() {
    let contract_address = deploy_contract("NatToken");

    let nat_token_contract = IERC20CombinedDispatcher { contract_address };

    let mint_amount: u256 = 1000_u256;
    let token_recipient: ContractAddress = starknet::contract_address_const::<0x123456711>();

    nat_token_contract.mint(token_recipient, mint_amount);

    assert(nat_token_contract.balance_of(token_recipient) == mint_amount, 'wrong balance');
}

#[cfg(test)]
fn test_approve() {
    let contract_address = deploy_contract("NatToken");
    let nat_token_contract = IERC20CombinedDispatcher { contract_address };

    let token_owner: ContractAddress = starknet::contract_address_const::<0x123450011>();
    let mint_amount: u256 = 1000_u256;
    nat_token_contract.mint(token_owner, mint_amount);
    assert(nat_token_contract.balance_of(token_owner) == mint_amount, 'wrong balance');

    let approve_amount: u256 = 100;
    let token_recipient: ContractAddress = starknet::contract_address_const::<0x123456711>();

    start_cheat_caller_address(contract_address, token_owner);
    nat_token_contract.approve(token_recipient, approve_amount);
    stop_cheat_caller_address(contract_address);

    assert(
        nat_token_contract.allowance(token_owner, token_recipient) == approve_amount,
        'wrong allowance',
    );
}

#[cfg(test)]
fn test_transfer() {
    let contract_address = deploy_contract("NatToken");
    let nat_token_contract = IERC20CombinedDispatcher { contract_address };

    let token_owner: ContractAddress = starknet::contract_address_const::<0x123450011>();
    let mint_amount: u256 = 1000_u256;
    nat_token_contract.mint(token_owner, mint_amount);
    assert(nat_token_contract.balance_of(token_owner) == mint_amount, 'wrong balance');

    let transfer_amount: u256 = 100;
    let token_recipient: ContractAddress = starknet::contract_address_const::<0x123456711>();

    start_cheat_caller_address(contract_address, token_owner);
    nat_token_contract.transfer(token_recipient, transfer_amount);
    stop_cheat_caller_address(contract_address);

    assert(
        nat_token_contract.balance_of(token_recipient) == transfer_amount,
        'balance increment failed',
    );
    assert(
        nat_token_contract.balance_of(token_owner) == mint_amount - transfer_amount,
        'incorrect balance',
    );
}
