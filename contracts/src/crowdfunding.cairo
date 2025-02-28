use starknet::ContractAddress;
use starknet::storage::{Map, Vec};
// use alexandria_storage::{ListTrait, List};

#[starknet::interface]
pub trait ICrowdfunding<TContractState> {
    fn create_campaign(ref self: TContractState, funding_goal: u256, deadline: u64) -> u256;
    fn fund(ref self: TContractState, campaign_id: u256, amount: u256);
    fn resolve_campaign(ref self: TContractState, campaign_id: u256);
    fn get_campaign(self: @TContractState, campaign_id: u256) -> Campaign;
    fn get_contribution(
        self: @TContractState, campaign_id: u256, contributor: ContractAddress,
    ) -> u256;
    fn get_user_campaigns(self: @TContractState, user: ContractAddress) -> Array<u256>;
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct Campaign {
    pub id: u256,
    pub creator: ContractAddress,
    pub funding_goal: u256,
    pub deadline: u64,
    pub funds_raised: u256,
    pub status: CampaignStatus,
}

#[starknet::storage_node]
pub struct CampaignState {
    contributions: Map<ContractAddress, u256>,
    funds_raised: u256,
    contributors: Vec<ContractAddress>,
}

#[derive(Copy, Drop, Serde, starknet::Store, PartialEq, Debug)]
pub enum CampaignStatus {
    #[default]
    Active,
    Successful,
    Failed,
}

#[derive(Drop, starknet::Event)]
pub struct CampaignCreated {
    #[key]
    pub id: u256,
    pub creator: ContractAddress,
    pub funding_goal: u256,
}

#[derive(Drop, starknet::Event)]
pub struct CampaignResolved {
    #[key]
    pub id: u256,
    pub creator: ContractAddress,
    pub funding_goal: u256,
    pub status: CampaignStatus,
}

#[derive(Drop, starknet::Event)]
pub struct CampaignFunded {
    #[key]
    pub id: u256,
    pub funder: ContractAddress,
    pub amount: u256,
}

#[starknet::contract]
pub mod Crowdfunding {
    use core::num::traits::Zero;
    use core::starknet::{
        ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
    };
    use alexandria_storage::{ListTrait, List};
    use core::option::OptionTrait;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map,
        StorageMapWriteAccess, MutableVecTrait,
    };
    use starknet::storage::StorageMapReadAccess;
    use super::{
        CampaignStatus, CampaignState, Campaign, CampaignCreated, CampaignResolved, CampaignFunded,
    };
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        campaigns: Map<u256, Option<Campaign>>,
        campaign_state: Map<u256, CampaignState>,
        user_campaigns: Map<ContractAddress, List<u256>>,
        nonce: u256,
        token_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CampaignCreated: CampaignCreated,
        CampaignResolved: CampaignResolved,
        CampaignFunded: CampaignFunded,
    }

    #[constructor]
    fn constructor(ref self: ContractState, token_address: ContractAddress) {
        self.token_address.write(token_address);
    }

    #[abi(embed_v0)]
    impl Crowdfunding of super::ICrowdfunding<ContractState> {
        fn create_campaign(ref self: ContractState, funding_goal: u256, deadline: u64) -> u256 {
            let creator = get_caller_address();
            assert(creator.is_non_zero(), 'ZERO CALLER ADDRESS');
            let current_timestamp = get_block_timestamp();
            let id = self.nonce.read() + 1;
            assert(deadline > current_timestamp, 'INVALID DEADLINE');
            assert(funding_goal > 0, 'FUNDING GOAL IS ZERO');

            let new_campaign = Campaign {
                id,
                creator,
                funding_goal,
                deadline,
                funds_raised: 0,
                status: CampaignStatus::Active,
            };
            self.campaigns.entry(id).write(Option::Some(new_campaign));
            self.nonce.write(id);

            let mut user_campaigns = self.user_campaigns.entry(creator).read();
            let result = user_campaigns.append(id);
            assert(result.is_ok(), 'Failed to append campaign ID');
            self.user_campaigns.entry(creator).write(user_campaigns);

            self.emit(CampaignCreated { id, creator, funding_goal });

            id
        }

        fn fund(ref self: ContractState, campaign_id: u256, amount: u256) {
            let caller = get_caller_address();
            let current_timestamp = get_block_timestamp();

            let mut campaign = self._get_campaign(campaign_id);
            assert(caller.is_non_zero(), 'ZERO CALLER ADDRESS');
            assert(campaign.status == CampaignStatus::Active, 'CAMPAIGN NOT ACTIVE');
            assert(current_timestamp <= campaign.deadline, 'DEADLINE EXCEEDED');
            assert(amount > 0, 'AMOUNT IS ZERO');
            assert(caller != campaign.creator, 'SELF FUND ERROR');

            let token_contract = self.token_address.read();
            let dispatcher = IERC20Dispatcher { contract_address: token_contract };
            assert(dispatcher.balance_of(caller) >= amount, 'INSUFFICIENT FUNDS');
            dispatcher.transfer_from(caller, get_contract_address(), amount);

            campaign.funds_raised += amount;
            let funds_raised = self.campaign_state.entry(campaign_id).funds_raised.read();
            self.campaign_state.entry(campaign_id).funds_raised.write(funds_raised + amount);

            let previous_contribution = self
                .campaign_state
                .entry(campaign_id)
                .contributions
                .entry(caller)
                .read();
            self
                .campaign_state
                .entry(campaign_id)
                .contributions
                .entry(caller)
                .write(previous_contribution + amount);

            if previous_contribution == 0 {
                // then the caller has not funded before, add the caller to the list of funders
                self.campaign_state.entry(campaign_id).contributors.append().write(caller);
            }

            self.emit(CampaignFunded { id: campaign_id, funder: caller, amount });

            // update the state

            if campaign.funds_raised >= campaign.funding_goal {
                // distribute funds to the creator and mark immediately as successful
                self._resolve_campaign(ref campaign, dispatcher, true);
            }

            self.campaigns.entry(campaign_id).write(Option::Some(campaign));
        }

        fn resolve_campaign(ref self: ContractState, campaign_id: u256) {
            let current_timestamp = get_block_timestamp();

            let mut campaign = self._get_campaign(campaign_id);
            assert(campaign.status == CampaignStatus::Active, 'CAMPAIGN NOT ACTIVE');
            assert(current_timestamp > campaign.deadline, 'CAMPAIGN CAN NOT BE RESOLVED');

            let token_contract = self.token_address.read();
            let dispatcher = IERC20Dispatcher { contract_address: token_contract };

            if campaign.funds_raised >= campaign.funding_goal {
                self._resolve_campaign(ref campaign, dispatcher, true);
            } else {
                self._resolve_campaign(ref campaign, dispatcher, false);
            }

            self.campaigns.write(campaign_id, Option::Some(campaign));
        }

        fn get_campaign(self: @ContractState, campaign_id: u256) -> Campaign {
            self._get_campaign(campaign_id)
        }

        fn get_contribution(
            self: @ContractState, campaign_id: u256, contributor: ContractAddress,
        ) -> u256 {
            let campaign_state = self.campaign_state.entry(campaign_id);
            campaign_state.contributions.entry(contributor).read()
        }

        fn get_user_campaigns(self: @ContractState, user: ContractAddress) -> Array<u256> {
            let mut user_campaigns = self.user_campaigns.read(user);

            let mut campaign_ids = ArrayTrait::new();

            let mut i: u32 = 0;

            loop {
                if i >= user_campaigns.len() {
                    break;
                }

                let campaign_id = user_campaigns[i];
                campaign_ids.append(campaign_id);

                i += 1;
            };

            campaign_ids
        }
    }

    #[generate_trait]
    impl ImternalImpl of InternalTrait {
        fn _get_campaign(self: @ContractState, campaign_id: u256) -> Campaign {
            let opt_campaign = self.campaigns.entry(campaign_id).read();
            assert!(opt_campaign.is_some(), "Campaign with id does not exist.");
            opt_campaign.unwrap()
        }

        fn _resolve_campaign(
            ref self: ContractState,
            ref campaign: Campaign,
            dispatcher: IERC20Dispatcher,
            value: bool,
        ) {
            let mut total_funds = self.campaign_state.entry(campaign.id).funds_raised.read();
            assert(total_funds != 0, 'ZERO FUNDS');
            if value {
                // dispatcher.allowance(get_contract_address(), get_contract_address());
                dispatcher.transfer(campaign.creator, total_funds);
                campaign.status = CampaignStatus::Successful;
                self.campaign_state.entry(campaign.id).funds_raised.write(0);
            } else {
                // distribute all funds back to the funders
                campaign.status = CampaignStatus::Failed;
                let funders = self.campaign_state.entry(campaign.id).contributors;
                for i in 0..funders.len() {
                    let funder = funders.at(i).read();
                    let amount = self
                        .campaign_state
                        .entry(campaign.id)
                        .contributions
                        .entry(funder)
                        .read();
                    dispatcher.transfer(funder, amount);
                    total_funds -= amount;
                };

                assert(total_funds == 0, 'FUNDS NOT ZERO');
            }
            self.campaign_state.entry(campaign.id).funds_raised.write(0);

            self
                .emit(
                    CampaignResolved {
                        id: campaign.id,
                        creator: campaign.creator,
                        funding_goal: campaign.funding_goal,
                        status: campaign.status,
                    },
                );
        }
    }
}

