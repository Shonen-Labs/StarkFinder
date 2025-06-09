
// Parametric Insurance Pool Library
// Main module declarations for the StarkFinder insurance system




pub mod liquid_democracy_dao;
pub mod interfaces;

mod parametric_insurance;
mod oracle;
mod mock_erc20;

// Re-export main contracts for easy access
use parametric_insurance::ParametricInsurancePool;
use oracle::{MockOracle, OracleIntegration};
use mock_erc20::MockERC20;

// Re-export interfaces
use parametric_insurance::IParametricInsurancePool;
use oracle::{IOracle, IOracleIntegration};
use mock_erc20::IERC20Mock;

// Re-export types and structs
use parametric_insurance::{
    PolicyType, DataType, TriggerCondition, ComparisonOperator, 
    Policy, LiquidityProvider, OracleData
};