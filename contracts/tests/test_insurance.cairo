#[cfg(test)]
mod tests {
    use super::{
        ParametricInsurancePool, IParametricInsurancePoolDispatcher, IParametricInsurancePoolDispatcherTrait,
        MockOracle, IOracleDispatcher, IOracleDispatcherTrait,
        MockERC20, IERC20MockDispatcher, IERC20MockDispatcherTrait,
        PolicyType, DataType, TriggerCondition, ComparisonOperator
    };
    use starknet::{
        ContractAddress, contract_address_const, deploy_syscall, ClassHash,
        testing::{set_caller_address, set_block_timestamp}
    };

    // Test constants
    const OWNER: felt252 = 0x123;
    const USER1: felt252 = 0x456;
    const USER2: felt252 = 0x789;
    const ORACLE_UPDATER: felt252 = 0x999;

    fn setup() -> (
        IParametricInsurancePoolDispatcher,
        IERC20MockDispatcher,
        IOracleDispatcher,
        ContractAddress,
        ContractAddress,
        ContractAddress
    ) {
        let owner = contract_address_const::<OWNER>();
        let user1 = contract_address_const::<USER1>();
        let user2 = contract_address_const::<USER2>();
        
        // Deploy mock ERC20 token
        let token_class_hash = MockERC20::TEST_CLASS_HASH.try_into().unwrap();
        let mut token_calldata = array![];
        "Mock USDC".serialize(ref token_calldata);
        "mUSDC".serialize(ref token_calldata);
        6_u8.serialize(ref token_calldata);
        1000000000000_u256.serialize(ref token_calldata); // 1M tokens
        owner.serialize(ref token_calldata);
        
        let (token_address, _) = deploy_syscall(token_class_hash, 0, token_calldata.span(), false).unwrap();
        let token = IERC20MockDispatcher { contract_address: token_address };
        
        // Deploy mock oracle
        let oracle_class_hash = MockOracle::TEST_CLASS_HASH.try_into().unwrap();
        let mut oracle_calldata = array![];
        owner.serialize(ref oracle_calldata);
        
        let (oracle_address, _) = deploy_syscall(oracle_class_hash, 0, oracle_calldata.span(), false).unwrap();
        let oracle = IOracleDispatcher { contract_address: oracle_address };
        
        // Deploy insurance pool
        let pool_class_hash = ParametricInsurancePool::TEST_CLASS_HASH.try_into().unwrap();
        let mut pool_calldata = array![];
        owner.serialize(ref pool_calldata);
        token_address.serialize(ref pool_calldata);
        500_u256.serialize(ref pool_calldata); // 5% base premium rate
        1000_u256.serialize(ref pool_calldata); // 10% liquidity reward rate
        
        let (pool_address, _) = deploy_syscall(pool_class_hash, 0, pool_calldata.span(), false).unwrap();
        let pool = IParametricInsurancePoolDispatcher { contract_address: pool_address };
        
        // Setup initial state
        set_caller_address(owner);
        
        // Mint tokens to users
        token.mint(user1, 100000000000_u256); // 100k tokens
        token.mint(user2, 100000000000_u256); // 100k tokens
        
        // Authorize oracle updater
        oracle.authorize_updater(contract_address_const::<ORACLE_UPDATER>());
        
        // Authorize oracle in insurance pool
        pool.authorize_oracle(oracle_address);
        
        (pool, token, oracle, owner, user1, user2)
    }

    #[test]
    fn test_liquidity_provision() {
        let (pool, token, _, _, user1, _) = setup();
        
        set_caller_address(user1);
        let liquidity_amount = 50000000000_u256;
        
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        assert(pool.get_total_liquidity() == liquidity_amount, 'Incorrect total liquidity');
        
        let user_balance = token.balance_of(user1);
        assert(user_balance == 50000000000_u256, 'Incorrect user balance');
    }

