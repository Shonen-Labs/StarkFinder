use core::traits::TryInto;
use starknet::{
    testing,
    ContractAddress,
};

use lib::contract;
use lib::IToken;

fn setup_contract() -> (ContractAddress, contract::ContractState) {
    let owner: ContractAddress = 1.try_into().unwrap();
    testing::set_caller_address(owner);

    // Deploy contract
    let mut state = contract::contract_state_for_testing();
    let initial_supply = u256 { low: 1000, high: 0 };
    contract::constructor(ref state, initial_supply);

    (owner, state)
}

#[test]
fn test_constructor() {
    let (owner, state) = setup_contract();
    let initial_supply = u256 { low: 1000, high: 0 };

    assert(
        contract::ITokenImpl::total_supply(@state) == initial_supply,
        'Wrong total supply'
    );
    assert(
        contract::ITokenImpl::balance_of(@state, owner) == initial_supply,
        'Wrong owner balance'
    );
    assert(
        contract::ITokenImpl::owner(@state) == owner,
        'Wrong owner address'
    );
}

#[test]
fn test_transfer() {
    let (owner, mut state) = setup_contract();
    let recipient: ContractAddress = 2.try_into().unwrap();
    let initial_supply = u256 { low: 1000, high: 0 };
    let transfer_amount = u256 { low: 100, high: 0 };
    
    contract::ITokenImpl::transfer(ref state, recipient, transfer_amount);

    assert(
        contract::ITokenImpl::balance_of(@state, owner) == initial_supply - transfer_amount,
        'Wrong sender balance'
    );
    assert(
        contract::ITokenImpl::balance_of(@state, recipient) == transfer_amount,
        'Wrong recipient balance'
    );
}

#[test]
#[should_panic(expected: ('Insufficient balance',))]
fn test_transfer_insufficient_balance() {
    let (_owner, mut state) = setup_contract();
    let recipient: ContractAddress = 2.try_into().unwrap();
    let transfer_amount = u256 { low: 2000, high: 0 };  // More than initial supply

    contract::ITokenImpl::transfer(ref state, recipient, transfer_amount);
}
