use starknet::{ContractAddress, contract_address_const};
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, cheat_caller_address, CheatSpan,
    cheat_block_timestamp, spy_events, EventSpyAssertionsTrait,
};
use core::array::ArrayTrait;
use contracts::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use contracts::crowdfunding::{
    CampaignCreated, CampaignFunded, CampaignResolved, ICrowdfundingDispatcher,
    ICrowdfundingDispatcherTrait, Crowdfunding, CampaignStatus,
};

fn USER1() -> ContractAddress {
    contract_address_const::<'USER1'>()
}

fn USER2() -> ContractAddress {
    contract_address_const::<'USER2'>()
}

fn USER3() -> ContractAddress {
    contract_address_const::<'USER3'>()
}

fn deploy_token() -> ContractAddress {
    let name: ByteArray = "MockToken";
    let symbol: ByteArray = "MTK";
    let contract = declare("MockToken").unwrap().contract_class();

    let mut constructor_calldata = ArrayTrait::new();
    name.serialize(ref constructor_calldata);
    symbol.serialize(ref constructor_calldata);

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

fn deploy_crowdfunding(token_contract: ContractAddress) -> ContractAddress {
    let contract = declare("Crowdfunding").unwrap().contract_class();

    let mut constructor_calldata = ArrayTrait::new();
    token_contract.serialize(ref constructor_calldata);
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

/// Utility function, USER1 creates this campaign
fn init_default_campaign(dispatcher: ICrowdfundingDispatcher) -> u256 {
    cheat_caller_address(dispatcher.contract_address, USER1(), CheatSpan::TargetCalls(1));
    let funding_goal: u256 = 10000;
    let deadline = starknet::get_block_timestamp() + 10000;
    dispatcher.create_campaign(funding_goal, deadline)
}

/// TESTS

#[cfg(test)]
fn test_crowdfunding_creation_success() {
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);

    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };
    let mut spy = spy_events();
    cheat_caller_address(contract, USER1(), CheatSpan::TargetCalls(1));
    let funding_goal: u256 = 10000;
    let deadline = starknet::get_block_timestamp() + 2000;
    let campaign_id = dispatcher.create_campaign(funding_goal, deadline);
    assert(campaign_id == 1, 'CREATION FAILED');

    let creation_event = Crowdfunding::Event::CampaignCreated(
        CampaignCreated { id: campaign_id, creator: USER1(), funding_goal },
    );

    spy.assert_emitted(@array![(contract, creation_event)]);
}

#[cfg(test)]
fn test_crowdfunding_fund_success() {
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);

    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };
    let mut spy = spy_events();
    let campaign_id = init_default_campaign(dispatcher);

    // mint user2
    let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };
    token_dispatcher.mint(USER2(), 1000);

    cheat_caller_address(token_contract, USER2(), CheatSpan::TargetCalls(1));
    token_dispatcher.approve(contract, 1000);

    // for some moment in time before the deadline
    let timestamp = starknet::get_block_timestamp() + 200;
    cheat_caller_address(contract, USER2(), CheatSpan::TargetCalls(1));
    cheat_block_timestamp(contract, timestamp, CheatSpan::TargetCalls(1));
    dispatcher.fund(campaign_id, 500);

    let fund_event = Crowdfunding::Event::CampaignFunded(
        CampaignFunded { id: campaign_id, funder: USER2(), amount: 500 },
    );

    spy.assert_emitted(@array![(contract, fund_event)]);
}

#[cfg(test)]
fn test_crowdfunding_resolution_success() {
    // The contract should fund campaign creator on success
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);
    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };
    let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };

    // NOTE: The funding goal of the default campaign is 10000
    let fund_amount: u256 = 5000;
    let campaign_id = init_default_campaign(dispatcher);
    token_dispatcher.mint(USER2(), fund_amount);
    token_dispatcher.mint(USER3(), fund_amount);

    let mut spy = spy_events();

    // set allowance
    cheat_caller_address(token_contract, USER2(), CheatSpan::TargetCalls(1));
    token_dispatcher.approve(contract, fund_amount);
    cheat_caller_address(token_contract, USER3(), CheatSpan::TargetCalls(1));
    token_dispatcher.approve(contract, fund_amount);

    // assert creator's balance is zero
    assert(token_dispatcher.balance_of(USER1()) == 0, 'CREATOR BALANCE NOT ZERO');

    // fund campaign
    cheat_caller_address(contract, USER2(), CheatSpan::TargetCalls(1));
    dispatcher.fund(campaign_id, fund_amount);
    cheat_caller_address(contract, USER3(), CheatSpan::TargetCalls(1));
    dispatcher.fund(campaign_id, fund_amount);
    // conditions have been met, automatically funds creator

    assert(token_dispatcher.balance_of(USER1()) == 10000, 'CAMPAIGN FAILED');
    let successful_event = Crowdfunding::Event::CampaignResolved(
        CampaignResolved {
            id: campaign_id,
            creator: USER1(),
            funding_goal: 10000,
            status: CampaignStatus::Successful,
        },
    );

    spy.assert_emitted(@array![(contract, successful_event)]);
}

