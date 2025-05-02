use starknet::{ContractAddress, contract_address_const};
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, cheat_caller_address, CheatSpan};
use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use contracts::interfaces::IConstantProductAmm::{
    IConstantProductAmmDispatcher, IConstantProductAmmDispatcherTrait,
};
use contracts::ConstantProductAmm::{ConstantProductAmm};

const BANK: felt252 = 0x123;
const INITIAL_SUPPLY: u256 = 10_000;

#[derive(Drop, Copy)]
struct Deployment {
    contract: IConstantProductAmmDispatcher,
    token0: IERC20Dispatcher,
    token1: IERC20Dispatcher,
}

fn deploy_token(name: ByteArray) -> ContractAddress {
    let contract = declare("MockToken").unwrap().contract_class();
    let symbol: ByteArray = "MTK";
    let mut constructor_calldata = ArrayTrait::new();
    name.serialize(ref constructor_calldata);
    symbol.serialize(ref constructor_calldata);

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

fn deploy_erc20(name: ByteArray, symbol: ByteArray) -> (ContractAddress, IERC20Dispatcher) {
    let contract = declare("MockToken").unwrap().contract_class();

    let mut constructor_calldata = ArrayTrait::new();
    name.serialize(ref constructor_calldata);
    symbol.serialize(ref constructor_calldata);

    let (address, _) = contract.deploy(@constructor_calldata).unwrap();
    (address, IERC20Dispatcher { contract_address: address })
}

fn setup() -> Deployment {
    let recipient: ContractAddress = BANK.try_into().unwrap();
    let (token0_address, token0) = deploy_erc20("Token0", "T0");
    token0.mint(recipient, INITIAL_SUPPLY);
    let (token1_address, token1) = deploy_erc20("Token1", "T1");
    token1.mint(recipient, INITIAL_SUPPLY);
    // 0.3% fee
    let fee: u16 = 3;
    let mut calldata: Array::<felt252> = array![];
    calldata.append(token0_address.into());
    calldata.append(token1_address.into());
    calldata.append(fee.into());
    let (contract_address, _) = starknet::syscalls::deploy_syscall(
        ConstantProductAmm::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false,
    )
        .unwrap();

    Deployment { contract: IConstantProductAmmDispatcher { contract_address }, token0, token1 }
}

fn add_liquidity(deploy: Deployment, amount: u256) -> u256 {
    assert(amount <= INITIAL_SUPPLY, 'amount > INITIAL_SUPPLY');
    let provider: ContractAddress = BANK.try_into().unwrap();
    cheat_caller_address(deploy.token0.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token0.approve(deploy.contract.contract_address, amount);
    cheat_caller_address(deploy.token1.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token1.approve(deploy.contract.contract_address, amount);
    deploy.contract.add_liquidity(amount, amount)
}

#[test]
fn test_should_deploy() {
    let deploy = setup();
    let bank: ContractAddress = BANK.try_into().unwrap();
    assert(deploy.token0.balance_of(bank) == INITIAL_SUPPLY, 'Wrong balance token0');
    assert(deploy.token1.balance_of(bank) == INITIAL_SUPPLY, 'Wrong balance token1');
}

#[test]
fn should_add_liquidity() {
    let deploy = setup();
    let shares = add_liquidity(deploy, INITIAL_SUPPLY / 2);
    let provider: ContractAddress = BANK.try_into().unwrap();
    assert(deploy.token0.balance_of(provider) == INITIAL_SUPPLY / 2, 'Wrong balance token0');
    assert(deploy.token1.balance_of(provider) == INITIAL_SUPPLY / 2, 'Wrong balance token1');
    assert(shares > 0, 'Wrong shares');
}

#[test]
fn should_remove_liquidity() {
    let deploy = setup();
    let shares = add_liquidity(deploy, INITIAL_SUPPLY / 2);
    let provider: ContractAddress = BANK.try_into().unwrap();
    deploy.contract.remove_liquidity(shares);
    assert(deploy.token0.balance_of(provider) == INITIAL_SUPPLY, 'Wrong balance token0');
    assert(deploy.token1.balance_of(provider) == INITIAL_SUPPLY, 'Wrong balance token1');
}

#[test]
fn should_swap() {
    let deploy = setup();
    let _shares = add_liquidity(deploy, INITIAL_SUPPLY / 2);
    let provider: ContractAddress = BANK.try_into().unwrap();
    let user = contract_address_const::<0x1>();
    // Provider send some token0 to user
    cheat_caller_address(deploy.token0.contract_address, provider, CheatSpan::TargetCalls(1));
    let amount = deploy.token0.balance_of(provider) / 2;
    deploy.token0.transfer(user, amount);
    // user swap for token1 using AMM liquidity
    cheat_caller_address(deploy.token0.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token0.approve(deploy.contract.contract_address, amount);
    deploy.contract.swap(deploy.token0.contract_address, amount);
    let amount_token1_received = deploy.token1.balance_of(user);
    assert(amount_token1_received > 0, 'Swap: wrong balance token1');
    // User can swap back token1 to token0
    // As each swap has a 0.3% fee, user will receive less token0
    deploy.token1.approve(deploy.contract.contract_address, amount_token1_received);
    deploy.contract.swap(deploy.token1.contract_address, amount_token1_received);
    let amount_token0_received = deploy.token0.balance_of(user);
    assert(amount_token0_received < amount, 'Swap: wrong balance token0');
}

