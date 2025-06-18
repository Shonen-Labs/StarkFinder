use starknet::ContractAddress;

// Oracle interface for external data feeds
#[starknet::interface]
pub trait IOracle<TContractState> {
    fn get_latest_data(self: @TContractState, data_type: u8) -> (u256, u64);
    fn is_data_fresh(self: @TContractState, data_type: u8, max_age: u64) -> bool;
    fn update_data(ref self: TContractState, data_type: u8, value: u256);
    fn authorize_updater(ref self: TContractState, updater: ContractAddress);
    fn revoke_updater(ref self: TContractState, updater: ContractAddress);
    fn get_owner(self: @TContractState) -> ContractAddress;
}

// Oracle integration interface for aggregating multiple sources
#[starknet::interface]
pub trait IOracleIntegration<TContractState> {
    fn register_oracle(ref self: TContractState, oracle_address: ContractAddress, data_types: Array<u8>);
    fn update_insurance_pool_data(ref self: TContractState, insurance_pool: ContractAddress);
    fn get_aggregated_data(self: @TContractState, data_type: u8) -> (u256, u64, bool);
    fn register_insurance_pool(ref self: TContractState, pool: ContractAddress);
}

// Mock Oracle for testing and demonstration
#[starknet::contract]
pub mod MockOracle {
    use super::IOracle;
    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        oracle_data: LegacyMap<u8, (u256, u64)>, // data_type -> (value, timestamp)
        authorized_updaters: LegacyMap<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        DataUpdated: DataUpdated,
        UpdaterAuthorized: UpdaterAuthorized,
        UpdaterRevoked: UpdaterRevoked,
    }

    #[derive(Drop, starknet::Event)]
    struct DataUpdated {
        data_type: u8,
        value: u256,
        timestamp: u64,
        updater: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct UpdaterAuthorized {
        updater: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct UpdaterRevoked {
        updater: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.authorized_updaters.write(owner, true);
        
        // Initialize with realistic mock data
        let current_time = get_block_timestamp();
        
        // Weather data types
        self.oracle_data.write(1, (25, current_time)); // Temperature: 25°C
        self.oracle_data.write(2, (150, current_time)); // Rainfall: 150mm
        self.oracle_data.write(3, (45, current_time)); // Wind speed: 45 km/h
        self.oracle_data.write(4, (1013, current_time)); // Atmospheric pressure: 1013 hPa
        
        // Flight data
        self.oracle_data.write(10, (0, current_time)); // Flight status: on-time
        
        // Seismic data
        self.oracle_data.write(20, (20, current_time)); // Earthquake: magnitude 2.0
        
        // Hurricane data
        self.oracle_data.write(30, (1, current_time)); // Hurricane: category 1
    }

    #[abi(embed_v0)]
    impl OracleImpl of IOracle<ContractState> {
        fn get_latest_data(self: @ContractState, data_type: u8) -> (u256, u64) {
            self.oracle_data.read(data_type)
        }

        fn is_data_fresh(self: @ContractState, data_type: u8, max_age: u64) -> bool {
            let (_, timestamp) = self.oracle_data.read(data_type);
            let current_time = get_block_timestamp();
            
            if timestamp == 0 {
                false
            } else {
                current_time - timestamp <= max_age
            }
        }

        fn update_data(ref self: ContractState, data_type: u8, value: u256) {
            let caller = get_caller_address();
            assert(self.authorized_updaters.read(caller), 'Not authorized to update');
            
            let current_time = get_block_timestamp();
            self.oracle_data.write(data_type, (value, current_time));
            
            self.emit(DataUpdated {
                data_type,
                value,
                timestamp: current_time,
                updater: caller,
            });
        }

        fn authorize_updater(ref self: ContractState, updater: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can authorize');
            self.authorized_updaters.write(updater, true);
            
            self.emit(UpdaterAuthorized { updater });
        }

        fn revoke_updater(ref self: ContractState, updater: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can revoke');
            self.authorized_updaters.write(updater, false);
            
            self.emit(UpdaterRevoked { updater });
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }
}

// Oracle Integration for aggregating multiple oracle sources
#[starknet::contract]
pub mod OracleIntegration {
    use super::{IOracleIntegration, IOracle};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        registered_oracles: LegacyMap<ContractAddress, bool>,
        oracle_data_types: LegacyMap<ContractAddress, Array<u8>>,
        oracle_weights: LegacyMap<ContractAddress, u256>,
        aggregated_data: LegacyMap<u8, (u256, u64, u8)>, // data_type -> (value, timestamp, source_count)
        insurance_pools: LegacyMap<ContractAddress, bool>,
        oracle_count: u256,
        total_weight: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OracleRegistered: OracleRegistered,
        DataAggregated: DataAggregated,
        PoolDataUpdated: PoolDataUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct OracleRegistered {
        oracle: ContractAddress,
        data_types: Array<u8>,
        weight: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct DataAggregated {
        data_type: u8,
        aggregated_value: u256,
        source_count: u8,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PoolDataUpdated {
        pool: ContractAddress,
        data_type: u8,
        value: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.oracle_count.write(0);
        self.total_weight.write(0);
    }

    #[abi(embed_v0)]
    impl OracleIntegrationImpl of IOracleIntegration<ContractState> {
        fn register_oracle(ref self: ContractState, oracle_address: ContractAddress, data_types: Array<u8>) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can register');
            assert(!self.registered_oracles.read(oracle_address), 'Oracle already registered');
            
            let default_weight: u256 = 100;
            
            self.registered_oracles.write(oracle_address, true);
            self.oracle_data_types.write(oracle_address, data_types.clone());
            self.oracle_weights.write(oracle_address, default_weight);
            
            // Update counters
            let current_count = self.oracle_count.read();
            self.oracle_count.write(current_count + 1);
            
            let current_total_weight = self.total_weight.read();
            self.total_weight.write(current_total_weight + default_weight);
            
            self.emit(OracleRegistered {
                oracle: oracle_address,
                data_types,
                weight: default_weight,
            });
        }

        fn update_insurance_pool_data(ref self: ContractState, insurance_pool: ContractAddress) {
            assert(self.insurance_pools.read(insurance_pool), 'Pool not registered');
            
            // Common data types to update
            let data_types_to_update = array![1_u8, 2, 3, 4, 10, 20, 30];
            
            let mut i = 0;
            loop {
                if i >= data_types_to_update.len() {
                    break;
                }
                
                let data_type = *data_types_to_update.at(i);
                let (aggregated_value, timestamp, is_valid) = self.get_aggregated_data(data_type);
                
                if is_valid {
                    self.aggregated_data.write(data_type, (aggregated_value, timestamp, 1));
                    
                    self.emit(PoolDataUpdated {
                        pool: insurance_pool,
                        data_type,
                        value: aggregated_value,
                    });
                }
                
                i += 1;
            };
        }

        fn get_aggregated_data(self: @ContractState, data_type: u8) -> (u256, u64, bool) {
            let mut weighted_total: u256 = 0;
            let mut total_weight: u256 = 0;
            let mut valid_sources: u8 = 0;
            let mut latest_timestamp: u64 = 0;
            let current_time = get_block_timestamp();
            let max_age: u64 = 3600; // 1 hour
            
            let oracle_count = self.oracle_count.read();
            
            if oracle_count > 0 {
                // Simulate aggregation from multiple oracle sources
                let mock_value_1: u256 = 100;
                let mock_value_2: u256 = 105;
                let mock_timestamp = current_time - 300; // 5 minutes ago
                
                if current_time - mock_timestamp <= max_age {
                    weighted_total = (mock_value_1 * 100) + (mock_value_2 * 100);
                    total_weight = 200;
                    valid_sources = 2;
                    latest_timestamp = mock_timestamp;
                }
            }
            
            let is_valid = valid_sources > 0 && total_weight > 0;
            let aggregated_value = if is_valid { weighted_total / total_weight } else { 0 };
            
            if is_valid {
                self.emit(DataAggregated {
                    data_type,
                    aggregated_value,
                    source_count: valid_sources,
                    timestamp: latest_timestamp,
                });
            }
            
            (aggregated_value, latest_timestamp, is_valid)
        }

        fn register_insurance_pool(ref self: ContractState, pool: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner');
            self.insurance_pools.write(pool, true);
        }
    }

    // Admin functions
    #[external(v0)]
    fn remove_oracle(ref self: ContractState, oracle: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner');
        assert(self.registered_oracles.read(oracle), 'Oracle not registered');
        
        self.registered_oracles.write(oracle, false);
        
        let oracle_weight = self.oracle_weights.read(oracle);
        let current_total_weight = self.total_weight.read();
        self.total_weight.write(current_total_weight - oracle_weight);
        
        let current_count = self.oracle_count.read();
        self.oracle_count.write(current_count - 1);
    }

    #[external(v0)]
    fn update_oracle_weight(ref self: ContractState, oracle: ContractAddress, new_weight: u256) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner');
        assert(self.registered_oracles.read(oracle), 'Oracle not registered');
        assert(new_weight > 0, 'Weight must be positive');
        
        let old_weight = self.oracle_weights.read(oracle);
        let current_total_weight = self.total_weight.read();
        let new_total_weight = current_total_weight - old_weight + new_weight;
        self.total_weight.write(new_total_weight);
        self.oracle_weights.write(oracle, new_weight);
    }

    #[external(v0)]
    fn get_oracle_weight(self: @ContractState, oracle: ContractAddress) -> u256 {
        self.oracle_weights.read(oracle)
    }

    #[external(v0)]
    fn get_oracle_count(self: @ContractState) -> u256 {
        self.oracle_count.read()
    }

    #[external(v0)]
    fn is_oracle_registered(self: @ContractState, oracle: ContractAddress) -> bool {
        self.registered_oracles.read(oracle)
    }
}