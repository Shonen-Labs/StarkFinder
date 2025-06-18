use starknet::ContractAddress;

#[starknet::interface]
pub trait IParametricInsurancePool<TContractState> {
    // Core insurance functions
    fn create_policy(
        ref self: TContractState,
        policy_type: PolicyType,
        coverage_amount: u256,
        premium: u256,
        trigger_conditions: Span<TriggerCondition>,
        duration: u64
    ) -> u256;
    
    fn pay_premium(ref self: TContractState, policy_id: u256);
    fn claim_payout(ref self: TContractState, policy_id: u256) -> bool;
    
    // Liquidity provider functions
    fn provide_liquidity(ref self: TContractState, amount: u256);
    fn withdraw_liquidity(ref self: TContractState, amount: u256);
    fn claim_rewards(ref self: TContractState) -> u256;
    
    // Oracle functions
    fn update_oracle_data(ref self: TContractState, data_type: DataType, value: u256);
    fn check_trigger_conditions(self: @TContractState, policy_id: u256) -> bool;
    
    // View functions
    fn get_policy(self: @TContractState, policy_id: u256) -> Policy;
    fn get_total_liquidity(self: @TContractState) -> u256;
    fn calculate_premium(self: @TContractState, policy_type: PolicyType, coverage_amount: u256) -> u256;
    fn get_liquidity_rewards(self: @TContractState, provider: ContractAddress) -> u256;
    fn get_policy_count(self: @TContractState) -> u256;
    fn get_trigger_condition(self: @TContractState, policy_id: u256, index: u32) -> TriggerCondition;
    fn get_trigger_conditions_count(self: @TContractState, policy_id: u256) -> u32;
}

#[derive(Drop, Serde, starknet::Store)]
pub enum PolicyType {
    #[default]
    CropInsurance,
    FlightDelay,
    Hurricane,
    Earthquake,
    Temperature,
}

