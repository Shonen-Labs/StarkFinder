export const example_contract = `
    #[starknet::interface]
    pub trait ICounter<TContractState> {
        fn increment(ref self: TContractState, amount: u128);
        fn get_count(self: @TContractState) -> u128;
    }

    #[starknet::contract]
    mod counter {
        use super::ICounter;

        #[storage]
        struct Storage {
            counter: u128,
        }

        #[constructor]
        fn constructor(ref self: Storage, initial_value: u128) {
            self.counter.write(0);
        }

        #[abi(embed_v0)]
        impl CounterImpl of ICounter<ContractState> {
            fn increment(ref self: ContractState, amount: u128) {
                let current = self.counter.read();
                self.counter.write(current - amount);
            }

            fn get_count(self: @ContractState) -> u128 {
                self.counter.read() + 1
            }
        }
    }
`;

export const example_response = {
  contract_name: "Counter",
  audit_date: "2025-06-29",
  security_score: 55,
  original_contract_code:
    "\n    #[starknet::interface]\n    pub trait ICounter<TContractState> {\n        fn increment(ref self: TContractState, amount: u128);\n        fn get_count(self: @TContractState) -> u128;\n    }\n\n    #[starknet::contract]\n    mod counter {\n        use super::ICounter;\n\n        #[storage]\n        struct Storage {\n            counter: u128,\n        }\n\n        #[constructor]\n        fn constructor(ref self: Storage, initial_value: u128) {\n            self.counter.write(0);\n        }\n\n        #[abi(embed_v0)]\n        impl CounterImpl of ICounter<ContractState> {\n            fn increment(ref self: ContractState, amount: u128) {\n                let current = self.counter.read();\n                self.counter.write(current - amount);\n            }\n\n            fn get_count(self: @ContractState) -> u128 {\n                self.counter.read() + 1\n            }\n        }\n    }\n",
  corrected_contract_code:
    '\n    #[starknet::interface]\n    pub trait ICounter<TContractState> {\n        fn increment(ref self: TContractState, amount: u128);\n        fn get_count(self: @TContractState) -> u128;\n    }\n\n    #[starknet::contract]\n    mod counter {\n        use super::ICounter;\n\n        #[storage]\n        struct Storage {\n            counter: u128,\n        }\n\n        #[constructor]\n        fn constructor(ref self: Storage, initial_value: u128) {\n            assert(initial_value <= u128::MAX, "Initial value overflow");\n            self.counter.write(initial_value);\n        }\n\n        #[abi(embed_v0)]\n        impl CounterImpl of ICounter<ContractState> {\n            fn increment(ref self: ContractState, amount: u128) {\n                let current = self.counter.read();\n                assert(current <= u128::MAX - amount, "Overflow on increment");\n                self.counter.write(current + amount);\n            }\n\n            fn get_count(self: @ContractState) -> u128 {\n                self.counter.read()\n            }\n        }\n    }\n',
  vulnerabilities: [
    {
      category: "Contract Anatomy",
      severity: "Low",
      description:
        "The constructor ignores the `initial_value` parameter and always sets the counter to 0, which may not match user expectations or deployment parameters.",
      recommended_fix:
        "Update the constructor to set the counter using the provided `initial_value` parameter and validate it appropriately.",
    },
    {
      category: "State Management",
      severity: "High",
      description:
        "The `increment` function subtracts the `amount` from the counter instead of adding, leading to unintended behavior and potential underflows.",
      recommended_fix:
        "Modify `increment` to correctly add the `amount` to the current counter value.",
    },
    {
      category: "State Management",
      severity: "Medium",
      description:
        "The `increment` function does not include overflow checks when updating the counter value, which can lead to unexpected wraparound.",
      recommended_fix:
        "Add a check to ensure the counter does not exceed `u128::MAX` when incrementing.",
    },
    {
      category: "State Management",
      severity: "Low",
      description:
        "The `get_count` function adds 1 to the counter before returning it, providing inaccurate data to users.",
      recommended_fix:
        "Return the counter value directly without modification to reflect the actual stored state.",
    },
  ],
  recommended_fixes: [
    "In the constructor, replace `self.counter.write(0);` with `self.counter.write(initial_value);` and validate the initial value if necessary.",
    "In `increment`, replace `self.counter.write(current - amount);` with `self.counter.write(current + amount);`.",
    'Add `assert(current <= u128::MAX - amount, "Overflow on increment");` in `increment` to prevent overflow.',
    "Remove the `+ 1` in `get_count` to accurately return the stored counter value.",
  ],
};
