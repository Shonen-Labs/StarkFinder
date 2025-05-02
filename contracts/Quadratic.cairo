#[starknet::contract]
mod quadratic_voting {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    #[storage]
    struct Storage {
        user_credits: Map<ContractAddress, u128>,
        votes: Map<ProposalVoteKey, u128>,
        proposals: Map<felt252, Proposal>,
        proposal_total_votes: Map<felt252, u128>,
        admin: ContractAddress,
        next_proposal_id: u128,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ProposalCreated: ProposalCreatedEvent,
        VoteCast: VoteCastEvent,
        CreditsAllocated: CreditsAllocatedEvent,
    }

    #[derive(Drop, starknet::Event)]
    struct ProposalCreatedEvent {
        proposal_id: felt252,
        proposer: ContractAddress,
        description: felt252,
        end_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteCastEvent {
        proposal_id: felt252,
        voter: ContractAddress,
        votes: u128,
        cost: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct CreditsAllocatedEvent {
        user: ContractAddress,
        amount: u128,
    }

    #[derive(Drop, Serde, starknet::Store)]
    struct Proposal {
        proposer: ContractAddress,
        description: felt252,
        end_time: u64,
    }

    #[derive(Copy, Drop, Hash, PartialEq, Eq, starknet::Store)]
    struct ProposalVoteKey {
        proposal_id: felt252,
        user: ContractAddress,
    }

    #[starknet::interface]
    trait IQuadraticVoting<TContractState> {
        fn create_proposal(ref self: TContractState, description: felt252, end_time: u64);
        fn vote(ref self: TContractState, proposal_id: felt252, votes: u128);
        fn allocate_credits(ref self: TContractState, user: ContractAddress, amount: u128);
        fn get_proposal(self: @TContractState, proposal_id: felt252) -> Proposal;
        fn get_user_credits(self: @TContractState, user: ContractAddress) -> u128;
        fn get_user_votes(self: @TContractState, proposal_id: felt252, user: ContractAddress) -> u128;
        fn get_total_votes(self: @TContractState, proposal_id: felt252) -> u128;
    }

    #[abi(embed_v0)]
    impl QuadraticVotingImpl of IQuadraticVoting<ContractState> {
        fn create_proposal(ref self: ContractState, description: felt252, end_time: u64) {
            let proposer = get_caller_address();
            let proposal_id = self.next_proposal_id.read();
            self.proposals.write(proposal_id.into(), Proposal { proposer, description, end_time });
            self.next_proposal_id.write(proposal_id + 1);
            self.emit(Event::ProposalCreated(ProposalCreatedEvent {
                proposal_id: proposal_id.into(),
                proposer,
                description,
                end_time,
            }));
        }

        fn vote(ref self: ContractState, proposal_id: felt252, votes: u128) {
            let caller = get_caller_address();
            let proposal = self.proposals.read(proposal_id);
            let current_time = get_block_timestamp();
            assert(current_time < proposal.end_time, 'Proposal voting has ended');

            let key = ProposalVoteKey { proposal_id, user: caller };
            let current_votes = self.votes.read(key);

            assert(votes > current_votes, 'New votes must be greater than current');

            let cost = votes * votes - current_votes * current_votes;

            let user_credits = self.user_credits.read(caller);
            assert(user_credits >= cost, 'Insufficient credits');

            self.user_credits.write(caller, user_credits - cost);

            self.votes.write(key, votes);

            let total_votes = self.proposal_total_votes.read(proposal_id);
            self.proposal_total_votes.write(proposal_id, total_votes + (votes - current_votes));

            self.emit(Event::VoteCast(VoteCastEvent { proposal_id, voter: caller, votes, cost }));
        }

        fn allocate_credits(ref self: ContractState, user: ContractAddress, amount: u128) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin can allocate credits');
            let current_credits = self.user_credits.read(user);
            self.user_credits.write(user, current_credits + amount);
            self.emit(Event::CreditsAllocated(CreditsAllocatedEvent { user, amount }));
        }

        fn get_proposal(self: @ContractState, proposal_id: felt252) -> Proposal {
            self.proposals.read(proposal_id)
        }

        fn get_user_credits(self: @ContractState, user: ContractAddress) -> u128 {
            self.user_credits.read(user)
        }

        fn get_user_votes(self: @ContractState, proposal_id: felt252, user: ContractAddress) -> u128 {
            let key = ProposalVoteKey { proposal_id, user };
            self.votes.read(key)
        }

        fn get_total_votes(self: @ContractState, proposal_id: felt252) -> u128 {
            self.proposal_total_votes.read(proposal_id)
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.next_proposal_id.write(0);
    }
}
