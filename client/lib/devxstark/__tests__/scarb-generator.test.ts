// __tests__/scarb-generator.test.ts
import { scarbGenerator } from '../scarb-generator';

// Mock the DeepSeek client
jest.mock('../deepseek-client', () => ({
  createDeepSeekClient: jest.fn(() => ({
    complete: jest.fn().mockResolvedValue('This is a basic ERC20 token contract with standard functionality.')
  }))
}));

describe('ScarbGenerator', () => {
  describe('extractImports', () => {
    test('should extract basic use statements', async () => {
      const code = `
        use starknet::ContractAddress;
        use openzeppelin::token::erc20::ERC20Component;
        use alexandria_storage::list::List;
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'test_contract');
      
      expect(result).toContain('starknet = "2.8.0"');
      expect(result).toContain('openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }');
      expect(result).toContain('alexandria_storage = { git = "https://github.com/keep-starknet-strange/alexandria.git", tag = "v0.1.0" }');
    });

    test('should extract grouped imports', async () => {
      const code = `
        use openzeppelin::token::erc20::{ERC20Component, IERC20};
        use starknet::{ContractAddress, ClassHash};
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'test_contract');
      
      expect(result).toContain('starknet = "2.8.0"');
      expect(result).toContain('openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }');
    });

    test('should detect ERC patterns without explicit imports', async () => {
      const code = `
        #[starknet::contract]
        mod ERC20Token {
          use starknet::ContractAddress;
          
          #[storage]
          struct Storage {
            name: felt252,
            symbol: felt252,
          }
          
          fn transfer(to: ContractAddress, amount: u256) -> bool {
            // ERC20 transfer logic
            true
          }
        }
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'erc20_token');
      
      expect(result).toContain('starknet = "2.8.0"');
      // Should detect ERC20 pattern and include OpenZeppelin
      expect(result).toContain('openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }');
    });
  });

  describe('dependency detection', () => {
    test('should detect OpenZeppelin dependencies', async () => {
      const code = `
        use openzeppelin::access::ownable::OwnableComponent;
        use openzeppelin::token::erc721::ERC721Component;
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'nft_contract');
      
      expect(result).toContain('openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }');
    });

    test('should detect Alexandria dependencies', async () => {
      const code = `
        use alexandria_math::pow;
        use alexandria_data_structures::array_ext::ArrayTraitExt;
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'math_contract');
      
      expect(result).toContain('alexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git", tag = "v0.1.0" }');
      expect(result).toContain('alexandria_data_structures = { git = "https://github.com/keep-starknet-strange/alexandria.git", tag = "v0.1.0" }');
    });

    test('should detect testing dependencies', async () => {
      const code = `
        use snforge_std::{declare, deploy, start_prank, stop_prank};
        
        #[test]
        fn test_contract() {
          let contract = declare("TestContract");
          assert(true, 'Test passed');
        }
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'test_contract');
      
      expect(result).toContain('snforge_std = "0.39.0"');
    });
  });

  describe('complex contract scenarios', () => {
    test('should handle complex ERC20 with OpenZeppelin', async () => {
      const code = `
        #[starknet::contract]
        mod MyToken {
          use starknet::ContractAddress;
          use openzeppelin::token::erc20::{ERC20Component, IERC20};
          use openzeppelin::access::ownable::OwnableComponent;
          
          component!(path: ERC20Component, storage: erc20, event: ERC20Event);
          component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
          
          #[abi(embed_v0)]
          impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
          
          #[storage]
          struct Storage {
            #[substorage(v0)]
            erc20: ERC20Component::Storage,
            #[substorage(v0)]
            ownable: OwnableComponent::Storage,
          }
        }
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'my_token');
      
      expect(result).toContain('[package]');
      expect(result).toContain('name = "my_token"');
      expect(result).toContain('version = "0.1.0"');
      expect(result).toContain('edition = "2024_07"');
      expect(result).toContain('cairo_version = "2.8.0"');
      expect(result).toContain('[dependencies]');
      expect(result).toContain('starknet = "2.8.0"');
      expect(result).toContain('openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }');
      expect(result).toContain('[[target.starknet-contract]]');
      expect(result).toContain('sierra = true');
      expect(result).toContain('casm = true');
    });

    test('should handle contract with multiple complex dependencies', async () => {
      const code = `
        use starknet::{ContractAddress, ClassHash};
        use openzeppelin::token::erc721::{ERC721Component, IERC721};
        use openzeppelin::access::ownable::OwnableComponent;
        use alexandria_math::pow;
        use alexandria_storage::list::{List, ListTrait};
        
        #[starknet::contract]
        mod ComplexNFT {
          // Complex NFT with math operations and storage utilities
        }
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'complex_nft');
      
      expect(result).toContain('starknet = "2.8.0"');
      expect(result).toContain('openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }');
      expect(result).toContain('alexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git", tag = "v0.1.0" }');
      expect(result).toContain('alexandria_storage = { git = "https://github.com/keep-starknet-strange/alexandria.git", tag = "v0.1.0" }');
    });
  });

  describe('edge cases', () => {
    test('should handle empty code', async () => {
      const result = await scarbGenerator.generateScarbToml('', 'empty_contract');
      
      expect(result).toContain('[package]');
      expect(result).toContain('name = "empty_contract"');
      expect(result).toContain('starknet = "2.8.0"');
    });

    test('should handle code with only comments', async () => {
      const code = `
        // This is a comment
        /* This is a block comment */
      `;
      
      const result = await scarbGenerator.generateScarbToml(code, 'comment_only');
      
      expect(result).toContain('starknet = "2.8.0"');
    });

    test('should sanitize contract names', async () => {
      const result = await scarbGenerator.generateScarbToml('use starknet::ContractAddress;', 'My-Contract Name!');
      
      expect(result).toContain('name = "my_contract_name_"');
    });
  });

  describe('fallback behavior', () => {
    test('should use fallback when AI generation fails', async () => {
      // Mock AI failure
      const mockClient = require('../deepseek-client').createDeepSeekClient();
      mockClient.complete.mockRejectedValueOnce(new Error('AI service unavailable'));
      
      const code = 'use openzeppelin::token::erc20::ERC20Component;';
      const result = await scarbGenerator.generateScarbToml(code, 'fallback_test');
      
      expect(result).toContain('starknet = "2.8.0"');
      expect(result).toContain('openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }');
    });
  });
});
