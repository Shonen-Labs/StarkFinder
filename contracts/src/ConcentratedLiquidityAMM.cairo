use starknet::ContractAddress;
use core::traits::Into;
use core::option::OptionTrait;

#[starknet::interface]
trait IConcentratedLiquidityAMM<TContractState> {
    fn create_position(
        ref self: TContractState,
        token0: ContractAddress,
        token1: ContractAddress,
        fee: u16,
        tick_lower: i32,
        tick_upper: i32,
        amount0_desired: u256,
        amount1_desired: u256,
        amount0_min: u256,
        amount1_min: u256
    ) -> (u256, u256, u256);
    
    fn collect_fees(
        ref self: TContractState,
        token_id: u256
    ) -> (u256, u256);

    fn increase_liquidity(
        ref self: TContractState,
        token_id: u256,
        amount0_desired: u256,
        amount1_desired: u256,
        amount0_min: u256,
        amount1_min: u256
    ) -> (u256, u256);

    fn decrease_liquidity(
        ref self: TContractState,
        token_id: u256,
        liquidity: u256,
        amount0_min: u256,
        amount1_min: u256
    ) -> (u256, u256);
}

#[starknet::contract]
mod ConcentratedLiquidityAMM {
    use super::IConcentratedLiquidityAMM;
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    const MIN_TICK: i32 = -887272;
    const MAX_TICK: i32 = 887272;
    const MIN_SQRT_RATIO: u256 = 4295128739;
    const MAX_SQRT_RATIO: u256 = 1461446703485210103287273052203988822378723970342;

    #[derive(Copy, Drop, Serde, starknet::Store)]
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

    #[derive(Copy, Drop, Serde, starknet::Store)]
    struct Tick {
        liquidity_gross: u256,
        liquidity_net: i256,
        fee_growth_outside0: u256,
        fee_growth_outside1: u256,
        initialized: bool
    }

    #[storage]
    struct Storage {
        positions: LegacyMap<u256, Position>,
        ticks: LegacyMap<i32, Tick>,
        next_position_id: u256,
        sqrt_price_x96: u256,
        tick: i32,
        liquidity: u256,
        fee: u16,
        token0: ContractAddress,
        token1: ContractAddress,
        fee_growth_global0: u256,
        fee_growth_global1: u256
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token0: ContractAddress,
        token1: ContractAddress,
        fee: u16,
        sqrt_price_x96: u256
    ) {
        assert(token0 != token1, 'Same token address');
        assert(fee > 0 && fee < 100000, 'Invalid fee'); // Fee is in 0.01% (1 = 0.01%)
        assert(
            sqrt_price_x96 >= MIN_SQRT_RATIO && sqrt_price_x96 <= MAX_SQRT_RATIO,
            'Invalid sqrt price'
        );

        self.token0.write(token0);
        self.token1.write(token1);
        self.fee.write(fee);
        self.sqrt_price_x96.write(sqrt_price_x96);
        self.next_position_id.write(1);
    }

    #[external(v0)]
    impl ConcentratedLiquidityAMMImpl of IConcentratedLiquidityAMM<ContractState> {
        fn create_position(
            ref self: ContractState,
            token0: ContractAddress,
            token1: ContractAddress,
            fee: u16,
            tick_lower: i32,
            tick_upper: i32,
            amount0_desired: u256,
            amount1_desired: u256,
            amount0_min: u256,
            amount1_min: u256
        ) -> (u256, u256, u256) {
            assert(tick_lower < tick_upper, 'Invalid tick range');
            assert(
                tick_lower >= MIN_TICK && tick_upper <= MAX_TICK, 'Tick out of range'
            );

            let position_id = self.next_position_id.read();
            let caller = get_caller_address();

            // Create new position
            self.positions.write(
                position_id,
                Position {
                    owner: caller,
                    liquidity: 0,
                    tick_lower,
                    tick_upper,
                    fee_growth_inside0_last: 0,
                    fee_growth_inside1_last: 0,
                    tokens_owed0: 0,
                    tokens_owed1: 0
                }
            );

            self.next_position_id.write(position_id + 1);

            // TODO: Calculate actual amounts and liquidity
            // For now returning dummy values
            (position_id, amount0_desired, amount1_desired)
        }

        fn collect_fees(ref self: ContractState, token_id: u256) -> (u256, u256) {
            let position = self.positions.read(token_id);
            assert(position.owner == get_caller_address(), 'Not position owner');
            
            // TODO: Calculate actual fees
            // For now returning dummy values
            (0, 0)
        }

        fn increase_liquidity(
            ref self: ContractState,
            token_id: u256,
            amount0_desired: u256,
            amount1_desired: u256,
            amount0_min: u256,
            amount1_min: u256
        ) -> (u256, u256) {
            let position = self.positions.read(token_id);
            assert(position.owner == get_caller_address(), 'Not position owner');

            // TODO: Add liquidity calculation
            // For now returning dummy values
            (amount0_desired, amount1_desired)
        }

        fn decrease_liquidity(
            ref self: ContractState,
            token_id: u256,
            liquidity: u256,
            amount0_min: u256,
            amount1_min: u256
        ) -> (u256, u256) {
            let position = self.positions.read(token_id);
            assert(position.owner == get_caller_address(), 'Not position owner');
            assert(position.liquidity >= liquidity, 'Insufficient liquidity');

            // TODO: Add liquidity removal calculation
            // For now returning dummy values
            (amount0_min, amount1_min)
        }
    }
}