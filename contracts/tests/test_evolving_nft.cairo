#[cfg(test)]
mod tests {
    use contracts::EvolvingNFT::IEvolvingNFT;
use starknet::{ContractAddress, get_block_timestamp};
use snforge_std::{declare, ContractClassTrait};
    use starknet::contract_address_const;
    use snforge_std::{
         DeclareResultTrait, cheat_caller_address, CheatSpan,
        cheat_block_timestamp,
    };
    use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use contracts::interfaces::IERC721::{IERC721Dispatcher, IERC721DispatcherTrait};
    use contracts::EvolvingNFT::{IEvolvingNFTDispatcher, IEvolvingNFTDispatcherTrait};

    // Helper function to create test address
    fn get_test_address() -> ContractAddress {
        contract_address_const::<1>()
    }

    #[cfg(test)]
    fn test_constructor() {
        let name: felt252 = 'EvolvingNFT';
        let symbol: felt252 = 'ENFT';
        let contract = deploy_contract(name, symbol);
        let contract_dispatcher = IEvolvingNFTDispatcher { contract_address: contract };

        assert_eq!(contract_dispatcher.name(), name, "Incorrect name");
        assert_eq!(contract_dispatcher.symbol(), symbol, "Incorrect symbol");
        assert_eq!(contract_dispatcher.total_supply(), 0, "Total supply should be 0");
    }

    fn deploy_contract(name: felt252, symbol: felt252) -> ContractAddress {
        let contract = declare("EvolvingNFT").unwrap().contract_class();
        let mut calldata = array![
            name,
            symbol,
        ];
        // name.serialize(ref calldata);
        // symbol.serialize(ref calldata);
        let (contract_address, _) = contract.deploy(@calldata).unwrap();
        contract_address
    }
    
    #[cfg(test)]
    fn test_mint() {
        let mut contract = deploy_contract('EvolvingNFT', 'ENFT');
        let recipient = get_test_address();
        let metadata_hash = 'ipfs://initial';
        let contract_dispatcher = IEvolvingNFTDispatcher { contract_address: contract };

    
        let token_id:u256 = IEvolvingNFTDispatcherTrait::mint(contract_dispatcher, recipient, metadata_hash);
        assert_eq!(token_id, 1, "Token ID should be 1");
        assert_eq!(contract_dispatcher.owner_of(token_id), recipient, "Incorrect owner");
        assert_eq!(contract_dispatcher.balance_of(recipient), 1, "Incorrect balance");
        assert_eq!(contract_dispatcher.total_supply(), 1, "Incorrect total supply");
        assert_eq!(contract_dispatcher.get_evolution_stage(token_id), 0, "Initial stage should be 0");
    }

    #[cfg(test)]
    #[should_panic(expected: ('Invalid recipient',))]
    fn test_mint_to_zero_address() {
        let contract = deploy_contract('EvolvingNFT', 'ENFT');
        let metadata_hash = 'ipfs://initial';
        let contract_dispatcher = IEvolvingNFTDispatcher { contract_address: contract };
        let zero_address = contract_address_const::<0>();
        IEvolvingNFTDispatcherTrait::mint(contract_dispatcher, zero_address, metadata_hash); }
        #[cfg(test)]
        mod evolve_tests {
            use super::deploy_contract;
use starknet::testing::{set_block_timestamp, set_contract_address};
            use starknet::contract_address_const;
            use super::{IEvolvingNFTDispatcher, IEvolvingNFTDispatcherTrait};
        
            #[cfg(test)]
            fn test_evolve_by_time() {
                // Deploy the contract
                let contract = deploy_contract('EvolvingNFT', 'NFT');
                let contract_dispatcher = IEvolvingNFTDispatcher { contract_address: contract };
        
                // Set a test address as the caller (e.g., for minting)
                let recipient = contract_address_const::<0x123>();
                set_contract_address(recipient);
        
                // Mint a token
                let metadata_hash = 'ipfs://initial';
                let token_id: u256 = contract_dispatcher.mint(recipient, metadata_hash);
        
                // Assume mint sets evolution_timestamps to the current block timestamp (0 initially)
                // Warp time forward by 86400 seconds
                set_block_timestamp(86400);
        
                // Call evolve_by_time
                contract_dispatcher.evolve_by_time(token_id);
        
                // Check the new evolution stage
                assert(contract_dispatcher.get_evolution_stage(token_id) == 1, 'Stage should be 1');
            }
        }
    

