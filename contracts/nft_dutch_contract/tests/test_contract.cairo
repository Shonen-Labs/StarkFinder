use starknet::ContractAddress;
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, spy_events, EventSpy
};

use core::traits::TryInto;
use core::option::OptionTrait;

use nft_dutch_contract::interfaces::inft_dutch_auction::{INFTDutchAuctionDispatcher, INFTDutchAuctionDispatcherTrait};
use nft_dutch_contract::interfaces::ierc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use nft_dutch_contract::interfaces::ierc721::{IERC721Dispatcher, IERC721DispatcherTrait};

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

fn deploy_erc20(owner: ContractAddress) -> ContractAddress {
    let erc20_contract = declare("MockERC20").unwrap().contract_class();
    let mut calldata = array![];
    calldata.append(owner.into());
    let (contract_address, _) = erc20_contract.deploy(@calldata).unwrap();
    contract_address
}

fn deploy_erc721(owner: ContractAddress) -> ContractAddress {
    let erc721_contract = declare("MockERC721").unwrap().contract_class();
    let mut calldata = array![];
    calldata.append(owner.into());
    let (contract_address, _) = erc721_contract.deploy(@calldata).unwrap();
    contract_address
}

fn deploy_dutch_auction(
    erc20_token: ContractAddress,
    erc721_token: ContractAddress,
    starting_price: u64,
    seller: ContractAddress,
    duration: u64,
    discount_rate: u64,
    total_supply: u128
) -> ContractAddress {
    let contract = declare("NFTDutchAuction").unwrap().contract_class();
    let mut calldata = array![];
    calldata.append(erc20_token.into());
    calldata.append(erc721_token.into());
    calldata.append(starting_price.into());
    calldata.append(seller.into());
    calldata.append(duration.into());
    calldata.append(discount_rate.into());
    calldata.append(total_supply.into());
    
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    contract_address
}

#[test]
fn test_dutch_auction_constructor() {
    let owner = starknet::contract_address_const::<0x123>();
    let erc20_token = deploy_erc20(owner);
    let erc721_token = deploy_erc721(owner);
    
    let auction = deploy_dutch_auction(
        erc20_token, 
        erc721_token, 
        1000, // starting price 
        owner, 
        100,  // duration 
        10,   // discount rate
        5     // total supply
    );
    
    let dutch_auction_dispatcher = INFTDutchAuctionDispatcher { contract_address: auction };
    
    // Check initial price is the starting price
    assert(dutch_auction_dispatcher.get_price() == 1000, 'Incorrect initial price');
}