#[cfg(test)]
fn test_crowdfunding_resolution_failure() {
    // should refund funders automatically on failure.
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);

    let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };
    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };

    // NOTE: The funding goal of the default campaign is 10000
    let fund_amount: u256 = 2000;
    let campaign_id = init_default_campaign(dispatcher);
    token_dispatcher.mint(USER2(), fund_amount);
    token_dispatcher.mint(USER3(), fund_amount);

    let mut spy = spy_events();

    // set allowance
    cheat_caller_address(token_contract, USER2(), CheatSpan::TargetCalls(1));
    token_dispatcher.approve(contract, fund_amount);
    cheat_caller_address(token_contract, USER3(), CheatSpan::TargetCalls(1));
    token_dispatcher.approve(contract, fund_amount);

    // fund campaign
    cheat_caller_address(contract, USER2(), CheatSpan::TargetCalls(1));
    dispatcher.fund(campaign_id, fund_amount);
    cheat_caller_address(contract, USER3(), CheatSpan::TargetCalls(1));
    dispatcher.fund(campaign_id, fund_amount);

    // assert funder's balance is now zero
    assert(token_dispatcher.balance_of(USER2()) == 0, 'FUNDER BALANCE NOT ZERO');
    assert(token_dispatcher.balance_of(USER3()) == 0, 'FUNDER BALANCE NOT ZERO');

    // cheat the timestamp to make the campaign fail (say deadline + 1)
    cheat_block_timestamp(
        contract, starknet::get_block_timestamp() + 10001, CheatSpan::TargetCalls(1),
    );
    dispatcher.resolve_campaign(campaign_id);

    // funders should receive their initial balances on failure automatically
    assert(token_dispatcher.balance_of(USER2()) == fund_amount, 'RESOLUTION FAILED');
    assert(token_dispatcher.balance_of(USER3()) == fund_amount, 'RESOLUTION FAILED');

    let failure_event = Crowdfunding::Event::CampaignResolved(
        CampaignResolved {
            id: campaign_id, creator: USER1(), funding_goal: 10000, status: CampaignStatus::Failed,
        },
    );

    spy.assert_emitted(@array![(contract, failure_event)]);
}

#[cfg(test)]
fn test_crowdfunding_should_panic_on_campaign_not_active() {
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);
    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };
    let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };

    // NOTE: The funding goal of the default campaign is 10000
    let fund_amount: u256 = 5000;
    let campaign_id = init_default_campaign(dispatcher);
    token_dispatcher.mint(USER2(), fund_amount);
    token_dispatcher.mint(USER3(), fund_amount);

    // set allowance
    cheat_caller_address(token_contract, USER2(), CheatSpan::TargetCalls(1));
    token_dispatcher.approve(contract, fund_amount);
    cheat_caller_address(token_contract, USER3(), CheatSpan::TargetCalls(1));
    token_dispatcher.approve(contract, fund_amount);

    // assert creator's balance is zero
    assert(token_dispatcher.balance_of(USER1()) == 0, 'CREATOR BALANCE NOT ZERO');

    // fund campaign
    cheat_caller_address(contract, USER2(), CheatSpan::TargetCalls(1));
    dispatcher.fund(campaign_id, fund_amount);
    cheat_caller_address(contract, USER3(), CheatSpan::TargetCalls(1));
    dispatcher.fund(campaign_id, fund_amount);

    // campaign has already been resolved, so it can not be resolved again.
    dispatcher.resolve_campaign(campaign_id);
}

#[cfg(test)]
fn test_crowdfunding_should_panic_on_early_resolution() {
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);
    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };
    let campaign_id = init_default_campaign(dispatcher);
    dispatcher.resolve_campaign(campaign_id);
}

#[cfg(test)]
fn test_crowdfunding_should_panic_funding_on_exceeded_deadline() {
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);
    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };
    let campaign_id = init_default_campaign(dispatcher);

    cheat_caller_address(contract, USER2(), CheatSpan::TargetCalls(1));
    cheat_block_timestamp(
        contract, starknet::get_block_timestamp() + 10001, CheatSpan::TargetCalls(1),
    );
    dispatcher.fund(campaign_id, 300);
}

#[cfg(test)]
fn test_get_user_campaigns() {
    let token_contract = deploy_token();
    let contract = deploy_crowdfunding(token_contract);

    let dispatcher = ICrowdfundingDispatcher { contract_address: contract };

    // USER1 creates 2 campaigns
    cheat_caller_address(contract, USER1(), CheatSpan::TargetCalls(2));
    let _campaign_1 = dispatcher.create_campaign(5000, starknet::get_block_timestamp() + 2000);
    let _campaign_2 = dispatcher.create_campaign(10000, starknet::get_block_timestamp() + 4000);

    // Retrieve campaigns
    let user1_campaigns = dispatcher.get_user_campaigns(USER1());

    // Assertions
    assert(user1_campaigns.len() == 2, 'USER1: wrong count');
    assert(user1_campaigns == array![1, 2], 'USER1 campaigns not match IDs');
}

