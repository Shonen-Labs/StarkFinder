use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address, start_cheat_block_timestamp, stop_cheat_block_timestamp};
use starknet::{ContractAddress, contract_address_const};
use contracts::interfaces::ILiquidDemocracyDAO::{ILiquidDemocracyDAODispatcher, ILiquidDemocracyDAODispatcherTrait};

fn OWNER() -> ContractAddress {
    contract_address_const::<'owner'>()
}

fn USER1() -> ContractAddress {
    contract_address_const::<'user1'>()
}

fn USER2() -> ContractAddress {
    contract_address_const::<'user2'>()
}

fn USER3() -> ContractAddress {
    contract_address_const::<'user3'>()
}

fn deploy_contract() -> ILiquidDemocracyDAODispatcher {
    let contract = declare("LiquidDemocracyDAO").unwrap().contract_class();
    let mut constructor_calldata = array![];
    constructor_calldata.append(100); // u256 low
    constructor_calldata.append(0);   // u256 high
    constructor_calldata.append(3600); // u64 execution_delay
    
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    ILiquidDemocracyDAODispatcher { contract_address }
}

#[test]
fn test_contract_deployment() {
    let dao = deploy_contract();
    let proposal_count = dao.get_proposal_count();
    assert(proposal_count == 0, 'Initial count = 0');
}

#[test]
fn test_mint_voting_tokens() {
    let dao = deploy_contract();
    
    // Since the deployer is the owner, we need to find out who that is
    // Let's try direct minting without cheat_caller_address first
    dao.mint_voting_tokens(USER1(), 1000);
    dao.mint_voting_tokens(USER2(), 500);
    
    let balance1 = dao.get_token_balance(USER1());
    let balance2 = dao.get_token_balance(USER2());
    
    assert(balance1 == 1000, 'USER1 has 1000');
    assert(balance2 == 500, 'USER2 has 500');
}

#[test]
fn test_delegation() {
    let dao = deploy_contract();
    
    // Setup: Mint tokens to users
    dao.mint_voting_tokens(USER1(), 1000);
    dao.mint_voting_tokens(USER2(), 500);
    
    // USER1 delegates 300 tokens to USER2 for 'tech' category
    start_cheat_caller_address(dao.contract_address, USER1());
    dao.delegate_vote(USER2(), 'tech', 300);
    stop_cheat_caller_address(dao.contract_address);
    
    // Check delegation was created
    let delegation = dao.get_delegation(USER1(), USER2(), 'tech');
    assert(delegation.delegator == USER1(), 'Delegator = USER1');
    assert(delegation.delegate == USER2(), 'Delegate = USER2');
    assert(delegation.weight == 300, 'Weight = 300');
    assert(delegation.is_active == true, 'Delegation active');
}

#[test]
fn test_revoke_delegation() {
    let dao = deploy_contract();
    
    // Setup: Mint tokens and create delegation
    dao.mint_voting_tokens(USER1(), 1000);
    
    start_cheat_caller_address(dao.contract_address, USER1());
    dao.delegate_vote(USER2(), 'tech', 300);
    
    // Revoke delegation
    dao.revoke_delegation(USER2(), 'tech');
    stop_cheat_caller_address(dao.contract_address);
    
    // Check delegation was revoked
    let delegation = dao.get_delegation(USER1(), USER2(), 'tech');
    assert(delegation.is_active == false, 'Delegation inactive');
}

#[test]
fn test_create_proposal() {
    let dao = deploy_contract();
    
    // Setup: Mint tokens to proposer
    dao.mint_voting_tokens(USER1(), 1000);
    
    // Create proposal
    start_cheat_caller_address(dao.contract_address, USER1());
    let proposal_id = dao.create_proposal('Test Proposal', 'Test Description', 'tech', 3600);
    stop_cheat_caller_address(dao.contract_address);
    
    // Check proposal was created
    let proposal = dao.get_proposal(proposal_id);
    assert(proposal.id == proposal_id, 'Proposal ID match');
    assert(proposal.title == 'Test Proposal', 'Title match');
    assert(proposal.proposer == USER1(), 'Proposer match');
    assert(proposal.active == true, 'Proposal active');
    assert(proposal.executed == false, 'Not executed');
    
    let count = dao.get_proposal_count();
    assert(count == 1, 'Count = 1');
}

#[test]
fn test_vote_on_proposal() {
    let dao = deploy_contract();
    
    // Setup: Mint tokens and create proposal
    dao.mint_voting_tokens(USER1(), 1000);
    dao.mint_voting_tokens(USER2(), 500);
    
    start_cheat_caller_address(dao.contract_address, USER1());
    let proposal_id = dao.create_proposal('Test Proposal', 'Test Description', 'tech', 3600);
    stop_cheat_caller_address(dao.contract_address);
    
    // Vote on proposal
    start_cheat_caller_address(dao.contract_address, USER2());
    dao.vote_on_proposal(proposal_id, true); // Vote yes
    stop_cheat_caller_address(dao.contract_address);
    
    // Check vote was recorded
    let vote = dao.get_vote(USER2(), proposal_id);
    assert(vote.voter == USER2(), 'Voter match');
    assert(vote.proposal_id == proposal_id, 'Proposal match');
    assert(vote.support == true, 'Support = true');
    assert(vote.weight == 500, 'Weight = 500');
    
    // Check proposal votes were updated
    let proposal = dao.get_proposal(proposal_id);
    assert(proposal.yes_votes == 500, 'Yes votes = 500');
    assert(proposal.no_votes == 0, 'No votes = 0');
}

