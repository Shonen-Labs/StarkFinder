use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20Mock<TContractState> {
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
    fn burn(ref self: TContractState, from: ContractAddress, amount: u256);
    fn get_owner(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod MockERC20 {
    use super::IERC20Mock;
    use starknet::{ContractAddress, get_caller_address, contract_address_const};

    #[storage]
    struct Storage {
        name: ByteArray,
        symbol: ByteArray,
        decimals: u8,
        total_supply: u256,
        balances: LegacyMap<ContractAddress, u256>,
        allowances: LegacyMap<(ContractAddress, ContractAddress), u256>,
        owner: ContractAddress,
        minters: LegacyMap<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        Approval: Approval,
        MinterAdded: MinterAdded,
        MinterRemoved: MinterRemoved,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        value: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Approval {
        owner: ContractAddress,
        spender: ContractAddress,
        value: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct MinterAdded {
        minter: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct MinterRemoved {
        minter: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        decimals: u8,
        initial_supply: u256,
        owner: ContractAddress
    ) {
        self.name.write(name);
        self.symbol.write(symbol);
        self.decimals.write(decimals);
        self.total_supply.write(initial_supply);
        self.balances.write(owner, initial_supply);
        self.owner.write(owner);
        self.minters.write(owner, true);
        
        self.emit(Transfer {
            from: contract_address_const::<0>(),
            to: owner,
            value: initial_supply,
        });
    }

    #[abi(embed_v0)]
    impl ERC20MockImpl of IERC20Mock<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn allowance(self: @ContractState, owner: ContractAddress, spender: ContractAddress) -> u256 {
            self.allowances.read((owner, spender))
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let sender = get_caller_address();
            self._transfer(sender, recipient, amount);
            true
        }

        fn transfer_from(ref self: ContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            let current_allowance = self.allowances.read((sender, caller));
            assert(current_allowance >= amount, 'Insufficient allowance');
            
            self.allowances.write((sender, caller), current_allowance - amount);
            self._transfer(sender, recipient, amount);
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let owner = get_caller_address();
            self.allowances.write((owner, spender), amount);
            
            self.emit(Approval { owner, spender, value: amount });
            true
        }

        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            assert(self.minters.read(caller), 'Not authorized to mint');
            assert(!to.is_zero(), 'Cannot mint to zero address');
            
            let current_supply = self.total_supply.read();
            let new_supply = current_supply + amount;
            self.total_supply.write(new_supply);
            
            let current_balance = self.balances.read(to);
            self.balances.write(to, current_balance + amount);
            
            self.emit(Transfer {
                from: contract_address_const::<0>(),
                to,
                value: amount,
            });
        }

        fn burn(ref self: ContractState, from: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            assert(self.minters.read(caller), 'Not authorized to burn');
            assert(!from.is_zero(), 'Cannot burn from zero address');
            
            let current_balance = self.balances.read(from);
            assert(current_balance >= amount, 'Insufficient balance to burn');
            
            let current_supply = self.total_supply.read();
            self.total_supply.write(current_supply - amount);
            self.balances.write(from, current_balance - amount);
            
            self.emit(Transfer {
                from,
                to: contract_address_const::<0>(),
                value: amount,
            });
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _transfer(ref self: ContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) {
            assert(!sender.is_zero(), 'Transfer from zero address');
            assert(!recipient.is_zero(), 'Transfer to zero address');
            
            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'Insufficient balance');
            
            self.balances.write(sender, sender_balance - amount);
            let recipient_balance = self.balances.read(recipient);
            self.balances.write(recipient, recipient_balance + amount);
            
            self.emit(Transfer { from: sender, to: recipient, value: amount });
        }
    }

    // Admin functions
    #[external(v0)]
    fn add_minter(ref self: ContractState, minter: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner can add minter');
        self.minters.write(minter, true);
        
        self.emit(MinterAdded { minter });
    }

    #[external(v0)]
    fn remove_minter(ref self: ContractState, minter: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner can remove minter');
        self.minters.write(minter, false);
        
        self.emit(MinterRemoved { minter });
    }

    #[external(v0)]
    fn is_minter(self: @ContractState, account: ContractAddress) -> bool {
        self.minters.read(account)
    }
}