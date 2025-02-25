use starknet::{ContractAddress, contract_address_const};
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, cheat_caller_address, CheatSpan,
    cheat_block_timestamp, spy_events, EventSpyAssertionsTrait,
};
use core::traits::TryInto;
use contracts::interfaces::IDefiVault::{IDefiVaultDispatcher, IDefiVaultDispatcherTrait};
use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

fn USER1() -> ContractAddress {
    contract_address_const::<'USER1'>()
}

fn USER2() -> ContractAddress {
    contract_address_const::<'USER2'>()
}

fn deploy_contract(interest_rate: u256) -> ContractAddress {
    let contract = declare("DefiVault").unwrap().contract_class();
    let mut calldata = ArrayTrait::new();
    interest_rate.serialize(ref calldata);
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    contract_address
}

fn deploy_erc20() -> ContractAddress {
    let name: ByteArray = "MockToken";
    let contract = declare("MockToken").unwrap().contract_class();

    let mut constructor_calldata = ArrayTrait::new();
    name.serialize(ref constructor_calldata);

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

#[test]
fn test_deposit() {
    let token = deploy_erc20();
    let vault = deploy_contract(10);

    let vault_dispatcher = IDefiVaultDispatcher { contract_address: vault };
    let erc20_dispatcher = IERC20Dispatcher { contract_address: token };

    // Approve and deposit tokens
    erc20_dispatcher.mint(USER1(), 1000);
    cheat_caller_address(token, USER1(), CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(vault, 1000);
    cheat_caller_address(vault, USER1(), CheatSpan::TargetCalls(1));
    vault_dispatcher.deposit(token, 1000);

    assert(vault_dispatcher.get_balance(USER1(), token) == 1000, 'Deposit failed');
    let vault_balance = erc20_dispatcher.balance_of(vault);
    assert(vault_balance == 1000, 'Vault_not_hold_transfered_token');
}

#[test]
fn test_withdraw() {
    let token = deploy_erc20();
    let vault = deploy_contract(10);

    let vault_dispatcher = IDefiVaultDispatcher { contract_address: vault };
    let erc20_dispatcher = IERC20Dispatcher { contract_address: token };

    // Approve and deposit tokens
    erc20_dispatcher.mint(USER1(), 1000);
    cheat_caller_address(token, USER1(), CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(vault, 1000);
    cheat_caller_address(vault, USER1(), CheatSpan::TargetCalls(2));
    vault_dispatcher.deposit(token, 1000);

    // Withdraw tokens
    vault_dispatcher.withdraw(token, 500);

    assert(vault_dispatcher.get_balance(USER1(), token) == 500, 'Withdrawal failed');
    let vault_balance = erc20_dispatcher.balance_of(vault);
    assert(vault_balance == 500, 'Vault_not_hold_transfered_token');
}

#[test]
fn test_calculate_yield() {
    let token = deploy_erc20();
    let vault = deploy_contract(10);

    let vault_dispatcher = IDefiVaultDispatcher { contract_address: vault };
    let erc20_dispatcher = IERC20Dispatcher { contract_address: token };

    // Mint and deposit tokens
    erc20_dispatcher.mint(USER1(), 1000);
    cheat_caller_address(token, USER1(), CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(vault, 1000);
    cheat_caller_address(vault, USER1(), CheatSpan::TargetCalls(1));
    vault_dispatcher.deposit(token, 1000);

    // Advance time to simulate yield accumulation
    let timestamp = starknet::get_block_timestamp() + 1000;
    cheat_block_timestamp(vault, timestamp, CheatSpan::TargetCalls(1));

    // Calculate expected yield manually
    let expected_yield = (1000 * 10 * 1000) / 1000000; // (balance * rate * time) / 1000000

    let calculated_yield = vault_dispatcher.calculate_yield(USER1(), token);

    assert(calculated_yield == expected_yield, 'Yield_calculation_incorrect');
}
#[test]
fn test_withdraw_with_yield_farming() {
    let token = deploy_erc20();
    let vault = deploy_contract(10); // Interest rate set to 10

    let vault_dispatcher = IDefiVaultDispatcher { contract_address: vault };
    let erc20_dispatcher = IERC20Dispatcher { contract_address: token };

    erc20_dispatcher.mint(USER2(), 1000);
    cheat_caller_address(token, USER2(), CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(vault, 1000);
    cheat_caller_address(vault, USER2(), CheatSpan::TargetCalls(1));
    vault_dispatcher.deposit(token, 1000);

    // Mint and deposit tokens for user 1
    erc20_dispatcher.mint(USER1(), 1000);
    cheat_caller_address(token, USER1(), CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(vault, 1000);
    cheat_caller_address(vault, USER1(), CheatSpan::TargetCalls(1));
    vault_dispatcher.deposit(token, 1000);

    // Advance time to allow yield accumulation
    let timestamp = starknet::get_block_timestamp() + 5000;
    cheat_block_timestamp(vault, timestamp, CheatSpan::TargetCalls(1));

    // Calculate expected yield
    let expected_yield = (1000 * 10 * 5000) / 1000000;

    // Withdraw full amount including yield
    cheat_caller_address(vault, USER1(), CheatSpan::TargetCalls(1));
    vault_dispatcher.withdraw(token, 1050);

    assert(vault_dispatcher.get_balance(USER1(), token) == 0, 'Balance not zero');

    // Validate the final transfer amount
    let user_balance_after = erc20_dispatcher.balance_of(USER1());
    let expected_final_balance = 1000 + expected_yield;

    assert(user_balance_after == expected_final_balance, 'Wrong final balance');
}

