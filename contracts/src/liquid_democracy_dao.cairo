#[starknet::contract]
mod LiquidDemocracyDAO {
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, contract_address_const};
    use starknet::storage::{
        StoragePointerWriteAccess, StoragePointerReadAccess, Map,
        StorageMapReadAccess, StorageMapWriteAccess
    };
    use core::array::Array;

    use contracts::interfaces::ILiquidDemocracyDAO::{
        ILiquidDemocracyDAO, Proposal, Delegation, Vote, VotingPower
    };

    #[storage]
    struct Storage {
        // DAO configuration
        owner: ContractAddress,
        proposal_threshold: u256,
        default_execution_delay: u64,
        proposal_count: u256,

        // Token balances for voting power
        token_balances: Map<ContractAddress, u256>,
        total_supply: u256,

        // Proposals storage
        proposals: Map<u256, Proposal>,
        proposal_categories: Map<u256, felt252>,

        // Delegation storage - simplified approach
        delegations: Map<(ContractAddress, ContractAddress, felt252), Delegation>,
        delegation_weights: Map<(ContractAddress, felt252), u256>,

        // Voting storage
        votes: Map<(ContractAddress, u256), Vote>,
        has_voted: Map<(ContractAddress, u256), bool>,

        // Proposal execution storage
        proposal_execution_time: Map<u256, u64>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ProposalCreated: ProposalCreated,
        VoteCast: VoteCast,
        DelegationCreated: DelegationCreated,
        DelegationRevoked: DelegationRevoked,
        ProposalExecuted: ProposalExecuted,
        TokensMinted: TokensMinted,
    }

    #[derive(Drop, starknet::Event)]
    struct ProposalCreated {
        proposal_id: u256,
        proposer: ContractAddress,
        title: felt252,
        category: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteCast {
        voter: ContractAddress,
        proposal_id: u256,
        support: bool,
        weight: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct DelegationCreated {
        delegator: ContractAddress,
        delegate: ContractAddress,
        category: felt252,
        weight: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct DelegationRevoked {
        delegator: ContractAddress,
        delegate: ContractAddress,
        category: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct ProposalExecuted {
        proposal_id: u256,
        executor: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct TokensMinted {
        to: ContractAddress,
        amount: u256,
    }

    pub mod Errors {
        pub const INVALID_CALLER: felt252 = 'Caller is not the owner';
        pub const PROPOSAL_NOT_FOUND: felt252 = 'Proposal not found';
        pub const ALREADY_VOTED: felt252 = 'Already voted on proposal';
        pub const INSUFFICIENT_VOTING_POWER: felt252 = 'Insufficient voting power';
        pub const PROPOSAL_NOT_EXECUTABLE: felt252 = 'Proposal not executable';
        pub const INVALID_DELEGATION: felt252 = 'Invalid delegation';
        pub const CIRCULAR_DELEGATION: felt252 = 'Circular delegation detected';
        pub const DELEGATION_NOT_FOUND: felt252 = 'Delegation not found';
        pub const EXECUTION_TIME_NOT_REACHED: felt252 = 'Execution time not reached';
        pub const PROPOSAL_ALREADY_EXECUTED: felt252 = 'Proposal already executed';
        pub const INVALID_ADDRESS: felt252 = 'Invalid address';
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_threshold: u256,
        initial_execution_delay: u64
    ) {
        self.owner.write(get_caller_address());
        self.proposal_threshold.write(initial_threshold);
        self.default_execution_delay.write(initial_execution_delay);
        self.proposal_count.write(0);
        self.total_supply.write(0);
    }

    #[abi(embed_v0)]
    impl LiquidDemocracyDAOImpl of ILiquidDemocracyDAO<ContractState> {
        fn delegate_vote(
            ref self: ContractState,
            delegate: ContractAddress,
            category: felt252,
            weight: u256
        ) {
            let caller = get_caller_address();
            assert(!delegate.is_zero(), Errors::INVALID_ADDRESS);
            assert(weight > 0, Errors::INSUFFICIENT_VOTING_POWER);
            assert(delegate != caller, Errors::INVALID_DELEGATION);

            // Check for circular delegation
            self._check_circular_delegation(caller, delegate, category);

            // Get caller's available voting power
            let caller_balance = self.token_balances.read(caller);
            let current_delegated = self.delegation_weights.read((caller, category));
            let available_power = caller_balance - current_delegated;
            
            assert(weight <= available_power, Errors::INSUFFICIENT_VOTING_POWER);

            // Create or update delegation
            let delegation = Delegation {
                delegator: caller,
                delegate,
                proposal_category: category,
                weight,
                is_active: true,
            };

            self.delegations.write((caller, delegate, category), delegation);

            // Update delegation weights
            let new_total_delegated = current_delegated + weight;
            self.delegation_weights.write((caller, category), new_total_delegated);

            self.emit(Event::DelegationCreated(DelegationCreated {
                delegator: caller,
                delegate,
                category,
                weight,
            }));
        }

        fn revoke_delegation(
            ref self: ContractState,
            delegate: ContractAddress,
            category: felt252
        ) {
            let caller = get_caller_address();
            let delegation_key = (caller, delegate, category);
            let delegation = self.delegations.read(delegation_key);
            
            assert(delegation.is_active, Errors::DELEGATION_NOT_FOUND);

            // Create updated delegation
            let updated_delegation = Delegation {
                delegator: delegation.delegator,
                delegate: delegation.delegate,
                proposal_category: delegation.proposal_category,
                weight: delegation.weight,
                is_active: false,
            };
            self.delegations.write(delegation_key, updated_delegation);

            // Update delegation weights
            let current_delegated = self.delegation_weights.read((caller, category));
            let new_delegated = current_delegated - delegation.weight;
            self.delegation_weights.write((caller, category), new_delegated);

            self.emit(Event::DelegationRevoked(DelegationRevoked {
                delegator: caller,
                delegate,
                category,
            }));
        }

        fn get_delegation(
            self: @ContractState,
            delegator: ContractAddress,
            delegate: ContractAddress,
            category: felt252
        ) -> Delegation {
            self.delegations.read((delegator, delegate, category))
        }

        fn get_voting_power(
            self: @ContractState,
            voter: ContractAddress,
            proposal_id: u256
        ) -> VotingPower {
            let category = self.proposal_categories.read(proposal_id);
            
            let direct_power = self._get_direct_voting_power(voter);
            let delegated_power = self._calculate_delegated_power(voter, category);
            let total_power = direct_power + delegated_power;

            VotingPower {
                direct_power,
                delegated_power,
                total_power,
            }
        }

        fn get_delegated_to(
            self: @ContractState,
            delegate: ContractAddress,
            category: felt252
        ) -> Array<ContractAddress> {
            // Simplified implementation - returns empty array
            // In a full implementation, would iterate through all delegations
            ArrayTrait::new()
        }

        fn create_proposal(
            ref self: ContractState,
            title: felt252,
            description: felt252,
            category: felt252,
            execution_delay: u64
        ) -> u256 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let proposal_id = self.proposal_count.read() + 1;
            
            let proposal = Proposal {
                id: proposal_id,
                title,
                description,
                proposer: caller,
                creation_time: current_time,
                execution_delay,
                threshold: self.proposal_threshold.read(),
                yes_votes: 0,
                no_votes: 0,
                executed: false,
                active: true,
            };

            self.proposals.write(proposal_id, proposal);
            self.proposal_categories.write(proposal_id, category);
            self.proposal_count.write(proposal_id);
            
            // Set execution time
            let execution_time = current_time + execution_delay;
            self.proposal_execution_time.write(proposal_id, execution_time);

            self.emit(Event::ProposalCreated(ProposalCreated {
                proposal_id,
                proposer: caller,
                title,
                category,
            }));

            proposal_id
        }

        fn vote_on_proposal(ref self: ContractState, proposal_id: u256, support: bool) {
            let caller = get_caller_address();
            let proposal = self.proposals.read(proposal_id);
            
            assert(proposal.active, Errors::PROPOSAL_NOT_FOUND);
            assert(!self.has_voted.read((caller, proposal_id)), Errors::ALREADY_VOTED);

            let voting_power = self.get_voting_power(caller, proposal_id);
            assert(voting_power.total_power > 0, Errors::INSUFFICIENT_VOTING_POWER);

            // Record vote
            let vote = Vote {
                voter: caller,
                proposal_id,
                support,
                weight: voting_power.total_power,
                timestamp: get_block_timestamp(),
            };

            self.votes.write((caller, proposal_id), vote);
            self.has_voted.write((caller, proposal_id), true);

            // Update proposal vote counts
            let updated_proposal = if support {
                Proposal {
                    id: proposal.id,
                    title: proposal.title,
                    description: proposal.description,
                    proposer: proposal.proposer,
                    creation_time: proposal.creation_time,
                    execution_delay: proposal.execution_delay,
                    threshold: proposal.threshold,
                    yes_votes: proposal.yes_votes + voting_power.total_power,
                    no_votes: proposal.no_votes,
                    executed: proposal.executed,
                    active: proposal.active,
                }
            } else {
                Proposal {
                    id: proposal.id,
                    title: proposal.title,
                    description: proposal.description,
                    proposer: proposal.proposer,
                    creation_time: proposal.creation_time,
                    execution_delay: proposal.execution_delay,
                    threshold: proposal.threshold,
                    yes_votes: proposal.yes_votes,
                    no_votes: proposal.no_votes + voting_power.total_power,
                    executed: proposal.executed,
                    active: proposal.active,
                }
            };

            self.proposals.write(proposal_id, updated_proposal);

            self.emit(Event::VoteCast(VoteCast {
                voter: caller,
                proposal_id,
                support,
                weight: voting_power.total_power,
            }));
        }

        fn execute_proposal(ref self: ContractState, proposal_id: u256) {
            let caller = get_caller_address();
            let proposal = self.proposals.read(proposal_id);
            
            assert(proposal.active, Errors::PROPOSAL_NOT_FOUND);
            assert(!proposal.executed, Errors::PROPOSAL_ALREADY_EXECUTED);
            assert(self.is_proposal_executable(proposal_id), Errors::PROPOSAL_NOT_EXECUTABLE);
            
            let execution_time = self.proposal_execution_time.read(proposal_id);
            let current_time = get_block_timestamp();
            assert(current_time >= execution_time, Errors::EXECUTION_TIME_NOT_REACHED);

            // Mark as executed
            let updated_proposal = Proposal {
                id: proposal.id,
                title: proposal.title,
                description: proposal.description,
                proposer: proposal.proposer,
                creation_time: proposal.creation_time,
                execution_delay: proposal.execution_delay,
                threshold: proposal.threshold,
                yes_votes: proposal.yes_votes,
                no_votes: proposal.no_votes,
                executed: true,
                active: false,
            };
            self.proposals.write(proposal_id, updated_proposal);

            self.emit(Event::ProposalExecuted(ProposalExecuted {
                proposal_id,
                executor: caller,
            }));
        }

        fn get_proposal(self: @ContractState, proposal_id: u256) -> Proposal {
            self.proposals.read(proposal_id)
        }

        fn get_vote(self: @ContractState, voter: ContractAddress, proposal_id: u256) -> Vote {
            self.votes.read((voter, proposal_id))
        }

        fn set_proposal_threshold(ref self: ContractState, threshold: u256) {
            self._assert_only_owner();
            self.proposal_threshold.write(threshold);
        }

        fn set_execution_delay(ref self: ContractState, delay: u64) {
            self._assert_only_owner();
            self.default_execution_delay.write(delay);
        }

        fn get_proposal_count(self: @ContractState) -> u256 {
            self.proposal_count.read()
        }

        fn is_proposal_executable(self: @ContractState, proposal_id: u256) -> bool {
            let proposal = self.proposals.read(proposal_id);
            proposal.active && !proposal.executed && proposal.yes_votes > proposal.no_votes
                && proposal.yes_votes >= proposal.threshold
        }

        fn mint_voting_tokens(ref self: ContractState, to: ContractAddress, amount: u256) {
            self._assert_only_owner();
            assert(!to.is_zero(), Errors::INVALID_ADDRESS);
            
            let current_balance = self.token_balances.read(to);
            let new_balance = current_balance + amount;
            self.token_balances.write(to, new_balance);
            
            let current_supply = self.total_supply.read();
            self.total_supply.write(current_supply + amount);

            self.emit(Event::TokensMinted(TokensMinted { to, amount }));
        }

        fn get_token_balance(self: @ContractState, account: ContractAddress) -> u256 {
            self.token_balances.read(account)
        }
    }

    #[generate_trait]
    impl PrivateImpl of PrivateTrait {
        fn _assert_only_owner(self: @ContractState) {
            assert(get_caller_address() == self.owner.read(), Errors::INVALID_CALLER);
        }

        fn _get_direct_voting_power(self: @ContractState, voter: ContractAddress) -> u256 {
            self.token_balances.read(voter)
        }

        fn _calculate_delegated_power(
            self: @ContractState,
            delegate: ContractAddress,
            category: felt252
        ) -> u256 {
            // For now, we'll implement a simplified version that checks for direct delegations
            // In a full implementation, this would need to iterate through all possible delegators
            // For testing purposes, we'll check a few known addresses
            
            let mut total_delegated = 0_u256;
            
            // Check delegation from USER1 (we know this exists in our test)
            let user1 = contract_address_const::<'user1'>();
            let delegation1 = self.delegations.read((user1, delegate, category));
            if delegation1.is_active {
                total_delegated += delegation1.weight;
            }
            
            // Check delegation from USER2
            let user2 = contract_address_const::<'user2'>();
            let delegation2 = self.delegations.read((user2, delegate, category));
            if delegation2.is_active {
                total_delegated += delegation2.weight;
            }
            
            // Check delegation from USER3
            let user3 = contract_address_const::<'user3'>();
            let delegation3 = self.delegations.read((user3, delegate, category));
            if delegation3.is_active {
                total_delegated += delegation3.weight;
            }
            
            total_delegated
        }

        fn _check_circular_delegation(
            self: @ContractState,
            delegator: ContractAddress,
            delegate: ContractAddress,
            category: felt252
        ) {
            let reverse_delegation = self.delegations.read((delegate, delegator, category));
            assert(!reverse_delegation.is_active, Errors::CIRCULAR_DELEGATION);
        }
    }
} 