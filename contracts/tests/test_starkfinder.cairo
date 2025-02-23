use starknet::{ContractAddress, contract_address_const};
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
    stop_cheat_caller_address, start_cheat_block_timestamp, spy_events, EventSpyAssertionsTrait,
};
use contracts::starkfinder::{IStarkfinderDispatcher, IStarkfinderDispatcherTrait, starkfinder};
use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

fn ADMIN() -> ContractAddress {
    contract_address_const::<'ADMIN'>()
}

fn USER1() -> ContractAddress {
    contract_address_const::<'USER1'>()
}

fn USER2() -> ContractAddress {
    contract_address_const::<'USER2'>()
}

const ONE_E18: u128 = 1000000000000000000;

fn deploy_token(name: ByteArray) -> ContractAddress {
    let contract = declare("MockToken").unwrap().contract_class();

    let mut constructor_calldata = ArrayTrait::new();
    name.serialize(ref constructor_calldata);

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

fn deploy_starkfinder(
    admin_wallet: ContractAddress, token_address: ContractAddress,
) -> ContractAddress {
    let contract = declare("starkfinder").unwrap().contract_class();

    let mut constructor_calldata = ArrayTrait::new();
    admin_wallet.serialize(ref constructor_calldata);
    token_address.serialize(ref constructor_calldata);

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

#[test]
fn test_setup() {
    let token_address = deploy_token("MockToken");
    let starkfinder_address = deploy_starkfinder(ADMIN(), token_address);

    let token = IERC20Dispatcher { contract_address: token_address };
    let starkfinder = IStarkfinderDispatcher { contract_address: starkfinder_address };

    // Test token contract
    token.mint(ADMIN(), ONE_E18.into());
    assert!(token.balance_of(ADMIN()) == ONE_E18.into(), "Incorrect token balance");

    // Test starkfinder contract initialization
    assert!(starkfinder.get_admin_wallet() == ADMIN(), "Admin wallet not initialized");
    assert!(starkfinder.get_token_address() == token_address, "Token not initialized");
}

#[test]
fn test_register() {
    let token_address = deploy_token("MockToken");
    let starkfinder_address = deploy_starkfinder(ADMIN(), token_address);

    let starkfinder = IStarkfinderDispatcher { contract_address: starkfinder_address };

    // Spy events
    let mut spy = spy_events();

    // Register user
    start_cheat_caller_address(starkfinder_address, USER1());
    start_cheat_block_timestamp(starkfinder_address, 86400);
    let username: felt252 = 'USER1';
    starkfinder.register(USER1(), username);
    stop_cheat_caller_address(starkfinder_address);

    // Check user data
    let user = starkfinder.get_user(USER1());
    assert!(user.username == username, "Incorrect username");
    assert!(user.joined == 86400, "Incorrect timestamp");

    // Check emitted event
    let expected_event = starkfinder::Event::UserRegistered(
        starkfinder::UserRegistered { user: USER1(), username: username, timestamp: 86400 },
    );
    spy.assert_emitted(@array![(starkfinder_address, expected_event)]);
}

#[should_panic(expected: 'Caller is not a registered user')]
#[test]
fn test_send_transaction_should_panic_with_unregistered_user() {
    let token_address = deploy_token("MockToken");
    let starkfinder_address = deploy_starkfinder(ADMIN(), token_address);

    let token = IERC20Dispatcher { contract_address: token_address };
    let starkfinder = IStarkfinderDispatcher { contract_address: starkfinder_address };

    // Mint tokens to user
    let amount = ONE_E18;
    let fee_amount = ONE_E18 / 100;
    token.mint(USER1(), (amount + fee_amount).into());
    assert!(token.balance_of(USER1()) == (amount + fee_amount).into(), "Incorrect token balance");

    // Send transaction
    start_cheat_caller_address(starkfinder_address, USER1());
    starkfinder.send_transaction(USER2(), amount);
    stop_cheat_caller_address(starkfinder_address);
}

#[should_panic(expected: 'Insufficient balance')]
#[test]
fn test_send_transaction_should_panic_with_insufficient_balance() {
    let token_address = deploy_token("MockToken");
    let starkfinder_address = deploy_starkfinder(ADMIN(), token_address);

    let starkfinder = IStarkfinderDispatcher { contract_address: starkfinder_address };

    let amount = ONE_E18;

    // Register user
    start_cheat_caller_address(starkfinder_address, USER1());
    start_cheat_block_timestamp(starkfinder_address, 86400);
    let username: felt252 = 'USER1';
    starkfinder.register(USER1(), username);
    stop_cheat_caller_address(starkfinder_address);

    // Send transaction
    start_cheat_caller_address(starkfinder_address, USER1());
    starkfinder.send_transaction(USER2(), amount);
    stop_cheat_caller_address(starkfinder_address);
}

#[should_panic(expected: 'Insufficient allowance')]
#[test]
fn test_send_transaction_should_panic_with_insufficient_allowance() {
    let token_address = deploy_token("MockToken");
    let starkfinder_address = deploy_starkfinder(ADMIN(), token_address);

    let token = IERC20Dispatcher { contract_address: token_address };
    let starkfinder = IStarkfinderDispatcher { contract_address: starkfinder_address };

    // Mint tokens to user
    let amount = ONE_E18;
    let fee_amount = ONE_E18 / 100;
    token.mint(USER1(), (amount + fee_amount).into());

    // Register user
    start_cheat_caller_address(starkfinder_address, USER1());
    start_cheat_block_timestamp(starkfinder_address, 86400);
    let username: felt252 = 'USER1';
    starkfinder.register(USER1(), username);
    stop_cheat_caller_address(starkfinder_address);

    // Send transaction
    start_cheat_caller_address(starkfinder_address, USER1());
    starkfinder.send_transaction(USER2(), ONE_E18);
    stop_cheat_caller_address(starkfinder_address);
}

#[test]
fn test_send_transaction() {
    let token_address = deploy_token("MockToken");
    let starkfinder_address = deploy_starkfinder(ADMIN(), token_address);

    let token = IERC20Dispatcher { contract_address: token_address };
    let starkfinder = IStarkfinderDispatcher { contract_address: starkfinder_address };

    // Mint tokens to user
    let amount = ONE_E18;
    let fee_amount = ONE_E18 / 100;
    token.mint(USER1(), (amount + fee_amount).into());

    // Approve tokens
    start_cheat_caller_address(token_address, USER1());
    token.approve(starkfinder_address, (amount + fee_amount).into());
    stop_cheat_caller_address(token_address);

    // Register user
    start_cheat_caller_address(starkfinder_address, USER1());
    start_cheat_block_timestamp(starkfinder_address, 86400);
    let username: felt252 = 'USER1';
    starkfinder.register(USER1(), username);
    stop_cheat_caller_address(starkfinder_address);

    // Spy events
    let mut spy = spy_events();

    // Send transaction
    start_cheat_caller_address(starkfinder_address, USER1());
    starkfinder.send_transaction(USER2(), ONE_E18);
    stop_cheat_caller_address(starkfinder_address);

    // Check balances
    assert!(token.balance_of(USER1()) == 0, "Incorrect token balance of USER1");
    assert!(token.balance_of(USER2()) == amount.into(), "Incorrect token balance of USER2");
    assert!(token.balance_of(ADMIN()) == fee_amount.into(), "Incorrect token balance of ADMIN");

    // Check emitted event
    let expected_event = starkfinder::Event::TransactionExecuted(
        starkfinder::TransactionExecuted {
            from: USER1(), to: USER2(), amount, fee: fee_amount, timestamp: 86400,
        },
    );
    spy.assert_emitted(@array![(starkfinder_address, expected_event)]);
}
