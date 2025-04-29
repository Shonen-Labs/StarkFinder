"use client";
import Sidebar from "@/components/devx/contracts/Sidebar";

export default function Storage() {
  const contractCode = `use starknet::ContractAddress;

#[starknet::interface]
pub trait INatToken<TContractState> {
    fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256);
}

#[starknet::contract]
mod NatToken {
    use ERC20Component::InternalTrait;
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc20.initializer("Nat Token", "NAT");
    }

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20MixinImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl NatTokenImpl of super::INatToken<ContractState> {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.erc20.mint(recipient, amount);
        }
    }
}`;

  const explanation = `This ERC20 token implementation demonstrates a simple token contract using the OpenZeppelin ERC20 component in Cairo. 

The contract features:
- Standard ERC20 implementation (transfer, approve, etc.)
- Custom minting functionality
- Standard token metadata (name, symbol)

Key aspects of this implementation:
1. It uses the component pattern to inherit functionality from OpenZeppelin's ERC20 implementation
2. It adds a custom mint function to create new tokens
3. The contract is initialized with a name "Nat Token" and symbol "NAT"

This pattern is widely used in Starknet to create standard-compliant tokens that can be easily transferred and tracked within applications.`;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      <Sidebar />
      <div className="pl-64 w-full">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <h1 className="text-3xl font-bold text-white mb-2">ERC20 Token Contract</h1>
          <p className="text-lg text-white/80 mb-8">
            A standard ERC20 token implementation with minting capabilities using OpenZeppelin components.
          </p>

          <div className="bg-[#1e1e3f] rounded-lg overflow-hidden mb-8">
            <pre className="p-6 text-white overflow-auto text-sm leading-relaxed">
              <code>{contractCode}</code>
            </pre>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Explanation</h2>
            <div className="text-white/80 space-y-4">
              {explanation.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}