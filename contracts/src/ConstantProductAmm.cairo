use starknet::ContractAddress;

#[starknet::contract]
pub mod ConstantProductAmm {
    use contracts::interfaces::IConstantProductAmm::IConstantProductAmm;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use core::num::traits::Sqrt;

    #[storage]
    struct Storage {
        token0: IERC20Dispatcher,
        token1: IERC20Dispatcher,
        reserve0: u256,
        reserve1: u256,
        total_supply: u256,
        balance_of: Map::<ContractAddress, u256>,
        fee: u16,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, token0: ContractAddress, token1: ContractAddress, fee: u16,
    ) {
        // assert(fee <= 1000, 'fee > 1000');
        self.token0.write(IERC20Dispatcher { contract_address: token0 });
        self.token1.write(IERC20Dispatcher { contract_address: token1 });
        self.fee.write(fee);
    }

    #[generate_trait]
    impl PrivateFunctions of PrivateFunctionsTrait {
        fn _mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            self.balance_of.write(to, self.balance_of.read(to) + amount);
            self.total_supply.write(self.total_supply.read() + amount);
        }

        fn _burn(ref self: ContractState, from: ContractAddress, amount: u256) {
            self.balance_of.write(from, self.balance_of.read(from) - amount);
            self.total_supply.write(self.total_supply.read() - amount);
        }

        fn _update(ref self: ContractState, reserve0: u256, reserve1: u256) {
            self.reserve0.write(reserve0);
            self.reserve1.write(reserve1);
        }

        #[inline(always)]
        fn select_token(self: @ContractState, token: ContractAddress) -> bool {
            assert(
                token == self.token0.read().contract_address
                    || token == self.token1.read().contract_address,
                'invalid token',
            );
            token == self.token0.read().contract_address
        }

        #[inline(always)]
        fn min(x: u256, y: u256) -> u256 {
            if (x <= y) {
                x
            } else {
                y
            }
        }
    }

    #[abi(embed_v0)]
    impl ConstantProductAmm of IConstantProductAmm<ContractState> {
        fn swap(ref self: ContractState, token_in: ContractAddress, amount_in: u256) -> u256 {
            assert(amount_in > 0, 'amount in = 0');
            let is_token0: bool = self.select_token(token_in);

            let (token0, token1): (IERC20Dispatcher, IERC20Dispatcher) = (
                self.token0.read(), self.token1.read(),
            );
            let (reserve0, reserve1): (u256, u256) = (self.reserve0.read(), self.reserve1.read());
            let (
                token_in, token_out, reserve_in, reserve_out,
            ): (IERC20Dispatcher, IERC20Dispatcher, u256, u256) =
                if (is_token0) {
                (token0, token1, reserve0, reserve1)
            } else {
                (token1, token0, reserve1, reserve0)
            };

            let caller = get_caller_address();
            let this = get_contract_address();
            token_in.transfer_from(caller, this, amount_in);

            let amount_in_with_fee = (amount_in * (1000 - self.fee.read().into()) / 1000);
            let amount_out = (reserve_out * amount_in_with_fee) / (reserve_in + amount_in_with_fee);

            token_out.transfer(caller, amount_out);

            self._update(self.token0.read().balance_of(this), self.token1.read().balance_of(this));
            amount_out
        }

        fn add_liquidity(ref self: ContractState, amount0: u256, amount1: u256) -> u256 {
            let caller = get_caller_address();
            let this = get_contract_address();
            let (token0, token1): (IERC20Dispatcher, IERC20Dispatcher) = (
                self.token0.read(), self.token1.read(),
            );

            token0.transfer_from(caller, this, amount0);
            token1.transfer_from(caller, this, amount1);

            let (reserve0, reserve1): (u256, u256) = (self.reserve0.read(), self.reserve1.read());
            if (reserve0 > 0 || reserve1 > 0) {
                assert(reserve0 * amount1 == reserve1 * amount0, 'x / y != dx / dy');
            }

            let total_supply = self.total_supply.read();
            let shares = if (total_supply == 0) {
                (amount0 * amount1).sqrt().into()
            } else {
                PrivateFunctions::min(
                    amount0 * total_supply / reserve0, amount1 * total_supply / reserve1,
                )
            };
            assert(shares > 0, 'shares = 0');
            self._mint(caller, shares);

            self._update(self.token0.read().balance_of(this), self.token1.read().balance_of(this));
            shares
        }

        fn remove_liquidity(ref self: ContractState, shares: u256) -> (u256, u256) {
            let caller = get_caller_address();
            let this = get_contract_address();
            let (token0, token1): (IERC20Dispatcher, IERC20Dispatcher) = (
                self.token0.read(), self.token1.read(),
            );

            let (bal0, bal1): (u256, u256) = (token0.balance_of(this), token1.balance_of(this));

            let total_supply = self.total_supply.read();
            let (amount0, amount1): (u256, u256) = (
                (shares * bal0) / total_supply, (shares * bal1) / total_supply,
            );
            assert(amount0 > 0 && amount1 > 0, 'amount0 or amount1 = 0');

            self._burn(caller, shares);
            self._update(bal0 - amount0, bal1 - amount1);

            token0.transfer(caller, amount0);
            token1.transfer(caller, amount1);
            (amount0, amount1)
        }
    }
}

