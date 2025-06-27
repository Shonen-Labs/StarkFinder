use starknet::ContractAddress;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
use fee_deduction::{IFeeDeductionDispatcher, IFeeDeductionDispatcherTrait};

// Simple test to verify constructor works
#[test]
fn test_constructor() {
    let owner: ContractAddress = 0x123.try_into().unwrap();
    let strk_token_address: ContractAddress = 0x456.try_into().unwrap();
    let initial_fee_amount: u256 = 100000000000000000; // 0.1 STRK
    
    let contract = declare("FeeDeduction").unwrap().contract_class();
    let constructor_args = array![
        strk_token_address.into(),
        initial_fee_amount.low.into(),
        initial_fee_amount.high.into(),
        owner.into()
    ];
    let (contract_address, _) = contract.deploy(@constructor_args).unwrap();
    let fee_contract = IFeeDeductionDispatcher { contract_address };
    
    assert(fee_contract.get_owner() == owner, 'Wrong owner');
    assert(fee_contract.get_strk_token_address() == strk_token_address, 'Wrong token address');
    assert(fee_contract.get_fee_amount() == initial_fee_amount, 'Wrong fee amount');
}

#[test]
fn test_set_fee_amount() {
    let owner: ContractAddress = 0x123.try_into().unwrap();
    let strk_token_address: ContractAddress = 0x456.try_into().unwrap();
    let initial_fee_amount: u256 = 100000000000000000; // 0.1 STRK
    
    let contract = declare("FeeDeduction").unwrap().contract_class();
    let constructor_args = array![
        strk_token_address.into(),
        initial_fee_amount.low.into(),
        initial_fee_amount.high.into(),
        owner.into()
    ];
    let (contract_address, _) = contract.deploy(@constructor_args).unwrap();
    let fee_contract = IFeeDeductionDispatcher { contract_address };
    
    let new_fee_amount: u256 = 200000000000000000; // 0.2 STRK
    
    start_cheat_caller_address(contract_address, owner);
    fee_contract.set_fee_amount(new_fee_amount);
    stop_cheat_caller_address(contract_address);
    
    assert(fee_contract.get_fee_amount() == new_fee_amount, 'Fee amount not updated');
}

#[test]
#[should_panic(expected: ('Only owner can call',))]
fn test_set_fee_amount_not_owner() {
    let owner: ContractAddress = 0x123.try_into().unwrap();
    let not_owner: ContractAddress = 0x456.try_into().unwrap();
    let strk_token_address: ContractAddress = 0x789.try_into().unwrap();
    let initial_fee_amount: u256 = 100000000000000000; // 0.1 STRK
    
    let contract = declare("FeeDeduction").unwrap().contract_class();
    let constructor_args = array![
        strk_token_address.into(),
        initial_fee_amount.low.into(),
        initial_fee_amount.high.into(),
        owner.into()
    ];
    let (contract_address, _) = contract.deploy(@constructor_args).unwrap();
    let fee_contract = IFeeDeductionDispatcher { contract_address };
    
    let new_fee_amount: u256 = 200000000000000000; // 0.2 STRK
    
    start_cheat_caller_address(contract_address, not_owner);
    fee_contract.set_fee_amount(new_fee_amount);
    stop_cheat_caller_address(contract_address);
}

#[test]
fn test_set_owner() {
    let owner: ContractAddress = 0x123.try_into().unwrap();
    let new_owner: ContractAddress = 0x456.try_into().unwrap();
    let strk_token_address: ContractAddress = 0x789.try_into().unwrap();
    let initial_fee_amount: u256 = 100000000000000000; // 0.1 STRK
    
    let contract = declare("FeeDeduction").unwrap().contract_class();
    let constructor_args = array![
        strk_token_address.into(),
        initial_fee_amount.low.into(),
        initial_fee_amount.high.into(),
        owner.into()
    ];
    let (contract_address, _) = contract.deploy(@constructor_args).unwrap();
    let fee_contract = IFeeDeductionDispatcher { contract_address };
    
    start_cheat_caller_address(contract_address, owner);
    fee_contract.set_owner(new_owner);
    stop_cheat_caller_address(contract_address);
    
    assert(fee_contract.get_owner() == new_owner, 'Owner not updated');
}

#[test]
fn test_set_strk_token_address() {
    let owner: ContractAddress = 0x123.try_into().unwrap();
    let strk_token_address: ContractAddress = 0x456.try_into().unwrap();
    let new_strk_token_address: ContractAddress = 0x789.try_into().unwrap();
    let initial_fee_amount: u256 = 100000000000000000; // 0.1 STRK
    
    let contract = declare("FeeDeduction").unwrap().contract_class();
    let constructor_args = array![
        strk_token_address.into(),
        initial_fee_amount.low.into(),
        initial_fee_amount.high.into(),
        owner.into()
    ];
    let (contract_address, _) = contract.deploy(@constructor_args).unwrap();
    let fee_contract = IFeeDeductionDispatcher { contract_address };
    
    start_cheat_caller_address(contract_address, owner);
    fee_contract.set_strk_token_address(new_strk_token_address);
    stop_cheat_caller_address(contract_address);
    
    assert(fee_contract.get_strk_token_address() == new_strk_token_address, 'Token address not updated');
}

#[test]
#[should_panic(expected: ('Fee amount must be > 0',))]
fn test_charge_fee_zero_amount() {
    let owner: ContractAddress = 0x123.try_into().unwrap();
    let user: ContractAddress = 0x456.try_into().unwrap();
    let strk_token_address: ContractAddress = 0x789.try_into().unwrap();
    let initial_fee_amount: u256 = 0; // Zero fee
    
    let contract = declare("FeeDeduction").unwrap().contract_class();
    let constructor_args = array![
        strk_token_address.into(),
        initial_fee_amount.low.into(),
        initial_fee_amount.high.into(),
        owner.into()
    ];
    let (contract_address, _) = contract.deploy(@constructor_args).unwrap();
    let fee_contract = IFeeDeductionDispatcher { contract_address };
    
    start_cheat_caller_address(contract_address, user);
    fee_contract.charge_fee_and_execute(42);
    stop_cheat_caller_address(contract_address);
} 