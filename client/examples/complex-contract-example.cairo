// Example complex Cairo contract that demonstrates the enhanced scarb.toml generation
use starknet::{ContractAddress, ClassHash, get_caller_address, get_contract_address};
use openzeppelin::token::erc721::{ERC721Component, IERC721};
use openzeppelin::access::ownable::{OwnableComponent, IOwnable};
use openzeppelin::security::pausable::{PausableComponent, IPausable};
use openzeppelin::security::reentrancyguard::ReentrancyGuardComponent;
use openzeppelin::upgrades::upgradeable::UpgradeableComponent;
use alexandria_math::{pow, sqrt, fast_power};
use alexandria_storage::list::{List, ListTrait};
use alexandria_data_structures::array_ext::{ArrayTraitExt, SpanTraitExt};

#[starknet::contract]
mod AdvancedNFTMarketplace {
    use super::{
        ContractAddress, ClassHash, get_caller_address, get_contract_address,
        ERC721Component, IERC721, OwnableComponent, IOwnable,
        PausableComponent, IPausable, ReentrancyGuardComponent,
        UpgradeableComponent, pow, sqrt, List, ListTrait,
        ArrayTraitExt, SpanTraitExt
    };

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // ERC721 Mixin
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Pausable Mixin
    #[abi(embed_v0)]
    impl PausableMixinImpl = PausableComponent::PausableMixinImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // ReentrancyGuard Mixin
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    // Upgradeable Mixin
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        // Custom storage
        marketplace_fee: u256,
        listed_tokens: List<u256>,
        token_prices: LegacyMap<u256, u256>,
        royalty_recipients: LegacyMap<u256, ContractAddress>,
        royalty_percentages: LegacyMap<u256, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        TokenListed: TokenListed,
        TokenSold: TokenSold,
        RoyaltySet: RoyaltySet,
    }

    #[derive(Drop, starknet::Event)]
    struct TokenListed {
        #[key]
        token_id: u256,
        #[key]
        seller: ContractAddress,
        price: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct TokenSold {
        #[key]
        token_id: u256,
        #[key]
        seller: ContractAddress,
        #[key]
        buyer: ContractAddress,
        price: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct RoyaltySet {
        #[key]
        token_id: u256,
        recipient: ContractAddress,
        percentage: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        base_uri: ByteArray,
        owner: ContractAddress,
        marketplace_fee: u256
    ) {
        self.erc721.initializer(name, symbol, base_uri);
        self.ownable.initializer(owner);
        self.marketplace_fee.write(marketplace_fee);
    }

    #[abi(embed_v0)]
    impl AdvancedNFTMarketplaceImpl of IAdvancedNFTMarketplace<ContractState> {
        fn mint_nft(ref self: ContractState, to: ContractAddress, token_id: u256, token_uri: ByteArray) {
            self.ownable.assert_only_owner();
            self.pausable.assert_not_paused();
            self.erc721.mint(to, token_id);
            self.erc721.set_token_uri(token_id, token_uri);
        }

        fn list_token(ref self: ContractState, token_id: u256, price: u256) {
            self.pausable.assert_not_paused();
            let caller = get_caller_address();
            assert(self.erc721.owner_of(token_id) == caller, 'Not token owner');
            assert(price > 0, 'Price must be positive');

            self.token_prices.write(token_id, price);
            self.listed_tokens.append(token_id);

            self.emit(TokenListed { token_id, seller: caller, price });
        }

        fn buy_token(ref self: ContractState, token_id: u256) {
            self.pausable.assert_not_paused();
            self.reentrancy_guard.start();

            let buyer = get_caller_address();
            let seller = self.erc721.owner_of(token_id);
            let price = self.token_prices.read(token_id);
            
            assert(price > 0, 'Token not for sale');
            assert(buyer != seller, 'Cannot buy own token');

            // Calculate fees using Alexandria math
            let marketplace_fee = self.marketplace_fee.read();
            let fee_amount = (price * marketplace_fee) / 10000; // basis points
            let seller_amount = price - fee_amount;

            // Calculate royalty if set
            let royalty_recipient = self.royalty_recipients.read(token_id);
            let royalty_percentage = self.royalty_percentages.read(token_id);
            let royalty_amount = if royalty_recipient.is_non_zero() {
                (price * royalty_percentage) / 10000
            } else {
                0
            };

            let final_seller_amount = seller_amount - royalty_amount;

            // Transfer token
            self.erc721.transfer_from(seller, buyer, token_id);
            
            // Remove from listing
            self.token_prices.write(token_id, 0);

            self.emit(TokenSold { token_id, seller, buyer, price });
            self.reentrancy_guard.end();
        }

        fn set_royalty(ref self: ContractState, token_id: u256, recipient: ContractAddress, percentage: u256) {
            let caller = get_caller_address();
            assert(self.erc721.owner_of(token_id) == caller, 'Not token owner');
            assert(percentage <= 1000, 'Royalty too high'); // Max 10%

            self.royalty_recipients.write(token_id, recipient);
            self.royalty_percentages.write(token_id, percentage);

            self.emit(RoyaltySet { token_id, recipient, percentage });
        }

        fn get_listed_tokens(self: @ContractState) -> Array<u256> {
            let mut tokens = ArrayTrait::new();
            let listed = self.listed_tokens.read();
            let mut i = 0;
            loop {
                if i >= listed.len() {
                    break;
                }
                let token_id = listed.get(i).unwrap();
                if self.token_prices.read(token_id) > 0 {
                    tokens.append(token_id);
                }
                i += 1;
            };
            tokens
        }

        fn calculate_total_value(self: @ContractState, token_ids: Span<u256>) -> u256 {
            let mut total = 0;
            let mut i = 0;
            loop {
                if i >= token_ids.len() {
                    break;
                }
                let token_id = *token_ids.at(i);
                let price = self.token_prices.read(token_id);
                total += price;
                i += 1;
            };
            total
        }

        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable.upgrade(new_class_hash);
        }
    }

    #[starknet::interface]
    trait IAdvancedNFTMarketplace<TContractState> {
        fn mint_nft(ref self: TContractState, to: ContractAddress, token_id: u256, token_uri: ByteArray);
        fn list_token(ref self: TContractState, token_id: u256, price: u256);
        fn buy_token(ref self: TContractState, token_id: u256);
        fn set_royalty(ref self: TContractState, token_id: u256, recipient: ContractAddress, percentage: u256);
        fn get_listed_tokens(self: @TContractState) -> Array<u256>;
        fn calculate_total_value(self: @TContractState, token_ids: Span<u256>) -> u256;
        fn upgrade(ref self: TContractState, new_class_hash: ClassHash);
    }
}
