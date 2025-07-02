import { ChatPromptTemplate } from "@langchain/core/prompts";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const CAIRO_SYSTEM_PROMPT = `You are an expert Cairo 2.0 smart contract developer specializing in creating secure, efficient, and production-ready smart contracts for the Starknet ecosystem.

Your expertise includes:
- Advanced Cairo 2.0 syntax (traits, components, storage)
- Secure and gas-optimized patterns
- Modular, interface-driven contract architecture
- Strict adherence to Cairo 2.0 and Starknet best practices

Coding Guidelines:
- Use proper #[storage] layout with accurate naming
- Keep contract name as \`mod contract {}\` (DO NOT RENAME)
- Define clear visibility, permissions (read, write, internal), and mutability for all functions
- Return structured output in **pure JSON** with the following format:

{
  "filename": "contract.cairo",
  "language": "cairo",
  "contract_type": "<contract type, e.g. ERC20, voting, multisig>",
  "description": "<brief description of the contract functionality>",
  "permissions": {
    "admin": ["<list of privileged functions>"],
    "public": ["<list of externally callable functions>"]
  },
  "code": "/* full contract code here */"
}

Important:
- Return only valid JSON — no markdown, no commentary, no extra line breaks before or after.
- Do not include any of the following in the output: \`"Here is your contract"\`, \`"Below is"\`, or explanation of what was generated.
`;

export const contractPromptTemplate = ChatPromptTemplate.fromMessages([
  new SystemMessage(CAIRO_SYSTEM_PROMPT),
  new HumanMessage({
    content: [
      {
        type: "text",
        text: `Generate a production-ready Cairo 2.0 smart contract with the following specifications:

{requirements}

Requirements may include contract type, features, roles (e.g. admin, owner), event logging, custom errors, or data structures.

Output must follow the structured JSON format described above and contain no extra content.`,
        cache_control: { type: "ephemeral" },
      },
    ],
  }),
]);

export const DOJO_SYSTEM_PROMPT = `You are an expert Cairo 2.0 Dojo smart contract developer.
You generate secure, gas-optimized, production-ready contracts for the Starknet ecosystem using the Dojo toolchain.

You must:
- Use #[dojo::contract] in a module named \`mod contract {}\`
- Use #[dojo::model] for models with #[key] on at least one field
- Respect Cairo 2.0 and Starknet best practices (security, gas, naming, modularity)
- Generate pure JSON output — no markdown, no extra explanations

Return JSON in the following format:
{
  "filename": "contract.cairo",
  "language": "cairo",
  "contract_type": "ERC20",
  "description": "Human-readable description",
  "permissions": {
    "admin": ["..."],
    "public": ["..."]
  },
  "code": "<full Cairo contract string>"
}

The \`code\` value must contain the complete Cairo 2.0 contract using #[dojo::contract].
NEVER wrap the JSON in \`\`\`, never explain anything, and never include code outside the JSON object.
`;

export const input = {
  contract_type: "token",
  description: "ERC20-like token with mint and burn",
  permissions: {
    admin: ["mint", "burn"],
    public: ["transfer", "approve", "transfer_from", "balance_of", "allowance"],
  },
  models: [],
  events: ["Transfer", "Approval"],
  logic: "Token transfers, approvals, minting and burning",
  metadata: {
    version: "1.0.0",
    author: "DojoExpert",
    license: "MIT",
  },
};

export const dojoContractPromptTemplate = ChatPromptTemplate.fromMessages([
  new SystemMessage(DOJO_SYSTEM_PROMPT),
  new HumanMessage({
    content: [
      {
        type: "text",
        text: `You are to generate a production-ready Cairo 2.0 smart contract using the Dojo framework.

The contract must be returned in a valid JSON format, with no extra text, no markdown, and no code fences.

Please follow this structure for the input:

{
  "contract_type": "game | voting | profile | leaderboard | marketplace | combat",
  "description": "Short description of the contract’s purpose",
  "permissions": {
    "admin": ["list", "of", "functions", "only", "admins", "can", "call"],
    "public": ["list", "of", "functions", "accessible", "to", "anyone"]
  },
  "models": [
    {
      "name": "ModelName",
      "keys": ["field1"],
      "fields": [
        { "name": "field1", "type": "u32" },
        { "name": "field2", "type": "felt252" }
      ]
    }
  ],
  "logic": "Human-readable description of the logic or behavior of the contract",
  "events": ["ListOfEventsToEmit"],
  "metadata": {
    "version": "1.0.0",
    "author": "YourNameOrTeam",
    "license": "MIT"
  }
}

Return a JSON object with the following keys:
- filename
- language
- contract_type
- description
- permissions
- code (Cairo 2.0 contract inside a string, in a module called 'contract')

The code must use #[dojo::contract] and #[dojo::model] appropriately and reflect all the input instructions.

Do not include markdown (like \`\`\`) or any explanation. Only return valid JSON.`,
        cache_control: { type: "ephemeral" },
        requirements: JSON.stringify(input, null, 2),
      },
    ],
  }),
]);
