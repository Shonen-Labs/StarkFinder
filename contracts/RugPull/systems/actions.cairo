use dojo_starter::models::PlayerBalance;
use dojo_starter::models::PlatformFees;
use dojo_starter::models::GameOutcome;

// Define the interface
#[starknet::interface]
trait IHitThePlay<T> {
    fn initialize_platform_fees(ref self: T, fee_percentage: u8);
    fn play_game(ref self: T);
}

// Dojo decorator
#[dojo::contract]
pub mod rugged {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use dojo_starter::models::{PlayerBalance, PlatformFees, GameOutcome};
    use core::traits::TryInto;
    use dojo::model::{ModelStorage, ModelValueStorage};
    use dojo::event::EventStorage;
    use super::IHitThePlay;
    use core::poseidon::PoseidonTrait;
    use core::hash::{HashStateTrait, HashStateExTrait};

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub enum Event {
        GamePlayed: GamePlayed,
    }

    #[derive(Drop, Serde, starknet::Event)]
    #[dojo::event]
    pub struct GamePlayed {
        #[key]
        player: ContractAddress,
        result: bool, // True if won, False if lost
        amount: u128, // Amount won/lost
    }


    #[abi(embed_v0)]
    impl IHitThePlayImpl of IHitThePlay<ContractState> {
        fn initialize_platform_fees(ref self: ContractState, fee_percentage: u8) {
            let admin = get_caller_address();
            let mut world = self.world(@"dojo_starter-rugged");
            world.write_model(@PlatformFees { admin, fee_percentage });
        }

        fn play_game(ref self: ContractState) {
            let player = get_caller_address();
            let mut world = self.world(@"dojo_starter-rugged");

            // Get player balance or initialize new one
            let mut player_balance: PlayerBalance = world.read_model(player);
            let bet_amount: u128 = 100;
            // Ensure the player has enough balance
            // assert(player_balance.balance >= bet_amount, 'Insufficient balance');

            // Deduct bet amount from player balance
            // player_balance.balance -= bet_amount;
            player_balance.total_games += 1;

            // Generate pseudo-random number using block timestamp and player address
            let block_timestamp: felt252 = get_block_timestamp().into();

            // Use Poseidon hash to generate a seed
            let seed = PoseidonTrait::new().update(block_timestamp).finalize();

            // Convert seed to u128 safely
            let seed_u128: u128 = seed.try_into().unwrap_or(0_u128);
            let random_value = seed_u128 % 10_u128;

            // 30% chance to win (values 0,1,2 represent win)
            let won = random_value < 3_u128;
            let mut amount_won: u128 = 0;

            if won {
                // Get platform fees
                let fees: PlatformFees = world.read_model(player);
                let fee_percentage: u128 = 10;
                let fee_deduction = (bet_amount * fee_percentage) / 100_u128;
                amount_won = bet_amount * 2_u128 - fee_deduction;

                // Update player stats
                player_balance.balance += amount_won;
                player_balance.wins += 1;
            } else {
                player_balance.losses += 1;
            }

            // Update world state
            let game_outcome = GameOutcome { player, won, amount_won, };
            world.write_model(@game_outcome);

            let player_balance = PlayerBalance {
                player,
                balance: player_balance.balance,
                total_games: player_balance.total_games,
                wins: player_balance.wins,
                losses: player_balance.losses,
            };
            world.write_model(@player_balance);

            // Emit game played event
            self.emit(GamePlayed { player, result: won, amount: amount_won });
        }
    }
}