    #[test]
    fn test_crop_insurance_policy_creation() {
        let (pool, token, _, _, user1, user2) = setup();
        
        // Provide liquidity
        set_caller_address(user1);
        let liquidity_amount = 50000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Fast forward time to accumulate rewards
        set_block_timestamp(365 * 24 * 60 * 60); // 1 year later
        
        // Check accumulated rewards
        let rewards = pool.get_liquidity_rewards(user1);
        assert(rewards > 0, 'Should have accumulated rewards');
        
        // Claim rewards
        let initial_balance = token.balance_of(user1);
        let claimed_rewards = pool.claim_rewards();
        
        assert(claimed_rewards == rewards, 'Claimed rewards should match calculated rewards');
        
        // Check balance increased
        let final_balance = token.balance_of(user1);
        assert(final_balance == initial_balance + claimed_rewards, 'Incorrect final balance');
    }

    #[test]
    fn test_premium_calculation_different_types() {
        let (pool, _, _, _, _, _) = setup();
        
        let coverage_amount = 10000000000_u256;
        
        // Test different policy types have different premiums
        let crop_premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        let flight_premium = pool.calculate_premium(PolicyType::FlightDelay, coverage_amount);
        let hurricane_premium = pool.calculate_premium(PolicyType::Hurricane, coverage_amount);
        let earthquake_premium = pool.calculate_premium(PolicyType::Earthquake, coverage_amount);
        let temp_premium = pool.calculate_premium(PolicyType::Temperature, coverage_amount);
        
        // Check relative pricing
        assert(earthquake_premium > hurricane_premium, 'Earthquake should be most expensive');
        assert(hurricane_premium > crop_premium, 'Hurricane should be more expensive than crop');
        assert(crop_premium > temp_premium, 'Crop should be more expensive than temperature');
        assert(temp_premium > flight_premium, 'Temperature should be more expensive than flight');
        
        // All premiums should be positive
        assert(crop_premium > 0, 'Crop premium should be positive');
        assert(flight_premium > 0, 'Flight premium should be positive');
        assert(hurricane_premium > 0, 'Hurricane premium should be positive');
        assert(earthquake_premium > 0, 'Earthquake premium should be positive');
        assert(temp_premium > 0, 'Temperature premium should be positive');
    }

    #[test]
    fn test_multiple_trigger_conditions() {
        let (pool, token, oracle, owner, user1, user2) = setup();
        
        // Setup
        set_caller_address(user2);
        let liquidity_amount = 100000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Create policy with multiple conditions
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        // Multiple conditions: low rainfall AND high temperature
        let rainfall_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        
        let temp_condition = TriggerCondition {
            data_type: DataType::Temperature,
            operator: ComparisonOperator::GreaterThan,
            threshold: 35_u256,
            duration: 86400_u64,
        };
        
        let trigger_conditions = array![rainfall_condition, temp_condition];
        
        let policy_id = pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            trigger_conditions,
            2592000_u64
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Update oracle to meet only one condition
        set_caller_address(owner);
        pool.update_oracle_data(DataType::Rainfall, 30_u256); // Meets rainfall condition
        pool.update_oracle_data(DataType::Temperature, 25_u256); // Doesn't meet temp condition
        
        // Should fail because not all conditions are met
        set_caller_address(user1);
        let payout_success = pool.claim_payout(policy_id);
        assert(!payout_success, 'Should fail when not all conditions met');
        
        // Now meet both conditions
        set_caller_address(owner);
        pool.update_oracle_data(DataType::Temperature, 40_u256); // Now meets temp condition
        
        // Should succeed now
        set_caller_address(user1);
        let payout_success = pool.claim_payout(policy_id);
        assert(payout_success, 'Should succeed when all conditions met');
    }

