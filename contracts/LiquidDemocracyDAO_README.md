# Liquid Democracy DAO - Cairo Implementation

A comprehensive implementation of a Liquid Democracy DAO (Decentralized Autonomous Organization) on Starknet using Cairo.

## Overview

This Liquid Democracy DAO allows token holders to either vote directly on proposals or delegate their voting power to trusted representatives on a category-by-category basis. This creates a flexible governance system that combines the benefits of direct democracy with the efficiency of representative democracy.

## Features

### ✅ Implemented and Tested

1. **Token-based Voting System**
   - Mint voting tokens to participants
   - Token balance determines voting power
   - Owner-controlled token minting

2. **Category-specific Delegation**
   - Delegate voting power to other addresses for specific proposal categories
   - Revoke delegations at any time
   - Circular delegation protection
   - Multiple delegators can delegate to the same delegate

3. **Proposal Management**
   - Create proposals with title, description, and category
   - Configurable execution delays
   - Proposal threshold requirements
   - Track proposal status (active, executed)

4. **Voting Mechanism**
   - Vote yes/no on proposals
   - Voting power includes both direct tokens and delegated power
   - Prevent double voting
   - Vote weight tracking

5. **Proposal Execution**
   - Time-locked execution after voting period
   - Threshold-based execution (must meet minimum support)
   - Majority requirement (yes votes > no votes)

6. **Governance Controls**
   - Owner can set proposal thresholds
   - Owner can adjust execution delays
   - Access control for administrative functions

## Test Coverage

The implementation includes comprehensive tests covering:

- ✅ Contract deployment and initialization
- ✅ Token minting functionality
- ✅ Delegation creation and management
- ✅ Delegation revocation
- ✅ Proposal creation
- ✅ Voting on proposals
- ✅ Delegated voting power calculation
- ✅ Proposal execution with time locks
- ✅ Multiple delegations to same delegate
- ✅ Insufficient vote threshold handling

**Test Results: 10/10 tests passing** 🎉

## Architecture

### Core Components

1. **Storage Structure**
   - Token balances and total supply
   - Proposal storage with metadata
   - Delegation mappings by (delegator, delegate, category)
   - Vote records and execution timestamps

2. **Events**
   - ProposalCreated
   - VoteCast
   - DelegationCreated
   - DelegationRevoked
   - ProposalExecuted
   - TokensMinted

3. **Access Control**
   - Owner-only functions for token minting and configuration
   - Public functions for delegation and voting
   - Proper authorization checks

### Key Functions

#### Delegation Functions
- `delegate_vote(delegate, category, weight)` - Delegate voting power
- `revoke_delegation(delegate, category)` - Revoke delegation
- `get_delegation(delegator, delegate, category)` - Query delegation
- `get_voting_power(voter, proposal_id)` - Calculate total voting power

#### Proposal Functions
- `create_proposal(title, description, category, execution_delay)` - Create new proposal
- `vote_on_proposal(proposal_id, support)` - Cast vote
- `execute_proposal(proposal_id)` - Execute approved proposal
- `is_proposal_executable(proposal_id)` - Check execution eligibility

#### Administrative Functions
- `mint_voting_tokens(to, amount)` - Mint tokens (owner only)
- `set_proposal_threshold(threshold)` - Set voting threshold (owner only)
- `set_execution_delay(delay)` - Set default execution delay (owner only)

## Usage Example

```cairo
// Deploy the DAO with 100 token threshold and 1 hour execution delay
let dao = deploy_contract();

// Mint voting tokens to participants
dao.mint_voting_tokens(alice, 1000);
dao.mint_voting_tokens(bob, 500);

// Alice delegates 300 tokens to Bob for 'tech' category proposals
dao.delegate_vote(bob, 'tech', 300);

// Create a technical proposal
let proposal_id = dao.create_proposal('Upgrade Protocol', 'Technical upgrade', 'tech', 3600);

// Bob votes using his direct tokens + Alice's delegation (500 + 300 = 800 power)
dao.vote_on_proposal(proposal_id, true);

// After execution delay, execute the proposal
dao.execute_proposal(proposal_id);
```

## Security Features

- **Circular Delegation Protection**: Prevents A→B→A delegation cycles
- **Double Voting Prevention**: Each address can only vote once per proposal
- **Time-locked Execution**: Proposals have mandatory execution delays
- **Threshold Requirements**: Proposals must meet minimum support levels
- **Access Control**: Administrative functions restricted to contract owner

## Future Enhancements

1. **Advanced Delegation**
   - Transitive delegation (A→B→C chains)
   - Delegation weight limits
   - Delegation expiration times

2. **Enhanced Governance**
   - Quorum requirements
   - Voting periods with deadlines
   - Proposal amendments

3. **Integration Features**
   - Cross-contract proposal execution
   - Integration with other DeFi protocols
   - Multi-signature proposal creation

## Running Tests

```bash
cd contracts
scarb test
```

All tests should pass with comprehensive coverage of the liquid democracy functionality.

## Contract Addresses

- **Testnet**: TBD
- **Mainnet**: TBD

## License

MIT License - see LICENSE file for details. 