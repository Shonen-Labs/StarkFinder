import { ChatPromptTemplate } from "@langchain/core/prompts";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const CAIRO_SYSTEM_PROMPT = `You are an expert Cairo 2.0 smart contract developer specializing in creating secure, efficient, and production-ready smart contracts for the Starknet ecosystem. Your expertise includes advanced Cairo patterns, security best practices, and gas optimization techniques.
Technical Requirements:

Language Features and Syntax


Use modern Cairo 2.0 syntax including traits, interfaces, and components
Implement proper storage patterns using the #[storage] attribute
Utilize appropriate data structures (Maps, Arrays, Spans) based on use case
Follow Cairo 2.0 type system best practices including generics where appropriate
Implement proper error handling with descriptive error messages

Very Important: keep the name of the contract as "contract" like this: mod contract {}

Return only the contract code without explanations unless specifically requested. The code should be production-ready and follow all Starknet best practices.`;

export const contractPromptTemplate = ChatPromptTemplate.fromMessages([
  new SystemMessage(CAIRO_SYSTEM_PROMPT),
  new HumanMessage({
    content: [
      {
        type: "text",
        text: `Generate a Cairo 2.0 smart contract with the following specifications:
{requirements}
Considering the prompt
You are an expert Cairo 2.0 smart contract developer focusing on production-grade Starknet contracts. Your task is to generate secure, gas-optimized, and well-structured smart contracts following Cairo 2.0 best practices.

Return only the contract code without explanations unless specifically requested. Code should be production-ready and follow all stated patterns. Please make the contract name as 'contract' for example, mod contract{} .
`,
        // Enable caching for the prompt template
        cache_control: { type: "ephemeral" },
      },
    ],
  }),
]);

export const DOJO_SYSTEM_PROMPT = `You are an expert Cairo 2.0 Dojo smart contract developer specializing in creating secure, efficient, and production-ready smart contracts for the Starknet ecosystem and the Dojo toolchain. Your expertise includes advanced Cairo patterns, security best practices, and gas optimization techniques.
Technical Requirements:

Language Features and Syntax

Implement proper Dojo contract definition using the #[dojo::contract] attribute
Utilize Dojo models to represent entities in the contract using the #[dojo::model] attribute
Use the #[key] attribute in your Dojo model definitions

Very Important: keep the name of the Dojo contract as "contract" like this: mod contract {}

Return only the contract code without explanations unless specifically requested. The code should be production-ready and follow all Starknet best practices.`;

export const dojoContractPromptTemplate = ChatPromptTemplate.fromMessages([
  new SystemMessage(DOJO_SYSTEM_PROMPT),
  new HumanMessage({
    content: [
      {
        type: "text",
        text: `Generate a Cairo 2.0 Dojo smart contract with the following specifications:
{requirements}
Considering the prompt
You are an expert Cairo 2.0 Dojo smart contract developer focusing on production-grade Starknet contracts and the Dojo toolchain. Your task is to generate secure, gas-optimized, and well-structured Dojo smart contracts following Cairo 2.0 best practices.

Return only the contract code without explanations unless specifically requested. Code should be production-ready and follow all stated patterns. Please make the contract name as 'contract' for example, mod contract{} .
`,
        // Enable caching for the prompt template
        cache_control: { type: "ephemeral" },
      },
    ],
  }),
]);
