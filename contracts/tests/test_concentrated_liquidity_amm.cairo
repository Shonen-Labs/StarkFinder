use starknet::ContractAddress;
use starknet::syscalls::deploy_syscall;
use snforge_std::declare;
use snforge_std::cheatcodes::CheatSpan;
use snforge_std::cheatcodes::cheat_caller_address;
use traits::Into;
use traits::TryInto;
use array::ArrayTrait;
use option::OptionTrait;
use super::test_utils::deploy_erc20;
use starkfinder::interfaces::IConcentratedLiquidityAMM;
use starkfinder::ConcentratedLiquidityAMM;

const BANK: felt252 = 'BANK';
const INITIAL_SUPPLY: u256 = 1000000000000000000000; // 1000 tokens
const INITIAL_SQRT_PRICE_X96: u256 = 79228162514264337593543950336; // 1:1 price

#[derive(Drop)]
struct Deployment {
    contract: IConcentratedLiquidityAMMDispatcher,
    token0: IERC20Dispatcher,
    token1: IERC20Dispatcher,
}

#[cfg(test)]
fn setup() -> Deployment {
    let recipient: ContractAddress = BANK.try_into().unwrap();
    let (token0_address, token0) = deploy_erc20("Token0", "T0");
    token0.mint(recipient, INITIAL_SUPPLY);
    let (token1_address, token1) = deploy_erc20("Token1", "T1");
    token1.mint(recipient, INITIAL_SUPPLY);
    
    // 0.3% fee
    let fee: u16 = 3;
    let mut calldata: Array<felt252> = array![];
    calldata.append(token0_address.into());
    calldata.append(token1_address.into());
    calldata.append(fee.into());
    calldata.append(INITIAL_SQRT_PRICE_X96.into());
    
    let (contract_address, _) = starknet::syscalls::deploy_syscall(
        ConcentratedLiquidityAMM::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false,
    ).unwrap();

    Deployment { contract: IConcentratedLiquidityAMMDispatcher { contract_address }, token0, token1 }
}

#[test]
fn test_create_position() {
    let deploy = setup();
    let provider: ContractAddress = BANK.try_into().unwrap();
    let amount = 1000000000000000000; // 1 token

    // Approve tokens
    cheat_caller_address(deploy.token0.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token0.approve(deploy.contract.contract_address, amount);
    cheat_caller_address(deploy.token1.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token1.approve(deploy.contract.contract_address, amount);

    // Create position
    let (token_id, amount0, amount1) = deploy.contract.create_position(
        deploy.token0.contract_address,
        deploy.token1.contract_address,
        3, // 0.3% fee
        -100, // tick_lower
        100, // tick_upper
        amount,
        amount,
        0, // amount0_min
        0 // amount1_min
    );

    assert(token_id == 1, 'Invalid token ID');
    assert(amount0 > 0, 'Invalid amount0');
    assert(amount1 > 0, 'Invalid amount1');
}

#[test]
fn test_increase_liquidity() {
    let deploy = setup();
    let provider: ContractAddress = BANK.try_into().unwrap();
    let amount = 1000000000000000000; // 1 token

    // Create initial position
    cheat_caller_address(deploy.token0.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token0.approve(deploy.contract.contract_address, amount * 2);
    cheat_caller_address(deploy.token1.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token1.approve(deploy.contract.contract_address, amount * 2);

    let (token_id, _, _) = deploy.contract.create_position(
        deploy.token0.contract_address,
        deploy.token1.contract_address,
        3,
        -100,
        100,
        amount,
        amount,
        0,
        0
    );

    // Increase liquidity
    let (amount0, amount1) = deploy.contract.increase_liquidity(
        token_id,
        amount,
        amount,
        0,
        0
    );

    assert(amount0 > 0, 'Invalid amount0');
    assert(amount1 > 0, 'Invalid amount1');
}

#[test]
fn test_decrease_liquidity() {
    let deploy = setup();
    let provider: ContractAddress = BANK.try_into().unwrap();
    let amount = 1000000000000000000; // 1 token

    // Create initial position
    cheat_caller_address(deploy.token0.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token0.approve(deploy.contract.contract_address, amount);
    cheat_caller_address(deploy.token1.contract_address, provider, CheatSpan::TargetCalls(1));
    deploy.token1.approve(deploy.contract.contract_address, amount);

    let (token_id, _, _) = deploy.contract.create_position(
        deploy.token0.contract_address,
        deploy.token1.contract_address,
        3,
        -100,
        100,
        amount,
        amount,
        0,
        0
    );

    // Decrease liquidity
    let (amount0, amount1) = deploy.contract.decrease_liquidity(
        token_id,
        amount / 2, // Remove half of liquidity
        0,
        0
    );

    assert(amount0 > 0, 'Invalid amount0');
    assert(amount1 > 0, 'Invalid amount1');
}