        #[cfg(test)]
        mod tests {
            use super::deploy_contract;
use starknet::testing::{set_block_timestamp, set_contract_address};
            use starknet::contract_address_const;
            use super::{IEvolvingNFTDispatcher, IEvolvingNFTDispatcherTrait};
        
            #[cfg(test)]
            fn test_register_interaction() {
                let contract = deploy_contract('EvolvingNFT', 'NFT');
                let contract_dispatcher = IEvolvingNFTDispatcher { contract_address: contract };
                let recipient = contract_address_const::<0x123>();
                set_contract_address(recipient);
                let metadata_hash = 0; // Assumed felt252
                let token_id: u256 = contract_dispatcher.mint(recipient, metadata_hash);
                contract_dispatcher.register_interaction(token_id);
                assert(contract_dispatcher.get_interaction_count(token_id) == 1, 'Interaction count should be 1');
                let mut i: u256 = 0.into();
                while i != 9.into() {
                    contract_dispatcher.register_interaction(token_id);
                    i = i + 1.into();
                }
                assert(contract_dispatcher.get_evolution_stage(token_id) == 1, 'Stage after 10 interactions');
            }
        }

    #[cfg(test)]
    fn test_update_metadata_authorized() {
        let contract = deploy_contract("EvolvingNFT", "ENFT");
        let recipient = get_test_address();
        let updater = get_test_address();
        let token_id = contract.mint(recipient, 'ipfs://initial');

        // Authorize updater
        contract.set_authorized_updater(updater, true);
        assert(contract.is_authorized_updater(updater), 'Updater should be authorized');

        // Update metadata
        let new_metadata_hash = 'ipfs://updated';
        start_prank(updater);
        contract.update_metadata(token_id, new_metadata_hash);
        assert_eq!(contract.get_metadata_hash(token_id), new_metadata_hash, "Metadata not updated");
    }

    // #[cfg(test)]
    // #[should_panic(expected: ("Unauthorized updater",))]
    // fn test_update_metadata_unauthorized() {
    //     let mut contract = deploy_contract('EvolvingNFT', 'ENFT');
    //     let recipient = get_test_address();
    //     let unauthorized = contract_address_const::<2>();
    //     let token_id = contract.mint(recipient, 'ipfs://initial');

    //     start_prank(unauthorized);
    //     contract.update_metadata(token_id, 'ipfs://updated');
    // }

    // #[cfg(test)]
    // fn test_update_metadata_if_conditions_met() {
    //     let mut contract = deploy_contract('EvolvingNFT', 'ENFT');
    //     let recipient = get_test_address();
    //     let updater = get_test_address();
    //     let token_id = contract.mint(recipient, 'ipfs://initial');

    //     // Authorize updater and set stage
    //     contract.set_authorized_updater(updater, true);
    //     start_prank(updater);
    //     contract.set_evolution_stage(token_id, 1);

    //     // Update metadata with required stage
    //     let new_metadata_hash = 'ipfs://stage1';
    //     contract.update_metadata_if_conditions_met(token_id, new_metadata_hash, 1);
    //     assert_eq!(contract.get_metadata_hash(token_id), new_metadata_hash, "Metadata not updated");
    // }

    // #[cfg(test)]
    // #[should_panic(expected: ("not met",))]
    // fn test_update_metadata_conditions_not_met() {
    //     let mut contract = deploy_contract('EvolvingNFT', 'ENFT');
    //     let recipient = get_test_address();
    //     let updater = get_test_address();
    //     let token_id = contract.mint(recipient, 'ipfs://initial');

    //     contract.set_authorized_updater(updater, true);
    //     start_prank(updater);
    //     contract.update_metadata_if_conditions_met(token_id, 'ipfs://stage1', 1);
    // }

    // #[cfg(test)]
    // #[should_panic(expected: ("Token does not exist",))]
    // fn test_owner_of_nonexistent_token() {
    //     let contract = deploy_contract('EvolvingNFT', 'ENFT');
    //     contract.owner_of(999);
    // }
}