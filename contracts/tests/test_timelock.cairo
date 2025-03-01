use starknet::{ContractAddress, get_block_timestamp};
use openzeppelin::utils::serde::SerializedAppend;
use openzeppelin_testing::constants::{ZERO, OWNER, ALICE};
use openzeppelin_testing::deployment::declare_and_deploy;
use openzeppelin::access::ownable::OwnableComponent;
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use contracts::erc20::{INatTokenDispatcher, INatTokenDispatcherTrait};
use contracts::interfaces::timelock::{
    ITimelockDispatcher, ITimelockDispatcherTrait, ITimelockSafeDispatcher,
    ITimelockSafeDispatcherTrait
};
use contracts::timelock::Timelock;
use snforge_std::{
    start_cheat_caller_address, cheat_caller_address, start_cheat_block_timestamp_global, CheatSpan,
    spy_events, EventSpyAssertionsTrait
};

const LOCK_DELAY: u64 = 3600;
const MINTED_AMOUNT: u256 = 1000;
const DEPOSIT_AMOUNT: u256 = 100;

fn setup() -> (
    ContractAddress, IERC20Dispatcher, ContractAddress, ITimelockDispatcher, ITimelockSafeDispatcher
) {
    let erc20_address = declare_and_deploy("NatToken", array![]);
    let erc20 = IERC20Dispatcher { contract_address: erc20_address };
    let nat_token = INatTokenDispatcher { contract_address: erc20_address };
    let mut timelock_calldata = array![];
    timelock_calldata.append_serde(OWNER());
    timelock_calldata.append_serde(LOCK_DELAY);
    let timelock_address = declare_and_deploy("Timelock", timelock_calldata);
    let timelock = ITimelockDispatcher { contract_address: timelock_address };
    let timelock_safe = ITimelockSafeDispatcher { contract_address: timelock_address };
    nat_token.mint(ALICE(), MINTED_AMOUNT);
    cheat_caller_address(erc20_address, ALICE(), CheatSpan::TargetCalls(1));
    erc20.approve(timelock_address, MINTED_AMOUNT);
    (erc20_address, erc20, timelock_address, timelock, timelock_safe)
}

#[test]
fn test_lock_delay() {
    let (_, _, _, timelock, _) = setup();
    assert_eq!(timelock.lock_delay(), LOCK_DELAY);
}

#[test]
fn test_set_lock_delay_not_owner() {
    let (_, _, _, _, timelock_safe) = setup();
    match timelock_safe.set_lock_delay(LOCK_DELAY * 2) {
        Result::Ok(_) => panic!("Expected OwnableComponent::Errors::NOT_OWNER"),
        Result::Err(panic_data) => assert_eq!(
            *panic_data.at(0), OwnableComponent::Errors::NOT_OWNER
        ),
    };
}

#[test]
fn test_set_lock_delay() {
    let (_, _, timelock_address, timelock, _) = setup();
    cheat_caller_address(timelock_address, OWNER(), CheatSpan::TargetCalls(1));
    timelock.set_lock_delay(LOCK_DELAY * 2);
    assert_eq!(timelock.lock_delay(), LOCK_DELAY * 2);
}

#[test]
fn test_deposit_zero_amount() {
    let (erc20_address, _, _, _, timelock_safe) = setup();
    match timelock_safe.deposit(erc20_address, 0) {
        Result::Ok(_) => panic!("Expected Timelock::Errors::DEPOSIT_AMOUNT_ZERO"),
        Result::Err(panic_data) => assert_eq!(
            *panic_data.at(0), Timelock::Errors::DEPOSIT_AMOUNT_ZERO
        ),
    };
}

#[test]
fn test_deposit_invalid_token_address() {
    let (_, _, _, _, timelock_safe) = setup();
    match timelock_safe.deposit(ZERO(), DEPOSIT_AMOUNT) {
        Result::Ok(_) => panic!("Expected Timelock::Errors::INVALID_TOKEN_ADDRESS"),
        Result::Err(panic_data) => assert_eq!(
            *panic_data.at(0), Timelock::Errors::INVALID_TOKEN_ADDRESS
        ),
    }
}

#[test]
fn test_single_deposit() {
    let (erc20_address, erc20, timelock_address, timelock, _) = setup();
    start_cheat_caller_address(timelock_address, ALICE());
    let mut spy = spy_events();
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    spy
        .assert_emitted(
            @array![
                (
                    timelock_address,
                    Timelock::Event::Deposit(
                        Timelock::Deposit {
                            depositor: ALICE(),
                            token: erc20_address,
                            timestamp: get_block_timestamp(),
                            amount: DEPOSIT_AMOUNT
                        }
                    )
                )
            ]
        );
    assert_eq!(timelock.balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), 0);
    assert_eq!(erc20.balance_of(ALICE()), MINTED_AMOUNT - DEPOSIT_AMOUNT);
    assert_eq!(erc20.balance_of(timelock_address), DEPOSIT_AMOUNT);
}

