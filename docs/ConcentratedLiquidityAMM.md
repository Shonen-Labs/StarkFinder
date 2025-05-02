# Concentrated Liquidity AMM Documentation

This document provides detailed information about the Concentrated Liquidity Automated Market Maker (AMM) implementation in the StarkFinder project.

## Overview

The Concentrated Liquidity AMM is a sophisticated market-making protocol that allows liquidity providers to concentrate their capital within specific price ranges, improving capital efficiency compared to traditional constant product AMMs.

## Contract Architecture

### Core Components

#### Position Structure
```cairo
struct Position {
    owner: ContractAddress,
    liquidity: u256,
    tick_lower: i32,
    tick_upper: i32,
    fee_growth_inside0_last: u256,
    fee_growth_inside1_last: u256,
    tokens_owed0: u256,
    tokens_owed1: u256
}
```

#### Tick Structure
```cairo
struct Tick {
    liquidity_gross: u256,
    liquidity_net: i256,
    fee_growth_outside0: u256,
    fee_growth_outside1: u256,
    initialized: bool
}
```

### Key Parameters

- `MIN_TICK`: -887272
- `MAX_TICK`: 887272
- `MIN_SQRT_RATIO`: 4295128739
- `MAX_SQRT_RATIO`: 1461446703485210103287273052203988822378723970342

## Core Functions

### Create Position
```cairo
fn create_position(
    token0: ContractAddress,
    token1: ContractAddress,
    fee: u16,
    tick_lower: i32,
    tick_upper: i32,
    amount0_desired: u256,
    amount1_desired: u256,
    amount0_min: u256,
    amount1_min: u256
) -> (u256, u256, u256)
```
Creates a new liquidity position within a specified tick range.

### Collect Fees
```cairo
fn collect_fees(token_id: u256) -> (u256, u256)
```
Collects accumulated fees for a given position.

### Increase Liquidity
```cairo
fn increase_liquidity(
    token_id: u256,
    amount0_desired: u256,
    amount1_desired: u256,
    amount0_min: u256,
    amount1_min: u256
) -> (u256, u256)
```
Increases liquidity for an existing position.

### Decrease Liquidity
```cairo
fn decrease_liquidity(
    token_id: u256,
    liquidity: u256,
    amount0_min: u256,
    amount1_min: u256
) -> (u256, u256)
```
Decreases liquidity for an existing position.

## Fee Management

The contract implements a fee system where:
- Fees are specified in 0.01% increments (1 = 0.01%)
- Valid fee range: 0 < fee < 100000
- Fees are accumulated per position and can be collected by position owners

## Price Range Management

Liquidity positions are created within specific price ranges defined by:
- Lower and upper tick boundaries
- Tick range must be valid (lower < upper)
- Ticks must be within global bounds (-887272 to 887272)

## Security Considerations

1. Position ownership verification
2. Valid tick range validation
3. Minimum amount checks for slippage protection
4. Token address validation

## Integration Guidelines

### Prerequisites
- Valid token pair (token0 ≠ token1)
- Approved token amounts
- Valid fee tier

### Position Management
1. Create position with desired parameters
2. Monitor fee accumulation
3. Collect fees when desired
4. Adjust liquidity as needed

## Future Improvements

1. Implementation of actual liquidity calculations
2. Fee calculation implementation
3. Price range optimization
4. Additional safety checks