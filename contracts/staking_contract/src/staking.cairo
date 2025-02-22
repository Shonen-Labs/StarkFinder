#[starknet::contract]
pub mod Staking {
    use starknet::storage::StorageMapReadAccess;
    use starknet::storage::StorageMapWriteAccess;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Map};
    use core::num::traits::Zero;
    use staking_contract::interfaces::{
        staking::IStaking, ierc20::IERC20Dispatcher, ierc20::IERC20DispatcherTrait,
    };

    #[storage]
    struct Storage {
        // Pool management
        pools: Map<u32, PoolInfo>,
        pool_count: u32,
        // User data
        user_stakes: Map<(u32, ContractAddress), u256>, // Mapping<(pool_id, user), stake>
        // Admin
        owner: ContractAddress,
    }

    #[derive(Copy, Drop, Serde, starknet::Store)]
    pub struct PoolInfo {
        stake_token: ContractAddress,
        reward_token: ContractAddress,
        reward_rate: u256,
        start_time: u64,
        end_time: u64,
        total_staked: u256,
        total_reward_distributed: u256,
        is_active: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PoolCreated: PoolCreated,
        Staked: Staked,
        Unstaked: Unstaked,
        RewardsClaimed: RewardsClaimed,
        RewardRateUpdated: RewardRateUpdated,
        PoolEnded: PoolEnded,
    }

    #[derive(Drop, starknet::Event)]
    struct PoolCreated {
        pool_id: u32,
        stake_token: ContractAddress,
        reward_token: ContractAddress,
        reward_rate: u256,
        start_time: u64,
        end_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct Staked {
        pool_id: u32,
        user: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Unstaked {
        pool_id: u32,
        user: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardsClaimed {
        pool_id: u32,
        user: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardRateUpdated {
        pool_id: u32,
        new_rate: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct PoolEnded {
        pool_id: u32,
        end_time: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.pool_count.write(0);
    }

    #[abi(embed_v0)]
    impl StakingImpl of IStaking<ContractState> {
        fn create_pool(
            ref self: ContractState,
            stake_token: ContractAddress,
            reward_token: ContractAddress,
            reward_rate: u256,
            start_time: u64,
            end_time: u64,
        ) -> u32 {
            // Validate caller is owner
            let caller = get_caller_address();
            assert!(caller == self.owner.read(), "not authorized");

            // Validate inputs
            assert!(start_time < end_time, "invalid time range");
            assert!(!stake_token.is_zero(), "invalid stake token");
            assert!(!reward_token.is_zero(), "invalid reward token");
            assert!(reward_rate > 0, "invalid reward rate");

            let pool_id = self.pool_count.read();

            // Create new pool
            let pool = PoolInfo {
                stake_token,
                reward_token,
                reward_rate,
                start_time,
                end_time,
                total_staked: 0,
                total_reward_distributed: 0,
                is_active: true,
            };

            self.pools.write(pool_id, pool);
            self.pool_count.write(pool_id + 1);

            // Emit event
            self
                .emit(
                    PoolCreated {
                        pool_id, stake_token, reward_token, reward_rate, start_time, end_time,
                    },
                );

            pool_id
        }

        fn get_pool_info(self: @ContractState, pool_id: u32) -> PoolInfo {
            self.pools.read(pool_id)
        }

        fn get_user_stake(self: @ContractState, pool_id: u32, user: ContractAddress) -> u256 {
            self.user_stakes.read((pool_id, user))
        }

        fn get_rewards(self: @ContractState, pool_id: u32, user: ContractAddress) -> u256 {
            let pool = self.pools.read(pool_id);
            assert!(pool.is_active, "pool not active");

            let user_stake = self.user_stakes.read((pool_id, user));
            if user_stake == 0 {
                return 0;
            }

            let current_time: u64 = get_block_timestamp();
            if current_time < pool.start_time {
                return 0;
            }

            let end_time = if current_time > pool.end_time {
                pool.end_time
            } else {
                current_time
            };
            let time_staked = end_time - pool.start_time;

            // Calculate rewards: (stake * reward_rate * time_staked) / total_stake
            if pool.total_staked == 0 {
                return 0;
            }

            (user_stake * pool.reward_rate * time_staked.into()) / pool.total_staked
        }

        fn get_pool_count(self: @ContractState) -> u32 {
            self.pool_count.read()
        }

        fn stake(ref self: ContractState, pool_id: u32, amount: u256) {
            assert!(amount > 0, "zero stake amount");
            let caller = get_caller_address();

            // Get and validate pool
            let mut pool = self.pools.read(pool_id);
            assert!(pool.is_active, "pool not active");

            // Transfer tokens
            let success = IERC20Dispatcher { contract_address: pool.stake_token }
                .transfer_from(caller, get_contract_address(), amount);
            assert!(success, "stake transfer failed");

            // Update state
            self
                .user_stakes
                .write((pool_id, caller), self.user_stakes.read((pool_id, caller)) + amount);
            pool.total_staked += amount;
            self.pools.write(pool_id, pool);

            // Emit event
            self.emit(Staked { pool_id, user: caller, amount });
        }

        fn unstake(ref self: ContractState, pool_id: u32, amount: u256) {
            let caller = get_caller_address();

            // Validate unstake amount
            let user_stake = self.user_stakes.read((pool_id, caller));
            assert!(user_stake >= amount, "insufficient stake");

            // Get and validate pool
            let mut pool = self.pools.read(pool_id);
            assert!(pool.is_active, "pool not active");

            // Transfer tokens back to user
            let success = IERC20Dispatcher { contract_address: pool.stake_token }
                .transfer(caller, amount);
            assert!(success, "transfer failed");

            // Update state
            self.user_stakes.write((pool_id, caller), user_stake - amount);
            pool.total_staked -= amount;
            self.pools.write(pool_id, pool);

            // Emit event
            self.emit(Unstaked { pool_id, user: caller, amount });
        }

        fn claim_rewards(ref self: ContractState, pool_id: u32) {
            let caller = get_caller_address();

            // Calculate rewards
            let rewards = self.get_rewards(pool_id, caller);
            assert!(rewards > 0, "no rewards to claim");

            // Get pool info
            let mut pool = self.pools.read(pool_id);
            assert!(pool.is_active, "pool not active");

            // Transfer rewards
            let success = IERC20Dispatcher { contract_address: pool.reward_token }
                .transfer(caller, rewards);
            assert!(success, "reward transfer failed");

            // Update state
            pool.total_reward_distributed += rewards;
            self.pools.write(pool_id, pool);

            // Emit event
            self.emit(RewardsClaimed { pool_id, user: caller, amount: rewards });
        }

        fn set_reward_rate(ref self: ContractState, pool_id: u32, new_rate: u256) {
            let caller = get_caller_address();
            assert!(caller == self.owner.read(), "not authorized");
            assert!(new_rate > 0, "invalid rate");

            let mut pool = self.pools.read(pool_id);
            assert!(pool.is_active, "pool not active");

            pool.reward_rate = new_rate;
            self.pools.write(pool_id, pool);

            // Emit event
            self.emit(RewardRateUpdated { pool_id, new_rate });
        }

        fn end_pool_staking(ref self: ContractState, pool_id: u32) {
            let caller = get_caller_address();
            assert!(caller == self.owner.read(), "not authorized");

            let mut pool = self.pools.read(pool_id);
            assert!(pool.is_active, "pool not active");

            pool.is_active = false;
            pool.end_time = get_block_timestamp();
            self.pools.write(pool_id, pool);

            // Emit event
            self.emit(PoolEnded { pool_id, end_time: get_block_timestamp() });
        }
    }
}
