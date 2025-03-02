use starknet::ContractAddress;
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, cheat_block_timestamp, CheatSpan,
    cheat_caller_address,
};

use core::traits::TryInto;
use core::option::OptionTrait;

use contracts::interfaces::INFTDutchAuction::{
    INFTDutchAuctionDispatcher, INFTDutchAuctionDispatcherTrait,
};
use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use contracts::interfaces::IERC721::{IERC721Dispatcher, IERC721DispatcherTrait};
fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

fn deploy_erc20() -> ContractAddress {
    let name: ByteArray = "MockToken";
    let symbol: ByteArray = "MTK";
    let contract = declare("MockToken").unwrap().contract_class();

    let mut constructor_calldata = ArrayTrait::new();
    name.serialize(ref constructor_calldata);
    symbol.serialize(ref constructor_calldata);

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

fn deploy_erc721() -> ContractAddress {
    const name: felt252 = 'MockERC721';
    const symbol: felt252 = 'MKT';
    let erc721 = declare("MockERC721").unwrap().contract_class();
    let erc721_constructor_calldata = array![name, symbol];
    let (contract_address, _) = erc721.deploy(@erc721_constructor_calldata).unwrap();
    contract_address
}

fn deploy_dutch_auction(
    erc20_token: ContractAddress,
    erc721_token: ContractAddress,
    starting_price: u64,
    seller: ContractAddress,
    duration: u64,
    discount_rate: u64,
    total_supply: u128,
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
    let erc20_token = deploy_erc20();
    let erc721_token = deploy_erc721();

    let auction = deploy_dutch_auction(
        erc20_token,
        erc721_token,
        1000, // starting price 
        owner,
        100, // duration 
        10, // discount rate
        5 // total supply
    );

    let dutch_auction_dispatcher = INFTDutchAuctionDispatcher { contract_address: auction };

    // Check initial price is the starting price
    assert(dutch_auction_dispatcher.get_price() == 1000, 'Incorrect initial price');
}

#[test]
fn test_price_decreases_after_some_time() {
    let owner = starknet::contract_address_const::<0x123>();
    let erc20_token = deploy_erc20();
    let erc721_token = deploy_erc721();

    let nft_auction_address = deploy_dutch_auction(
        erc20_token,
        erc721_token,
        1000, // starting price 
        owner,
        100, // duration 
        10, // discount rate
        5 // total supply
    );

    let nft_auction_dispatcher = INFTDutchAuctionDispatcher {
        contract_address: nft_auction_address,
    };

    let nft_price_before_time_travel = nft_auction_dispatcher.get_price();

    // Forward time
    let forward_blocktime_by = 10000; // 10 seconds (in milliseconds)
    cheat_block_timestamp(nft_auction_address, forward_blocktime_by, CheatSpan::TargetCalls(1));

    let nft_price_after_time_travel = nft_auction_dispatcher.get_price();

    assert_gt!(nft_price_before_time_travel, nft_price_after_time_travel);
}


#[test]
fn test_buy_asset() {
    let seller = starknet::contract_address_const::<0x123>();
    let erc20_address = deploy_erc20();
    let erc721_address = deploy_erc721();

    let nft_auction_address = deploy_dutch_auction(
        erc20_address,
        erc721_address,
        500, // starting price 
        seller,
        60, // duration 
        5, // discount rate
        2 // total supply
    );

    let erc721_dispatcher = IERC721Dispatcher { contract_address: erc721_address };
    let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_address };
    let nft_auction_dispatcher = INFTDutchAuctionDispatcher {
        contract_address: nft_auction_address,
    };
    let erc20_admin: ContractAddress = 'admin'.try_into().unwrap();
    let buyer: ContractAddress = 'buyer'.try_into().unwrap();

    // Transfer erc20 tokens to buyer
    assert_eq!(erc20_dispatcher.balance_of(buyer), 0.into());
    erc20_dispatcher.mint(erc20_admin, 10000);
    cheat_caller_address(erc20_address, erc20_admin, CheatSpan::TargetCalls(1));
    let transfer_amt = 5000;
    erc20_dispatcher.transfer(buyer, transfer_amt.into());
    assert_eq!(erc20_dispatcher.balance_of(buyer), transfer_amt.into());

    let nft_id_1 = 1;
    let seller_bal_before_buy = erc20_dispatcher.balance_of(seller);
    let buyer_bal_before_buy = erc20_dispatcher.balance_of(buyer);
    let nft_price = nft_auction_dispatcher.get_price().into();
    // Buy token
    cheat_caller_address(nft_auction_address, buyer, CheatSpan::TargetCalls(3));
    cheat_caller_address(erc20_address, buyer, CheatSpan::TargetCalls(2));
    // buyer approves nft auction contract to spend own erc20 token
    erc20_dispatcher.approve(nft_auction_address, nft_price);

    nft_auction_dispatcher.buy(nft_id_1);

    let seller_bal_after_buy = erc20_dispatcher.balance_of(seller);
    let buyer_bal_after_buy = erc20_dispatcher.balance_of(buyer);

    assert_eq!(seller_bal_after_buy, seller_bal_before_buy + nft_price);
    assert_eq!(buyer_bal_after_buy, buyer_bal_before_buy - nft_price);
    assert_eq!(erc721_dispatcher.owner_of(nft_id_1), buyer);

    // Forward block timestamp in order for a reduced nft price
    let forward_blocktime_by = 4000; // milliseconds
    cheat_block_timestamp(nft_auction_address, forward_blocktime_by, CheatSpan::TargetCalls(1));

    // Buy token again after some time
    let nft_id_2 = 2;

    cheat_caller_address(nft_auction_address, buyer, CheatSpan::TargetCalls(1));
    cheat_caller_address(erc20_address, buyer, CheatSpan::TargetCalls(2));
    // buyer approves nft auction contract to spend own erc20 token
    erc20_dispatcher.approve(nft_auction_address, nft_price);

    assert_ne!(erc721_dispatcher.owner_of(nft_id_2), buyer);
    nft_auction_dispatcher.buy(nft_id_2);
    assert_eq!(erc721_dispatcher.owner_of(nft_id_2), buyer);
}