#[test]
fn test_multiple_deposits() {
    let (erc20_address, erc20, timelock_address, timelock, _) = setup();
    start_cheat_caller_address(timelock_address, ALICE());
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    assert_eq!(timelock.balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT * 2);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), 0);
    assert_eq!(erc20.balance_of(ALICE()), MINTED_AMOUNT - DEPOSIT_AMOUNT * 2);
    assert_eq!(erc20.balance_of(timelock_address), DEPOSIT_AMOUNT * 2);
}

#[test]
fn test_withdraw_zero_amount() {
    let (erc20_address, _, _, _, timelock_safe) = setup();
    match timelock_safe.withdraw(erc20_address, 0) {
        Result::Ok(_) => panic!("Expected Timelock::Errors::DEPOSIT_AMOUNT_ZERO"),
        Result::Err(panic_data) => assert_eq!(
            *panic_data.at(0), Timelock::Errors::DEPOSIT_AMOUNT_ZERO
        ),
    };
}

#[test]
fn test_withdraw_invalid_token_address() {
    let (_, _, _, _, timelock_safe) = setup();
    match timelock_safe.withdraw(ZERO(), DEPOSIT_AMOUNT) {
        Result::Ok(_) => panic!("Expected Timelock::Errors::INVALID_TOKEN_ADDRESS"),
        Result::Err(panic_data) => assert_eq!(
            *panic_data.at(0), Timelock::Errors::INVALID_TOKEN_ADDRESS
        ),
    }
}

#[test]
fn test_withdraw_insufficient_withdrawable_balance() {
    let (erc20_address, _, timelock_address, timelock, timelock_safe) = setup();
    start_cheat_caller_address(timelock_address, ALICE());
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    match timelock_safe.withdraw(erc20_address, DEPOSIT_AMOUNT) {
        Result::Ok(_) => panic!("Expected Timelock::Errors::INSUFFICIENT_WITHDRAWABLE_BALANCE"),
        Result::Err(panic_data) => assert_eq!(
            *panic_data.at(0), Timelock::Errors::INSUFFICIENT_WITHDRAWABLE_BALANCE
        ),
    }
}

#[test]
fn test_withdraw_after_lock_delay() {
    let (erc20_address, erc20, timelock_address, timelock, _) = setup();
    start_cheat_caller_address(timelock_address, ALICE());
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    start_cheat_block_timestamp_global(LOCK_DELAY);
    assert_eq!(timelock.balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT);
    let mut spy = spy_events();
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT);
    spy
        .assert_emitted(
            @array![
                (
                    timelock_address,
                    Timelock::Event::Withdraw(
                        Timelock::Withdraw {
                            withdrawer: ALICE(),
                            token: erc20_address,
                            timestamp: get_block_timestamp(),
                            amount: DEPOSIT_AMOUNT
                        }
                    )
                )
            ]
        );
    assert_eq!(timelock.balance_of(ALICE(), erc20_address), 0);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), 0);
    assert_eq!(erc20.balance_of(ALICE()), MINTED_AMOUNT);
    assert_eq!(erc20.balance_of(timelock_address), 0);
}

#[test]
fn test_withdraw_partial_amount() {
    let (erc20_address, _, timelock_address, timelock, _) = setup();
    start_cheat_caller_address(timelock_address, ALICE());
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    start_cheat_block_timestamp_global(LOCK_DELAY);
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT / 2);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT / 2);
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT / 2);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), 0);
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    start_cheat_block_timestamp_global(LOCK_DELAY * 2);
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT / 4);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT * 3 / 4);
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT / 4);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT / 2);
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT / 4);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT / 4);
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT / 4);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), 0);
}

#[test]
fn test_withdraw_from_multiple_deposits() {
    let (erc20_address, _, timelock_address, timelock, _) = setup();
    start_cheat_caller_address(timelock_address, ALICE());
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    start_cheat_block_timestamp_global(LOCK_DELAY);
    timelock.deposit(erc20_address, DEPOSIT_AMOUNT);
    assert_eq!(timelock.balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT * 2);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT);
    start_cheat_block_timestamp_global(LOCK_DELAY * 2);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), DEPOSIT_AMOUNT * 2);
    timelock.withdraw(erc20_address, DEPOSIT_AMOUNT * 2);
    assert_eq!(timelock.withdrawable_balance_of(ALICE(), erc20_address), 0);
}
