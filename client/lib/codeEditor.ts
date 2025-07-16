import { DeploymentStep } from "@/types/main-types";

export const DEFAULT_CONTRACT = `
use starknet::{ContractAddress};

#[starknet::interface]
pub trait IStarknetContract<TContractState> {
    /// Transfer token
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256);
    /// Retrieve balance.
    fn get_balance(self: @TContractState, account: ContractAddress) -> u256;
    /// Retrieve total supply
    fn get_total_supply(self: @TContractState) -> u256;
}

#[starknet::contract]
mod contract {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, Map, StorageMapReadAccess,
        StorageMapWriteAccess,
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        balance: Map<ContractAddress, u256>,
        total_supply: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        value: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256) {
        let sender = get_caller_address();
        self.owner.write(sender);
        self.total_supply.write(initial_supply);
        self.balance.write(sender, initial_supply);
    }

    #[abi(embed_v0)]
    impl StarknetImpl of super::IStarknetContract<ContractState> {
        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            let sender = get_caller_address();
            let sender_balance = self.balance.read(sender);
            assert(sender_balance >= amount, 'Insufficient balance');

            self.balance.write(sender, sender_balance - amount);
            self.balance.write(recipient, self.balance.read(recipient) + amount);

            self.emit(Event::Transfer(Transfer { from: sender, to: recipient, value: amount }));
        }

        fn get_balance(self: @ContractState, account: ContractAddress) -> u256 {
            self.balance.read(account)
        }

        fn get_total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }
    }
}
`;

export const initialSteps: DeploymentStep[] = [
  { title: "Building Contract", status: "pending" },
  { title: "Declaring Sierra Hash", status: "pending" },
  { title: "Declaring CASM Hash", status: "pending" },
  { title: "Deploying Contract", status: "pending" },
  { title: "Confirming Transaction", status: "pending" },
];

// Create a function to initialize the codeStore with the right value
export const initializeCodeStore = (setSourceCode: (code: string) => void) => {
  const savedEditorCode = localStorage.getItem("editorCode");

  if (savedEditorCode) {
    setSourceCode(savedEditorCode);
    return true;
  } else {
    setSourceCode(DEFAULT_CONTRACT);
    localStorage.setItem("editorCode", DEFAULT_CONTRACT);
    return false;
  }
};

export const extractImports = (code: string): string[] => {
  const importRegex = /use\s+([a-zA-Z0-9_:]+)(::\{[^}]+\})?;/g;
  const matches = [...code.matchAll(importRegex)];
  return matches.flatMap((matchArr) => {
    const base = matchArr[1];
    const inner = matchArr[2];
    if (inner) {
      return inner
        .replace(/^::\{|\}$/g, "")
        .split(",")
        .map((item) => `${base}::${item.trim()}`);
    }
    return [base];
  });
};

export type ConstructorArg = {
  name: string;
  type: string;
  value?: string;
};

export function extractConstructorArgs(contractCode: string): ConstructorArg[] {
  const constructorRegex = /#\[constructor\]\s*fn\s+constructor\s*\(([^)]*)\)/;
  const match = contractCode.match(constructorRegex);

  if (!match || !match[1]) return [];

  const paramList = match[1]
    .split(",")
    .map((param) => param.trim())
    .filter((param) => param !== "");

  return paramList
    .map((param) => {
      const parts = param.split(":").map((s) => s.trim());
      return {
        name: parts[0].replace(/^ref\s+/, ""), // remove `ref` if present
        type: parts[1] || "",
      };
    })
    .filter((param) => param.name !== "self"); // exclude self
}

export function checkForConstructorArgs(contractCode: string): boolean {
  const constructorRegex = /#\[constructor\]\s*fn\s+constructor\s*\(([^)]*)\)/;
  const match = contractCode.match(constructorRegex);
  if (!match || !match[1]) return false;
  return true;
}

export const generateScarb = (deeps: string[]): string => {
  const sanitizeDeeps = deeps.map((dep) => dep.replace(/[^a-zA-Z0-9:_-]/g, ""));
  const uniqueDeeps = Array.from(new Set(sanitizeDeeps));
  const baseNames = Array.from(
    new Set(uniqueDeeps.map((dep) => dep.split("::")[0]))
  );
  const deepFormatted = baseNames.map((name) => `${name} = "2.9.1"`).join("\n");
  return `[package]
    name = "GeneratedContract"
    version = "0.1.0"
    
[dependencies]
    ${deepFormatted}`;
};