#[test]
fn test_delegation_voting_power() {
    let dao = deploy_contract();
    
    // Setup: Mint tokens
    dao.mint_voting_tokens(USER1(), 1000);
    dao.mint_voting_tokens(USER2(), 500);
    dao.mint_voting_tokens(USER3(), 300);
    
    // Create delegation: USER1 delegates to USER2
    start_cheat_caller_address(dao.contract_address, USER1());
    dao.delegate_vote(USER2(), 'tech', 400);
    stop_cheat_caller_address(dao.contract_address);
    
    // Create proposal
    start_cheat_caller_address(dao.contract_address, USER3());
    let proposal_id = dao.create_proposal('Test Proposal', 'Test Description', 'tech', 3600);
    stop_cheat_caller_address(dao.contract_address);
    
    // Check voting power
    let user2_power = dao.get_voting_power(USER2(), proposal_id);
    // USER2 has 500 direct + 400 delegated = 900 total for tech category
    assert(user2_power.direct_power == 500, 'Direct = 500');
    assert(user2_power.delegated_power == 400, 'Delegated = 400');
    assert(user2_power.total_power == 900, 'Total = 900');
}

#[test]
fn test_proposal_execution() {
    let dao = deploy_contract();
    
    // Setup with block timestamp
    start_cheat_block_timestamp(dao.contract_address, 1000);
    
    // Setup: Mint tokens
    dao.mint_voting_tokens(USER1(), 1000);
    dao.mint_voting_tokens(USER2(), 500);
    
    // Create proposal with 1 hour delay
    start_cheat_caller_address(dao.contract_address, USER1());
    let proposal_id = dao.create_proposal('Test Proposal', 'Test Description', 'tech', 3600);
    stop_cheat_caller_address(dao.contract_address);
    
    // Vote with enough support
    start_cheat_caller_address(dao.contract_address, USER1());
    dao.vote_on_proposal(proposal_id, true);
    stop_cheat_caller_address(dao.contract_address);
    
    start_cheat_caller_address(dao.contract_address, USER2());
    dao.vote_on_proposal(proposal_id, true);
    stop_cheat_caller_address(dao.contract_address);
    
    // Fast forward time past execution delay
    start_cheat_block_timestamp(dao.contract_address, 1000 + 3600 + 1);
    
    // Check if proposal is executable
    let is_executable = dao.is_proposal_executable(proposal_id);
    assert(is_executable == true, 'Proposal executable');
    
    // Execute proposal
    start_cheat_caller_address(dao.contract_address, USER1());
    dao.execute_proposal(proposal_id);
    stop_cheat_caller_address(dao.contract_address);
    
    // Check proposal was executed
    let proposal = dao.get_proposal(proposal_id);
    assert(proposal.executed == true, 'Proposal executed');
    
    stop_cheat_block_timestamp(dao.contract_address);
}

#[test]
fn test_proposal_not_executable_insufficient_votes() {
    let dao = deploy_contract();
    
    // Setup: Mint tokens
    dao.mint_voting_tokens(USER1(), 50); // Less than threshold of 100
    
    // Create proposal
    start_cheat_caller_address(dao.contract_address, USER1());
    let proposal_id = dao.create_proposal('Test Proposal', 'Test Description', 'tech', 3600);
    stop_cheat_caller_address(dao.contract_address);
    
    // Vote with insufficient support
    start_cheat_caller_address(dao.contract_address, USER1());
    dao.vote_on_proposal(proposal_id, true);
    stop_cheat_caller_address(dao.contract_address);
    
    // Check proposal is not executable
    let is_executable = dao.is_proposal_executable(proposal_id);
    assert(is_executable == false, 'Should not be executable');
}

#[test]
fn test_multiple_delegations_same_category() {
    let dao = deploy_contract();
    
    // Setup: Mint tokens
    dao.mint_voting_tokens(USER1(), 1000);
    dao.mint_voting_tokens(USER2(), 500);
    dao.mint_voting_tokens(USER3(), 300);
    
    // USER1 delegates to USER2, then USER3 also delegates to USER2
    start_cheat_caller_address(dao.contract_address, USER1());
    dao.delegate_vote(USER2(), 'tech', 400);
    stop_cheat_caller_address(dao.contract_address);
    
    start_cheat_caller_address(dao.contract_address, USER3());
    dao.delegate_vote(USER2(), 'tech', 200);
    stop_cheat_caller_address(dao.contract_address);
    
    // Create proposal
    start_cheat_caller_address(dao.contract_address, USER1());
    let proposal_id = dao.create_proposal('Test Proposal', 'Test Description', 'tech', 3600);
    stop_cheat_caller_address(dao.contract_address);
    
    // Check USER2's voting power includes both delegations
    let user2_power = dao.get_voting_power(USER2(), proposal_id);
    assert(user2_power.direct_power == 500, 'Direct = 500');
    assert(user2_power.delegated_power == 600, 'Delegated = 600'); // 400 + 200
    assert(user2_power.total_power == 1100, 'Total = 1100');
} 