#[derive(Drop, Serde, starknet::Store)]
pub enum DataType {
    #[default]
    WeatherData,
    FlightStatus,
    SeismicActivity,
    Temperature,
    Rainfall,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct TriggerCondition {
    pub data_type: DataType,
    pub operator: ComparisonOperator,
    pub threshold: u256,
    pub duration: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub enum ComparisonOperator {
    #[default]
    GreaterThan,
    LessThan,
    Equal,
    GreaterThanOrEqual,
    LessThanOrEqual,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct Policy {
    pub id: u256,
    pub holder: ContractAddress,
    pub policy_type: PolicyType,
    pub coverage_amount: u256,
    pub premium: u256,
    pub trigger_conditions_count: u32,
    pub created_at: u64,
    pub expires_at: u64,
    pub is_active: bool,
    pub premium_paid: bool,
    pub payout_claimed: bool,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct LiquidityProvider {
    pub amount_provided: u256,
    pub rewards_earned: u256,
    pub last_reward_claim: u64,
    pub entry_timestamp: u64,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct OracleData {
    pub value: u256,
    pub timestamp: u64,
    pub is_valid: bool,
}

#[starknet::contract]
pub mod ParametricInsurancePool {
    use super::{
        IParametricInsurancePool, Policy, PolicyType, TriggerCondition, DataType,
        ComparisonOperator, LiquidityProvider, OracleData
    };
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp
    };
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    // Define zero address constant
    const ZERO_ADDRESS: felt252 = 0;

    #[storage]
    struct Storage {
        // Core state
        owner: ContractAddress,
        payment_token: IERC20Dispatcher,
        
        // Policies
        policies: Map<u256, Policy>,
        policy_counter: u256,
        
        // Trigger conditions storage - separate mapping
        trigger_conditions: Map<(u256, u32), TriggerCondition>, // (policy_id, index) -> condition
        
        // Liquidity
        liquidity_providers: Map<ContractAddress, LiquidityProvider>,
        total_liquidity: u256,
        total_coverage_exposure: u256,
        
        // Oracle data
        oracle_data: Map<DataType, OracleData>,
        authorized_oracles: Map<ContractAddress, bool>,
        
        // Risk parameters
        base_premium_rate: u256,
        risk_multipliers: Map<PolicyType, u256>,
        liquidity_reward_rate: u256,
        
        // Constants
        PRECISION: u256,
        BASIS_POINTS: u256,
        SECONDS_PER_YEAR: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PolicyCreated: PolicyCreated,
        PremiumPaid: PremiumPaid,
        PayoutClaimed: PayoutClaimed,
        LiquidityProvided: LiquidityProvided,
        LiquidityWithdrawn: LiquidityWithdrawn,
        RewardsClaimed: RewardsClaimed,
        OracleDataUpdated: OracleDataUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct PolicyCreated {
        policy_id: u256,
        holder: ContractAddress,
        policy_type: PolicyType,
        coverage_amount: u256,
        premium: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct PremiumPaid {
        policy_id: u256,
        holder: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct PayoutClaimed {
        policy_id: u256,
        holder: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct LiquidityProvided {
        provider: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct LiquidityWithdrawn {
        provider: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardsClaimed {
        provider: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct OracleDataUpdated {
        data_type: DataType,
        value: u256,
        timestamp: u64,
    }

    // Helper function to check if address is zero
    fn is_zero_address(address: ContractAddress) -> bool {
        address.into() == ZERO_ADDRESS
    }

    // Helper function to get zero address
    fn zero_address() -> ContractAddress {
        ZERO_ADDRESS.try_into().unwrap()
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        payment_token: ContractAddress,
        base_premium_rate: u256,
        liquidity_reward_rate: u256
    ) {
        self.owner.write(owner);
        self.payment_token.write(IERC20Dispatcher { contract_address: payment_token });
        self.base_premium_rate.write(base_premium_rate);
        self.liquidity_reward_rate.write(liquidity_reward_rate);
        self.policy_counter.write(0);
        
        // Initialize constants
        self.PRECISION.write(1000000000000000000); // 1e18
        self.BASIS_POINTS.write(10000);
        self.SECONDS_PER_YEAR.write(31536000);
        
        // Initialize risk multipliers
        self.risk_multipliers.write(PolicyType::CropInsurance, 1500); // 15%
        self.risk_multipliers.write(PolicyType::FlightDelay, 800); // 8%
        self.risk_multipliers.write(PolicyType::Hurricane, 2000); // 20%
        self.risk_multipliers.write(PolicyType::Earthquake, 2500); // 25%
        self.risk_multipliers.write(PolicyType::Temperature, 1200); // 12%
    }

    #[abi(embed_v0)]
    impl ParametricInsurancePoolImpl of IParametricInsurancePool<ContractState> {
        fn create_policy(
            ref self: ContractState,
            policy_type: PolicyType,
            coverage_amount: u256,
            premium: u256,
            trigger_conditions: Span<TriggerCondition>,
            duration: u64
        ) -> u256 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            
            // Validate inputs
            assert(coverage_amount > 0, 'Coverage amount > 0');
            assert(duration > 0, 'Duration > 0');
            assert(trigger_conditions.len() > 0, 'Need trigger conditions');
            
            // Calculate required premium
            let calculated_premium = self.calculate_premium(policy_type, coverage_amount);
            assert(premium >= calculated_premium, 'Premium too low');
            
            // Check liquidity adequacy (80% utilization cap)
            let total_liquidity = self.total_liquidity.read();
            let new_exposure = self.total_coverage_exposure.read() + coverage_amount;
            assert(new_exposure <= total_liquidity * 8 / 10, 'Insufficient liquidity');
            
            // Create policy
            let policy_id = self.policy_counter.read() + 1;
            self.policy_counter.write(policy_id);
            
            let policy = Policy {
                id: policy_id,
                holder: caller,
                policy_type,
                coverage_amount,
                premium,
                trigger_conditions_count: trigger_conditions.len(),
                created_at: current_time,
                expires_at: current_time + duration,
                is_active: false,
                premium_paid: false,
                payout_claimed: false,
            };
            
            // Store policy
            self.policies.write(policy_id, policy);
            
            // Store trigger conditions separately
            let mut i = 0;
            loop {
                if i >= trigger_conditions.len() {
                    break;
                }
                self.trigger_conditions.write((policy_id, i), *trigger_conditions.at(i));
                i += 1;
            };
            
            self.total_coverage_exposure.write(new_exposure);
            
            self.emit(PolicyCreated {
                policy_id,
                holder: caller,
                policy_type,
                coverage_amount,
                premium,
            });
            
            policy_id
        }

        fn pay_premium(ref self: ContractState, policy_id: u256) {
            let caller = get_caller_address();
            let mut policy = self.policies.read(policy_id);
            
            assert(policy.holder == caller, 'Not policy holder');
            assert(!policy.premium_paid, 'Premium already paid');
            assert(get_block_timestamp() <= policy.expires_at, 'Policy expired');
            
            // Transfer premium from user to contract
            let payment_token = self.payment_token.read();
            let contract_address = starknet::get_contract_address();
            payment_token.transfer_from(caller, contract_address, policy.premium);
            
            // Activate policy
            policy.premium_paid = true;
            policy.is_active = true;
            self.policies.write(policy_id, policy);
            
            self.emit(PremiumPaid {
                policy_id,
                holder: caller,
                amount: policy.premium,
            });
        }

        fn claim_payout(ref self: ContractState, policy_id: u256) -> bool {
            let caller = get_caller_address();
            let mut policy = self.policies.read(policy_id);
            
            assert(policy.holder == caller, 'Not policy holder');
            assert(policy.is_active, 'Policy not active');
            assert(!policy.payout_claimed, 'Payout already claimed');
            assert(get_block_timestamp() <= policy.expires_at, 'Policy expired');
            
            // Check if trigger conditions are met
            let conditions_met = self.check_trigger_conditions(policy_id);
            
            if conditions_met {
                // Process payout
                let payment_token = self.payment_token.read();
                payment_token.transfer(caller, policy.coverage_amount);
                
                // Update policy state
                policy.payout_claimed = true;
                policy.is_active = false;
                self.policies.write(policy_id, policy);
                
                // Update total exposure
                let current_exposure = self.total_coverage_exposure.read();
                self.total_coverage_exposure.write(current_exposure - policy.coverage_amount);
                
                self.emit(PayoutClaimed {
                    policy_id,
                    holder: caller,
                    amount: policy.coverage_amount,
                });
                
                true
            } else {
                false
            }
        }

        fn provide_liquidity(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            assert(amount > 0, 'Amount must be positive');
            
            // Transfer tokens to contract
            let payment_token = self.payment_token.read();
            let contract_address = starknet::get_contract_address();
            payment_token.transfer_from(caller, contract_address, amount);
            
            // Update liquidity provider record
            let mut provider = self.liquidity_providers.read(caller);
            let current_time = get_block_timestamp();
            
            // Calculate and add pending rewards
            if provider.amount_provided > 0 {
                let pending_rewards = self._calculate_pending_rewards(caller);
                provider.rewards_earned += pending_rewards;
            }
            
            provider.amount_provided += amount;
            provider.last_reward_claim = current_time;
            if provider.entry_timestamp == 0 {
                provider.entry_timestamp = current_time;
            }
            
            self.liquidity_providers.write(caller, provider);
            
            // Update total liquidity
            let total_liquidity = self.total_liquidity.read();
            self.total_liquidity.write(total_liquidity + amount);
            
            self.emit(LiquidityProvided {
                provider: caller,
                amount,
            });
        }

        fn withdraw_liquidity(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let mut provider = self.liquidity_providers.read(caller);
            
            assert(amount > 0, 'Amount must be positive');
            assert(provider.amount_provided >= amount, 'Insufficient liquidity');
            
            // Check that withdrawal doesn't compromise coverage
            let total_liquidity = self.total_liquidity.read();
            let total_exposure = self.total_coverage_exposure.read();
            let new_liquidity = total_liquidity - amount;
            assert(total_exposure <= new_liquidity * 8 / 10, 'Would exceed util cap');
            
            // Calculate and add pending rewards
            let pending_rewards = self._calculate_pending_rewards(caller);
            provider.rewards_earned += pending_rewards;
            
            // Update provider record
            provider.amount_provided -= amount;
            provider.last_reward_claim = get_block_timestamp();
            self.liquidity_providers.write(caller, provider);
            
            // Update total liquidity
            self.total_liquidity.write(new_liquidity);
            
            // Transfer tokens back to provider
            let payment_token = self.payment_token.read();
            payment_token.transfer(caller, amount);
            
            self.emit(LiquidityWithdrawn {
                provider: caller,
                amount,
            });
        }

        fn claim_rewards(ref self: ContractState) -> u256 {
            let caller = get_caller_address();
            let mut provider = self.liquidity_providers.read(caller);
            
            // Calculate total rewards
            let pending_rewards = self._calculate_pending_rewards(caller);
            let total_rewards = provider.rewards_earned + pending_rewards;
            
            assert(total_rewards > 0, 'No rewards to claim');
            
            // Reset rewards and update timestamp
            provider.rewards_earned = 0;
            provider.last_reward_claim = get_block_timestamp();
            self.liquidity_providers.write(caller, provider);
            
            // Transfer rewards
            let payment_token = self.payment_token.read();
            payment_token.transfer(caller, total_rewards);
            
            self.emit(RewardsClaimed {
                provider: caller,
                amount: total_rewards,
            });
            
            total_rewards
        }

        fn update_oracle_data(ref self: ContractState, data_type: DataType, value: u256) {
            let caller = get_caller_address();
            assert(self.authorized_oracles.read(caller), 'Not authorized oracle');
            
            let oracle_data = OracleData {
                value,
                timestamp: get_block_timestamp(),
                is_valid: true,
            };
            
            self.oracle_data.write(data_type, oracle_data);
            
            self.emit(OracleDataUpdated {
                data_type,
                value,
                timestamp: oracle_data.timestamp,
            });
        }

        fn check_trigger_conditions(self: @ContractState, policy_id: u256) -> bool {
            let policy = self.policies.read(policy_id);
            let current_time = get_block_timestamp();
            
            // Check each trigger condition
            let mut conditions_met = true;
            let mut i = 0;
            
            loop {
                if i >= policy.trigger_conditions_count {
                    break;
                }
                
                let condition = self.trigger_conditions.read((policy_id, i));
                let oracle_data = self.oracle_data.read(condition.data_type);
                
                // Check if oracle data is valid and recent (within 1 hour)
                if !oracle_data.is_valid {
                    conditions_met = false;
                    break;
                }
                
                if current_time - oracle_data.timestamp > 3600 {
                    conditions_met = false;
                    break;
                }
                
                // Check condition
                let condition_met = match condition.operator {
                    ComparisonOperator::GreaterThan => oracle_data.value > condition.threshold,
                    ComparisonOperator::LessThan => oracle_data.value < condition.threshold,
                    ComparisonOperator::Equal => oracle_data.value == condition.threshold,
                    ComparisonOperator::GreaterThanOrEqual => oracle_data.value >= condition.threshold,
                    ComparisonOperator::LessThanOrEqual => oracle_data.value <= condition.threshold,
                };
                
                if !condition_met {
                    conditions_met = false;
                    break;
                }
                
                i += 1;
            };
            
            conditions_met
        }

        // View functions
        fn get_policy(self: @ContractState, policy_id: u256) -> Policy {
            self.policies.read(policy_id)
        }

        fn get_total_liquidity(self: @ContractState) -> u256 {
            self.total_liquidity.read()
        }

        fn calculate_premium(self: @ContractState, policy_type: PolicyType, coverage_amount: u256) -> u256 {
            let base_rate = self.base_premium_rate.read();
            let risk_multiplier = self.risk_multipliers.read(policy_type);
            let basis_points = self.BASIS_POINTS.read();
            
            // Premium calculation: coverage * base_rate * risk_multiplier / (basis_points^2)
            let premium = coverage_amount * base_rate * risk_multiplier / (basis_points * basis_points);
            
            // Ensure minimum premium (0.1% of coverage)
            let min_premium = coverage_amount / 1000;
            if premium < min_premium {
                min_premium
            } else {
                premium
            }
        }

        fn get_liquidity_rewards(self: @ContractState, provider: ContractAddress) -> u256 {
            let provider_data = self.liquidity_providers.read(provider);
            let pending_rewards = self._calculate_pending_rewards(provider);
            provider_data.rewards_earned + pending_rewards
        }

        fn get_policy_count(self: @ContractState) -> u256 {
            self.policy_counter.read()
        }

        fn get_trigger_condition(self: @ContractState, policy_id: u256, index: u32) -> TriggerCondition {
            self.trigger_conditions.read((policy_id, index))
        }

        fn get_trigger_conditions_count(self: @ContractState, policy_id: u256) -> u32 {
            let policy = self.policies.read(policy_id);
            policy.trigger_conditions_count
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _calculate_pending_rewards(self: @ContractState, provider: ContractAddress) -> u256 {
            let provider_data = self.liquidity_providers.read(provider);
            let current_time = get_block_timestamp();
            let time_elapsed = current_time - provider_data.last_reward_claim;
            
            if provider_data.amount_provided == 0 || time_elapsed == 0 {
                return 0;
            }
            
            let reward_rate = self.liquidity_reward_rate.read();
            let seconds_per_year = self.SECONDS_PER_YEAR.read();
            let basis_points = self.BASIS_POINTS.read();
            
            // Calculate annual rewards and prorate for time elapsed
            let annual_rewards = provider_data.amount_provided * reward_rate / basis_points;
            let rewards = annual_rewards * time_elapsed.into() / seconds_per_year;
            
            rewards
        }
    }

    // Admin functions (only owner)
    #[external(v0)]
    fn authorize_oracle(ref self: ContractState, oracle: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner');
        self.authorized_oracles.write(oracle, true);
    }

    #[external(v0)]
    fn revoke_oracle(ref self: ContractState, oracle: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner');
        self.authorized_oracles.write(oracle, false);
    }

    #[external(v0)]
    fn update_risk_parameters(
        ref self: ContractState,
        policy_type: PolicyType,
        risk_multiplier: u256
    ) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner');
        self.risk_multipliers.write(policy_type, risk_multiplier);
    }
}