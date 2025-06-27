use starknet::ContractAddress;

// Define the contract interface
#[starknet::interface]
pub trait IFeeDeduction<TContractState> {
    fn charge_fee_and_execute(ref self: TContractState, action_data: felt252) -> bool;
    fn set_strk_token_address(ref self: TContractState, token_address: ContractAddress);
    fn set_fee_amount(ref self: TContractState, new_fee_amount: u256);
    fn set_owner(ref self: TContractState, new_owner: ContractAddress);
    fn get_fee_amount(self: @TContractState) -> u256;
    fn get_strk_token_address(self: @TContractState) -> ContractAddress;
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn withdraw_fees(ref self: TContractState, to: ContractAddress, amount: u256);
}

// IERC20 interface for token transfers
#[starknet::interface]
pub trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
}

// Define the contract module
#[starknet::contract]
pub mod FeeDeduction {
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    // Define storage variables
    #[storage]
    pub struct Storage {
        strk_token_address: ContractAddress,  // Address of the STRK token contract
        fee_amount: u256,                     // Fee amount in STRK tokens (e.g., 0.1 STRK = 100000000000000000 wei)
        owner: ContractAddress,               // Contract owner who can update settings
        total_fees_collected: u256,           // Total fees collected by the contract
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        FeeCharged: FeeCharged,
        OwnerChanged: OwnerChanged,
        FeeAmountUpdated: FeeAmountUpdated,
        STRKTokenAddressUpdated: STRKTokenAddressUpdated,
        FeesWithdrawn: FeesWithdrawn,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FeeCharged {
        user: ContractAddress,
        amount: u256,
        action_data: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnerChanged {
        old_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FeeAmountUpdated {
        old_amount: u256,
        new_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct STRKTokenAddressUpdated {
        old_address: ContractAddress,
        new_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FeesWithdrawn {
        to: ContractAddress,
        amount: u256,
    }

    /// Initializes the contract with STRK token address, fee amount, and owner
    /// @param strk_token_address: address of the STRK token contract
    /// @param initial_fee_amount: initial fee amount in wei
    /// @param owner: contract owner address
    #[constructor]
    fn constructor(
        ref self: ContractState,
        strk_token_address: ContractAddress,
        initial_fee_amount: u256,
        owner: ContractAddress
    ) {
        self.strk_token_address.write(strk_token_address);
        self.fee_amount.write(initial_fee_amount);
        self.owner.write(owner);
        self.total_fees_collected.write(0);
    }

    
    #[abi(embed_v0)]
    pub impl FeeDeductionImpl of super::IFeeDeduction<ContractState> {
        /// Charges the user a fee in STRK tokens and executes an action
        /// @param action_data: arbitrary data for the action being performed
        /// @return bool: true if fee charge was successful
        fn charge_fee_and_execute(ref self: ContractState, action_data: felt252) -> bool {
            let caller = get_caller_address();
            let contract_address = get_contract_address();
            let fee_amount = self.fee_amount.read();
            let strk_token_address = self.strk_token_address.read();

            assert(fee_amount > 0, 'Fee amount must be > 0');

            let strk_token = IERC20Dispatcher { contract_address: strk_token_address };

            let user_balance = strk_token.balance_of(caller);
            assert(user_balance >= fee_amount, 'Insufficient STRK balance');

            let allowance = strk_token.allowance(caller, contract_address);
            assert(allowance >= fee_amount, 'Insufficient allowance');

            let transfer_success = strk_token.transfer_from(caller, contract_address, fee_amount);
            assert(transfer_success, 'Fee transfer failed');

            let current_total = self.total_fees_collected.read();
            self.total_fees_collected.write(current_total + fee_amount);

            self.emit(Event::FeeCharged(FeeCharged {
                user: caller,
                amount: fee_amount,
                action_data: action_data,
            }));

            true
        }

        /// Updates the STRK token contract address (owner only)
        /// @param token_address: new STRK token contract address
        fn set_strk_token_address(ref self: ContractState, token_address: ContractAddress) {
            self._assert_only_owner();
            let old_address = self.strk_token_address.read();
            self.strk_token_address.write(token_address);
            
            self.emit(Event::STRKTokenAddressUpdated(STRKTokenAddressUpdated {
                old_address: old_address,
                new_address: token_address,
            }));
        }

        /// Updates the fee amount in STRK tokens (owner only)
        /// @param new_fee_amount: new fee amount in wei 
        fn set_fee_amount(ref self: ContractState, new_fee_amount: u256) {
            self._assert_only_owner();
            let old_amount = self.fee_amount.read();
            self.fee_amount.write(new_fee_amount);
            
            self.emit(Event::FeeAmountUpdated(FeeAmountUpdated {
                old_amount: old_amount,
                new_amount: new_fee_amount,
            }));
        }

        /// Transfers contract ownership to a new address (owner only)
        /// @param new_owner: new contract owner address
        fn set_owner(ref self: ContractState, new_owner: ContractAddress) {
            self._assert_only_owner();
            let old_owner = self.owner.read();
            self.owner.write(new_owner);
            
            self.emit(Event::OwnerChanged(OwnerChanged {
                old_owner: old_owner,
                new_owner: new_owner,
            }));
        }

        /// Returns the current fee amount in STRK tokens
        /// @return u256: fee amount in wei
        fn get_fee_amount(self: @ContractState) -> u256 {
            self.fee_amount.read()
        }

        /// Returns the STRK token contract address
        /// @return ContractAddress: STRK token contract address
        fn get_strk_token_address(self: @ContractState) -> ContractAddress {
            self.strk_token_address.read()
        }

        /// Returns the contract owner address
        /// @return ContractAddress: current contract owner
        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        /// Withdraws collected fees to specified address (owner only)
        /// @param to: recipient address for the withdrawn fees
        /// @param amount: amount of STRK tokens to withdraw in wei
        fn withdraw_fees(ref self: ContractState, to: ContractAddress, amount: u256) {
            self._assert_only_owner();
            let strk_token_address = self.strk_token_address.read();
            let strk_token = IERC20Dispatcher { contract_address: strk_token_address };
            
            let contract_balance = strk_token.balance_of(get_contract_address());
            assert(contract_balance >= amount, 'Insufficient contract balance');
            
            let transfer_success = strk_token.transfer(to, amount);
            assert(transfer_success, 'Withdrawal failed');
            
            let current_total = self.total_fees_collected.read();
            if current_total >= amount {
                self.total_fees_collected.write(current_total - amount);
            }
            
            self.emit(Event::FeesWithdrawn(FeesWithdrawn {
                to: to,
                amount: amount,
            }));
        }
    }


    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner can call');
        }
    }
} 