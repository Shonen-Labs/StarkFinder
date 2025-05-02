#[cfg(test)]
mod tests {
    use contracts::EvolvingNFT::{IEvolvingNFT, IEvolvingNFTDispatcher, IEvolvingNFTDispatcherTrait};
    use contracts::interfaces::IERC721::{IERC721Dispatcher, IERC721DispatcherTrait};
    use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use snforge_std::{
        CheatSpan, ContractClassTrait, DeclareResultTrait, cheat_block_timestamp,
        cheat_caller_address, declare, start_cheat_caller_address, stop_cheat_caller_address,
    };
    use starknet::{ContractAddress, contract_address_const, get_block_timestamp};

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
        let mut calldata = array![name, symbol];
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

        let token_id: u256 = IEvolvingNFTDispatcherTrait::mint(
            contract_dispatcher, recipient, metadata_hash,
        );
        assert_eq!(token_id, 1, "Token ID should be 1");
        assert_eq!(contract_dispatcher.owner_of(token_id), recipient, "Incorrect owner");
        assert_eq!(contract_dispatcher.balance_of(recipient), 1, "Incorrect balance");
        assert_eq!(contract_dispatcher.total_supply(), 1, "Incorrect total supply");
        assert_eq!(
            contract_dispatcher.get_evolution_stage(token_id), 0, "Initial stage should be 0",
        );
    }

    #[cfg(test)]
    mod tests {
        use starknet::contract_address_const;
        use starknet::testing::{set_block_timestamp, set_contract_address};
        use super::{IEvolvingNFTDispatcher, IEvolvingNFTDispatcherTrait, deploy_contract};

        #[cfg(test)]
        fn test_register_interaction() {
            let contract = deploy_contract('EvolvingNFT', 'NFT');
            let contract_dispatcher = IEvolvingNFTDispatcher { contract_address: contract };
            let recipient = contract_address_const::<0x123>();
            set_contract_address(recipient);
            let metadata_hash = 0; // Assumed felt252
            let token_id: u256 = contract_dispatcher.mint(recipient, metadata_hash);
            contract_dispatcher.register_interaction(token_id);
            assert(
                contract_dispatcher.get_interaction_count(token_id) == 1,
                'Interaction count should be 1',
            );
            let mut i: u256 = 0.into();
            while i != 9.into() {
                contract_dispatcher.register_interaction(token_id);
                i = i + 1.into();
            };
            assert(
                contract_dispatcher.get_evolution_stage(token_id) == 1,
                'Stage after 10 interactions',
            );
        }
    }


    #[cfg(test)]
    fn test_update_metadata_authorized() {
        let contract = deploy_contract('EvolvingNFT', 'NFT');
        let contract_dispatcher = IEvolvingNFTDispatcher { contract_address: contract };
        let recipient = get_test_address();
        let updater = get_test_address();
        let token_id: u256 = contract_dispatcher.mint(recipient, 'ipfs://initial');

        // Authorize updater
        contract_dispatcher.set_authorized_updater(updater, true);
        assert(contract_dispatcher.is_authorized_updater(updater), 'Updater should be authorized');
        // Update metadata
        let new_metadata_hash = 'ipfs://updated';
        // start_prank(updater);
        start_cheat_caller_address(contract, updater);
        contract_dispatcher.update_metadata(token_id, new_metadata_hash);
        assert_eq!(
            contract_dispatcher.get_metadata_hash(token_id),
            new_metadata_hash,
            "Metadata not updated",
        );
    }
}
