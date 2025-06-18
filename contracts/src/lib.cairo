// Module declarations - must come first
mod parametric_insurance;
mod oracle;
mod mock_erc20;

// Re-export main contracts for easy access
pub use parametric_insurance::ParametricInsurancePool;
pub use oracle::{MockOracle, OracleIntegration};
pub use mock_erc20::MockERC20;

// Re-export interfaces
pub use parametric_insurance::IParametricInsurancePool;
pub use oracle::{IOracle, IOracleIntegration};
pub use mock_erc20::IERC20Mock;

// Re-export types and structs
pub use parametric_insurance::{
    PolicyType, DataType, TriggerCondition, ComparisonOperator, 
    Policy, LiquidityProvider, OracleData
};