    #[test]
    fn test_liquidity_withdrawal() {
        let (pool, token, _, _, user1, _) = setup();
        
        // Provide liquidity
        set_caller_address(user1);
        let liquidity_amount = 50000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Withdraw partial liquidity
        let withdrawal_amount = 25000000000_u256;
        let initial_balance = token.balance_of(user1);
        
        pool.withdraw_liquidity(withdrawal_amount);
        
        // Check balance increased
        let final_balance = token.balance_of(user1);
        assert(final_balance == initial_balance + withdrawal_amount, 'Incorrect balance after withdrawal');
        
        // Check total liquidity decreased
        let total_liquidity = pool.get_total_liquidity();
        assert(total_liquidity == liquidity_amount - withdrawal_amount, 'Incorrect total liquidity');
    }

    #[test]
    #[should_panic(expected: ('Not authorized oracle',))]
    fn test_unauthorized_oracle_update() {
        let (pool, _, _, _, user1, _) = setup();
        
        // Try to update oracle data from unauthorized address
        set_caller_address(user1);
        pool.update_oracle_data(DataType::Rainfall, 100_u256);
    }

    #[test]
    #[should_panic(expected: ('Premium too low',))]
    fn test_policy_creation_premium_too_low() {
        let (pool, token, _, _, user1, user2) = setup();
        
        // Provide liquidity first
        set_caller_address(user2);
        let liquidity_amount = 100000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Try to create policy with premium below calculated amount
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let calculated_premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        let low_premium = calculated_premium / 2; // Half the required premium
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        let trigger_conditions = array![trigger_condition];
        
        pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            low_premium,
            trigger_conditions,
            2592000_u64
        );
    }

    #[test]
    #[should_panic(expected: ('Not policy holder',))]
    fn test_unauthorized_policy_claim() {
        let (pool, token, _, _, user1, user2) = setup();
        
        // Setup policy with user1
        set_caller_address(user2);
        token.approve(pool.contract_address, 100000000000_u256);
        pool.provide_liquidity(100000000000_u256);
        
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        
        let policy_id = pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            array![trigger_condition],
            2592000_u64
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Try to claim from different user (should panic)
        set_caller_address(user2);
        pool.claim_payout(policy_id);
    }

    #[test]
    #[should_panic(expected: ('Insufficient liquidity',))]
    fn test_policy_creation_insufficient_liquidity() {
        let (pool, _, _, _, user1, _) = setup();
        
        // Try to create policy without sufficient liquidity backing
        set_caller_address(user1);
        let coverage_amount = 100000000000_u256; // 100k tokens (no liquidity provided)
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        let trigger_conditions = array![trigger_condition];
        
        pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            trigger_conditions,
            2592000_u64
        );
    }

    #[test]
    fn test_oracle_data_freshness() {
        let (pool, token, oracle, owner, user1, user2) = setup();
        
        // Setup policy
        set_caller_address(user2);
        token.approve(pool.contract_address, 100000000000_u256);
        pool.provide_liquidity(100000000000_u256);
        
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        
        let policy_id = pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            array![trigger_condition],
            2592000_u64
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Update oracle with triggering data
        set_caller_address(contract_address_const::<ORACLE_UPDATER>());
        oracle.update_data(2_u8, 30_u256);
        
        set_caller_address(owner);
        pool.update_oracle_data(DataType::Rainfall, 30_u256);
        
        // Should succeed with fresh data
        set_caller_address(user1);
        let fresh_check = pool.check_trigger_conditions(policy_id);
        assert(fresh_check, 'Should pass with fresh oracle data');
        
        // Fast forward time to make data stale (more than 1 hour)
        set_block_timestamp(7200); // 2 hours later
        
        // Now the same data should be considered stale
        let stale_check = pool.check_trigger_conditions(policy_id);
        assert(!stale_check, 'Should fail with stale oracle data');
    }

    #[test]
    fn test_earthquake_insurance() {
        let (pool, token, oracle, owner, user1, user2) = setup();
        
        // Setup liquidity
        set_caller_address(user2);
        let liquidity_amount = 150000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Create earthquake policy
        set_caller_address(user1);
        let coverage_amount = 30000000000_u256;
        let premium = pool.calculate_premium(PolicyType::Earthquake, coverage_amount);
        
        // Earthquake magnitude >= 6.0 (represented as 60 for precision)
        let earthquake_condition = TriggerCondition {
            data_type: DataType::SeismicActivity,
            operator: ComparisonOperator::GreaterThanOrEqual,
            threshold: 60_u256,
            duration: 0_u64,
        };
        
        let policy_id = pool.create_policy(
            PolicyType::Earthquake,
            coverage_amount,
            premium,
            array![earthquake_condition],
            31536000_u64 // 1 year
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Simulate magnitude 7.2 earthquake
        set_caller_address(contract_address_const::<ORACLE_UPDATER>());
        oracle.update_data(20_u8, 72_u256);
        
        set_caller_address(owner);
        pool.update_oracle_data(DataType::SeismicActivity, 72_u256);
        
        // Claim payout
        set_caller_address(user1);
        let payout_success = pool.claim_payout(policy_id);
        assert(payout_success, 'Earthquake payout should succeed');
    }

    #[test]
    fn test_flight_delay_insurance() {
        let (pool, token, oracle, owner, user1, user2) = setup();
        
        // Setup liquidity
        set_caller_address(user2);
        let liquidity_amount = 100000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Create flight delay policy
        set_caller_address(user1);
        let coverage_amount = 5000000000_u256;
        let premium = pool.calculate_premium(PolicyType::FlightDelay, coverage_amount);
        
        // Flight status: 1 = delayed, 2 = cancelled
        let delay_condition = TriggerCondition {
            data_type: DataType::FlightStatus,
            operator: ComparisonOperator::GreaterThanOrEqual,
            threshold: 1_u256,
            duration: 0_u64,
        };
        
        let policy_id = pool.create_policy(
            PolicyType::FlightDelay,
            coverage_amount,
            premium,
            array![delay_condition],
            86400_u64 // 24 hours
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Simulate flight delay
        set_caller_address(contract_address_const::<ORACLE_UPDATER>());
        oracle.update_data(10_u8, 1_u256); // Delayed
        
        set_caller_address(owner);
        pool.update_oracle_data(DataType::FlightStatus, 1_u256);
        
        // Claim payout
        set_caller_address(user1);
        let payout_success = pool.claim_payout(policy_id);
        assert(payout_success, 'Flight delay payout should succeed');
    }
}idity
        set_caller_address(user2);
        let liquidity_amount = 100000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Create crop insurance policy
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        let trigger_conditions = array![trigger_condition];
        
        let policy_id = pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            trigger_conditions,
            2592000_u64 // 30 days
        );
        
        assert(policy_id == 1, 'Incorrect policy ID');
        
        let policy = pool.get_policy(policy_id);
        assert(policy.holder == user1, 'Incorrect policy holder');
        assert(policy.coverage_amount == coverage_amount, 'Incorrect coverage amount');
        assert(!policy.is_active, 'Policy should not be active before premium payment');
    }

    #[test]
    fn test_premium_payment_and_activation() {
        let (pool, token, _, _, user1, user2) = setup();
        
        // Setup policy
        set_caller_address(user2);
        let liquidity_amount = 100000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        let trigger_conditions = array![trigger_condition];
        
        let policy_id = pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            trigger_conditions,
            2592000_u64
        );
        
        // Pay premium
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        let policy = pool.get_policy(policy_id);
        assert(policy.is_active, 'Policy should be active after premium payment');
        assert(policy.premium_paid, 'Premium should be marked as paid');
    }

    #[test]
    fn test_successful_claim_payout() {
        let (pool, token, oracle, owner, user1, user2) = setup();
        
        // Setup policy
        set_caller_address(user2);
        let liquidity_amount = 100000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        let trigger_conditions = array![trigger_condition];
        
        let policy_id = pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            trigger_conditions,
            2592000_u64
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Update oracle to trigger condition
        set_caller_address(contract_address_const::<ORACLE_UPDATER>());
        oracle.update_data(2_u8, 30_u256); // 30mm rainfall (below 50mm threshold)
        
        set_caller_address(owner);
        pool.update_oracle_data(DataType::Rainfall, 30_u256);
        
        // Claim payout
        set_caller_address(user1);
        let initial_balance = token.balance_of(user1);
        let payout_success = pool.claim_payout(policy_id);
        
        assert(payout_success, 'Payout should be successful');
        
        let final_balance = token.balance_of(user1);
        assert(final_balance == initial_balance + coverage_amount, 'Incorrect payout amount');
        
        let policy = pool.get_policy(policy_id);
        assert(!policy.is_active, 'Policy should be inactive after payout');
        assert(policy.payout_claimed, 'Payout should be marked as claimed');
    }

    #[test]
    fn test_failed_claim_conditions_not_met() {
        let (pool, token, oracle, owner, user1, user2) = setup();
        
        // Setup policy
        set_caller_address(user2);
        let liquidity_amount = 100000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        set_caller_address(user1);
        let coverage_amount = 10000000000_u256;
        let premium = pool.calculate_premium(PolicyType::CropInsurance, coverage_amount);
        
        let trigger_condition = TriggerCondition {
            data_type: DataType::Rainfall,
            operator: ComparisonOperator::LessThan,
            threshold: 50_u256,
            duration: 86400_u64,
        };
        let trigger_conditions = array![trigger_condition];
        
        let policy_id = pool.create_policy(
            PolicyType::CropInsurance,
            coverage_amount,
            premium,
            trigger_conditions,
            2592000_u64
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Update oracle with data that DOESN'T trigger condition
        set_caller_address(contract_address_const::<ORACLE_UPDATER>());
        oracle.update_data(2_u8, 80_u256); // 80mm rainfall (above 50mm threshold)
        
        set_caller_address(owner);
        pool.update_oracle_data(DataType::Rainfall, 80_u256);
        
        // Try to claim payout
        set_caller_address(user1);
        let initial_balance = token.balance_of(user1);
        let payout_success = pool.claim_payout(policy_id);
        
        assert(!payout_success, 'Payout should fail when conditions not met');
        
        let final_balance = token.balance_of(user1);
        assert(final_balance == initial_balance, 'Balance should not change on failed payout');
    }

    #[test]
    fn test_hurricane_insurance() {
        let (pool, token, oracle, owner, user1, user2) = setup();
        
        // Setup liquidity
        set_caller_address(user2);
        let liquidity_amount = 200000000000_u256;
        token.approve(pool.contract_address, liquidity_amount);
        pool.provide_liquidity(liquidity_amount);
        
        // Create hurricane policy
        set_caller_address(user1);
        let coverage_amount = 50000000000_u256;
        let premium = pool.calculate_premium(PolicyType::Hurricane, coverage_amount);
        
        let hurricane_condition = TriggerCondition {
            data_type: DataType::WeatherData,
            operator: ComparisonOperator::GreaterThanOrEqual,
            threshold: 3_u256, // Category 3+
            duration: 3600_u64,
        };
        let trigger_conditions = array![hurricane_condition];
        
        let policy_id = pool.create_policy(
            PolicyType::Hurricane,
            coverage_amount,
            premium,
            trigger_conditions,
            7776000_u64 // 90 days
        );
        
        token.approve(pool.contract_address, premium);
        pool.pay_premium(policy_id);
        
        // Simulate Category 4 hurricane
        set_caller_address(contract_address_const::<ORACLE_UPDATER>());
        oracle.update_data(30_u8, 4_u256);
        
        set_caller_address(owner);
        pool.update_oracle_data(DataType::WeatherData, 4_u256);
        
        // Claim payout
        set_caller_address(user1);
        let initial_balance = token.balance_of(user1);
        let payout_success = pool.claim_payout(policy_id);
        
        assert(payout_success, 'Hurricane payout should succeed');
        
        let final_balance = token.balance_of(user1);
        assert(final_balance == initial_balance + coverage_amount, 'Incorrect hurricane payout');
    }

    #[test]
    fn test_liquidity_rewards() {
        let (pool, token, _, _, user1, _) = setup();
        
        // Provide liqu