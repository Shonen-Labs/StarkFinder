use starknet::ContractAddress;

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct PlayerBalance {
    #[key]
    pub player: ContractAddress,
    pub balance: u128,      // The balance in STRK tokens
    pub total_games: u64,   // Total games played
    pub wins: u64,          // Total wins
    pub losses: u64,        // Total losses
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct PlatformFees {
    #[key]
    pub admin: ContractAddress,
    pub fee_percentage: u8, // Platform fee percentage, e.g., 20
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct GameOutcome {
    #[key]
    pub player: ContractAddress,
    pub won: bool,          // Win or lose status
    pub amount_won: u128,   // Amount won after deduction
}