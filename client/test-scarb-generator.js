// Simple test script to verify scarb generator improvements
const { scarbGenerator } = require('./lib/devxstark/scarb-generator.ts');

async function testScarbGenerator() {
  console.log('🧪 Testing Enhanced Scarb Generator...\n');

  // Test 1: Basic ERC20 contract
  console.log('Test 1: Basic ERC20 Contract');
  const erc20Code = `
    use starknet::ContractAddress;
    use openzeppelin::token::erc20::{ERC20Component, IERC20};
    use openzeppelin::access::ownable::OwnableComponent;
    
    #[starknet::contract]
    mod MyToken {
      component!(path: ERC20Component, storage: erc20, event: ERC20Event);
      component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    }
  `;

  try {
    const result1 = await scarbGenerator.generateScarbToml(erc20Code, 'my_token');
    console.log('✅ Generated Scarb.toml:');
    console.log(result1);
    console.log('\n' + '='.repeat(50) + '\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Complex contract with Alexandria
  console.log('Test 2: Complex Contract with Alexandria');
  const complexCode = `
    use starknet::{ContractAddress, ClassHash};
    use openzeppelin::token::erc721::{ERC721Component, IERC721};
    use alexandria_math::pow;
    use alexandria_storage::list::{List, ListTrait};
    use snforge_std::{declare, deploy};
    
    #[starknet::contract]
    mod ComplexNFT {
      // Complex NFT implementation
    }
  `;

  try {
    const result2 = await scarbGenerator.generateScarbToml(complexCode, 'complex_nft');
    console.log('✅ Generated Scarb.toml:');
    console.log(result2);
    console.log('\n' + '='.repeat(50) + '\n');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Simple contract with minimal dependencies
  console.log('Test 3: Simple Contract');
  const simpleCode = `
    use starknet::ContractAddress;
    
    #[starknet::contract]
    mod SimpleContract {
      #[storage]
      struct Storage {
        value: u256,
      }
    }
  `;

  try {
    const result3 = await scarbGenerator.generateScarbToml(simpleCode, 'simple_contract');
    console.log('✅ Generated Scarb.toml:');
    console.log(result3);
    console.log('\n' + '='.repeat(50) + '\n');
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('🎉 Testing completed!');
}

// Run the test
testScarbGenerator().catch(console.error);