#[test]
#[should_panic(expected: 'auction has ended')]
fn test_buy_should_panic_when_total_supply_reached() {
    let owner = starknet::contract_address_const::<0x123>();
    let erc20_address = deploy_erc20();
    let erc721_address = deploy_erc721();

    let nft_auction_address = deploy_dutch_auction(
        erc20_address,
        erc721_address,
        500, // starting price 
        owner,
        60, // duration 
        5, // discount rate
        2 // total supply
    );
    let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_address };
    let nft_auction_dispatcher = INFTDutchAuctionDispatcher {
        contract_address: nft_auction_address,
    };
    let erc20_admin: ContractAddress = 'admin'.try_into().unwrap();
    let buyer: ContractAddress = 'buyer'.try_into().unwrap();

    erc20_dispatcher.mint(erc20_admin, 10000);

    // Transfer erc20 tokens to buyer
    let transfer_amt = 5000;
    cheat_caller_address(erc20_address, erc20_admin, CheatSpan::TargetCalls(1));
    erc20_dispatcher.transfer(buyer, transfer_amt.into());

    let nft_id_1 = 1;
    let nft_price = nft_auction_dispatcher.get_price().into();

    // buyer approves nft auction contract to spend own erc20 token
    cheat_caller_address(erc20_address, buyer, CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(nft_auction_address, nft_price);

    // Buy token
    cheat_caller_address(nft_auction_address, buyer, CheatSpan::TargetCalls(1));
    nft_auction_dispatcher.buy(nft_id_1);

    // Forward block timestamp in order for a reduced nft price
    let forward_blocktime_by = 4000; // 4 seconds (in milliseconds)

    // Buy token again after some time
    let nft_id_2 = 2;

    cheat_block_timestamp(nft_auction_address, forward_blocktime_by, CheatSpan::TargetCalls(1));
    let nft_price = nft_auction_dispatcher.get_price().into();

    // buyer approves nft auction contract to spend own erc20 token
    cheat_caller_address(erc20_address, buyer, CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(nft_auction_address, nft_price);

    cheat_caller_address(nft_auction_address, buyer, CheatSpan::TargetCalls(1));
    cheat_block_timestamp(nft_auction_address, forward_blocktime_by, CheatSpan::TargetCalls(1));
    nft_auction_dispatcher.buy(nft_id_2);

    // Buy token again after the total supply has reached
    let nft_id_3 = 3;
    let nft_price = nft_auction_dispatcher.get_price().into();

    // buyer approves nft auction contract to spend own erc20 token
    cheat_caller_address(erc20_address, buyer, CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(nft_auction_address, nft_price);

    // Buy token
    cheat_caller_address(nft_auction_address, buyer, CheatSpan::TargetCalls(4));
    nft_auction_dispatcher.buy(nft_id_3);
}

#[test]
#[should_panic(expected: 'auction has ended')]
fn test_buy_should_panic_when_duration_ended() {
    let owner = starknet::contract_address_const::<0x123>();
    let erc20_address = deploy_erc20();
    let erc721_address = deploy_erc721();

    let nft_auction_address = deploy_dutch_auction(
        erc20_address,
        erc721_address,
        500, // starting price 
        owner,
        60, // duration 
        5, // discount rate
        2 // total supply
    );
    let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_address };
    let nft_auction_dispatcher = INFTDutchAuctionDispatcher {
        contract_address: nft_auction_address,
    };

    let erc20_admin: ContractAddress = 'admin'.try_into().unwrap();
    let buyer: ContractAddress = 'buyer'.try_into().unwrap();

    erc20_dispatcher.mint(erc20_admin, 10000);

    // Transfer erc20 tokens to buyer
    let transfer_amt = 5000;

    cheat_caller_address(erc20_address, erc20_admin, CheatSpan::TargetCalls(1));
    erc20_dispatcher.transfer(buyer, transfer_amt.into());

    let nft_id_1 = 1;
    let nft_price = nft_auction_dispatcher.get_price().into();

    // buyer approves nft auction contract to spend own erc20 token
    cheat_caller_address(erc20_address, buyer, CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(nft_auction_address, nft_price);

    // Buy token
    cheat_caller_address(nft_auction_address, buyer, CheatSpan::TargetCalls(1));
    nft_auction_dispatcher.buy(nft_id_1);

    // Forward block timestamp to a time after duration has ended
    // During deployment, duration was set to 60 seconds
    let forward_blocktime_by = 61000; // 61 seconds (in milliseconds)
    cheat_block_timestamp(nft_auction_address, forward_blocktime_by, CheatSpan::TargetCalls(1));
    let nft_price = nft_auction_dispatcher.get_price().into();
    // Buy token again after some time
    let nft_id_2 = 2;

    // buyer approves nft auction contract to spend own erc20 token
    cheat_caller_address(erc20_address, buyer, CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(nft_auction_address, nft_price);

    cheat_block_timestamp(nft_auction_address, forward_blocktime_by, CheatSpan::TargetCalls(1));
    cheat_caller_address(nft_auction_address, buyer, CheatSpan::TargetCalls(1));
    nft_auction_dispatcher.buy(nft_id_2);
}

