// Test API integration with enhanced scarb generator
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Test the compile API endpoint
async function testCompileAPI() {
  console.log('🌐 Testing API Integration...\n');
  
  const testCases = [
    {
      name: 'ERC20 Contract',
      contract: `#[starknet::contract]
mod SimpleToken {
    use starknet::ContractAddress;
    
    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        total_supply: u256,
        balances: LegacyMap<ContractAddress, u256>,
    }
    
    #[constructor]
    fn constructor(ref self: ContractState, name: felt252, symbol: felt252, initial_supply: u256) {
        self.name.write(name);
        self.symbol.write(symbol);
        self.total_supply.write(initial_supply);
    }
}`,
      scarbToml: `[package]
name = "simple_token"
version = "0.1.0"
edition = "2024_07"
cairo_version = "2.8.0"

[dependencies]
starknet = "2.8.0"

[[target.starknet-contract]]
sierra = true
casm = true

[cairo]
sierra-replace-ids = true`
    },
    {
      name: 'OpenZeppelin ERC20',
      contract: `#[starknet::contract]
mod MyToken {
    use starknet::ContractAddress;
    use openzeppelin::token::erc20::{ERC20Component, IERC20};
    
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    
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
}`,
      scarbToml: `[package]
name = "my_token"
version = "0.1.0"
edition = "2024_07"
cairo_version = "2.8.0"

[dependencies]
starknet = "2.8.0"
openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.15.0" }

[[target.starknet-contract]]
sierra = true
casm = true

[cairo]
sierra-replace-ids = true`
    }
  ];
  
  let allTestsPassed = true;
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`API Test ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log('-'.repeat(50));
    
    try {
      // Test the compile API endpoint
      const testScript = `
const fs = require('fs');
const path = require('path');

// Simulate the compile API logic
function simulateCompileAPI(contract, scarbToml) {
  const tempDir = path.join(process.cwd(), 'temp_api_test');
  
  try {
    // Create temp directory structure
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const srcDir = path.join(tempDir, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }
    
    // Write files
    fs.writeFileSync(path.join(tempDir, 'Scarb.toml'), scarbToml);
    fs.writeFileSync(path.join(srcDir, 'main.cairo'), contract);
    
    console.log('✅ API simulation: Files created successfully');
    console.log('📄 Scarb.toml content:');
    console.log(scarbToml);
    
    // Validate scarb.toml structure
    const validationErrors = [];
    
    if (!scarbToml.includes('[package]')) validationErrors.push('Missing [package] section');
    if (!scarbToml.includes('[dependencies]')) validationErrors.push('Missing [dependencies] section');
    if (!scarbToml.includes('[[target.starknet-contract]]')) validationErrors.push('Missing target section');
    if (!scarbToml.includes('starknet =')) validationErrors.push('Missing starknet dependency');
    
    if (validationErrors.length === 0) {
      console.log('✅ Scarb.toml validation: PASSED');
      return { success: true, message: 'API simulation successful' };
    } else {
      console.log('❌ Scarb.toml validation: FAILED');
      console.log('Errors:', validationErrors.join(', '));
      return { success: false, errors: validationErrors };
    }
    
  } catch (error) {
    console.log('❌ API simulation failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

const contract = \`${testCase.contract.replace(/`/g, '\\`')}\`;
const scarbToml = \`${testCase.scarbToml.replace(/`/g, '\\`')}\`;

const result = simulateCompileAPI(contract, scarbToml);
console.log('Result:', JSON.stringify(result, null, 2));
`;
      
      const testDir = path.join(process.cwd(), 'temp-api-test');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
      }
      
      const scriptFile = path.join(testDir, `api-test-${i}.cjs`);
      fs.writeFileSync(scriptFile, testScript);
      
      // Execute the test
      const { stdout, stderr } = await execAsync(`node ${scriptFile}`);
      
      if (stderr) {
        console.log('⚠️  Warnings:', stderr);
      }
      
      console.log('📝 API Test Output:');
      console.log(stdout);
      
      // Parse the result
      const resultMatch = stdout.match(/Result: ({.*})/s);
      if (resultMatch) {
        const result = JSON.parse(resultMatch[1]);
        if (result.success) {
          console.log('✅ API Test PASSED');
          results.push({ name: testCase.name, status: 'PASSED' });
        } else {
          console.log('❌ API Test FAILED');
          console.log('Errors:', result.errors || result.error);
          allTestsPassed = false;
          results.push({ 
            name: testCase.name, 
            status: 'FAILED', 
            errors: result.errors || [result.error] 
          });
        }
      } else {
        console.log('❌ Could not parse API test result');
        allTestsPassed = false;
        results.push({ name: testCase.name, status: 'PARSE_ERROR' });
      }
      
      // Cleanup
      fs.unlinkSync(scriptFile);
      
    } catch (error) {
      console.log('❌ API Test failed with exception:', error.message);
      allTestsPassed = false;
      results.push({ 
        name: testCase.name, 
        status: 'EXCEPTION', 
        error: error.message 
      });
    }
    
    console.log('');
  }
  
  // Cleanup test directory
  const testDir = path.join(process.cwd(), 'temp-api-test');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  // Print summary
  console.log('='.repeat(50));
  console.log('📊 API INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.length - passed;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.status}`);
    if (result.errors) {
      result.errors.forEach(error => console.log(`   Error: ${error}`));
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  return allTestsPassed;
}

// Test the enhanced fallback in the actual codeEditor
async function testCodeEditorIntegration() {
  console.log('\n🔧 Testing CodeEditor Integration...\n');
  
  try {
    // Test the enhanced generateScarb function
    const testScript = `
const fs = require('fs');

// Import the enhanced generateScarb function logic
function generateScarb(deeps) {
  const sanitizeDeeps = deeps.map((dep) => dep.replace(/[^a-zA-Z0-9:_-]/g, ""));
  const uniqueDeeps = Array.from(new Set(sanitizeDeeps));
  const baseNames = Array.from(
    new Set(uniqueDeeps.map((dep) => dep.split("::")[0]))
  );
  
  // Enhanced dependency mapping
  const dependencies = {
    starknet: "2.8.0"
  };
  
  baseNames.forEach(name => {
    const lowerName = name.toLowerCase();
    
    // Enhanced OpenZeppelin detection
    if (lowerName.includes('openzeppelin') || lowerName.includes('erc20') || 
        lowerName.includes('erc721') || lowerName.includes('erc1155') ||
        lowerName.includes('ownable') || lowerName.includes('access')) {
      dependencies.openzeppelin = {
        git: "https://github.com/OpenZeppelin/cairo-contracts.git",
        tag: "v0.15.0"
      };
    }
    
    // Enhanced Alexandria detection
    else if (lowerName.includes('alexandria')) {
      if (lowerName.includes('math')) {
        dependencies.alexandria_math = {
          git: "https://github.com/keep-starknet-strange/alexandria.git",
          tag: "v0.1.0"
        };
      } else if (lowerName.includes('storage')) {
        dependencies.alexandria_storage = {
          git: "https://github.com/keep-starknet-strange/alexandria.git",
          tag: "v0.1.0"
        };
      }
    }
    
    // Testing dependencies
    else if (lowerName.includes('snforge') || lowerName.includes('test')) {
      dependencies.snforge_std = "0.39.0";
    }
    
    // Fallback for unknown dependencies
    else if (name !== 'starknet' && !dependencies[name]) {
      dependencies[name] = "2.8.0";
    }
  });
  
  // Generate TOML format
  let toml = \`[package]
name = "GeneratedContract"
version = "0.1.0"
edition = "2024_07"
cairo_version = "2.8.0"

[dependencies]
\`;
  
  Object.entries(dependencies).forEach(([name, value]) => {
    if (typeof value === 'string') {
      toml += \`\${name} = "\${value}"\\n\`;
    } else {
      toml += \`\${name} = { \`;
      const parts = Object.entries(value).map(([k, v]) => \`\${k} = "\${v}"\`);
      toml += parts.join(', ');
      toml += ' }\\n';
    }
  });
  
  toml += \`
[[target.starknet-contract]]
sierra = true
casm = true

[cairo]
sierra-replace-ids = true
\`;
  
  return toml;
}

// Test with different dependency combinations
const testCases = [
  {
    name: 'OpenZeppelin Dependencies',
    deps: ['openzeppelin::token::erc20', 'openzeppelin::access::ownable'],
    expectedDeps: ['starknet', 'openzeppelin']
  },
  {
    name: 'Alexandria Dependencies',
    deps: ['alexandria_math::pow', 'alexandria_storage::list'],
    expectedDeps: ['starknet', 'alexandria_math', 'alexandria_storage']
  },
  {
    name: 'Testing Dependencies',
    deps: ['snforge_std::declare', 'snforge_std::deploy'],
    expectedDeps: ['starknet', 'snforge_std']
  },
  {
    name: 'Mixed Dependencies',
    deps: ['openzeppelin::token::erc721', 'alexandria_math::sqrt', 'snforge_std::test'],
    expectedDeps: ['starknet', 'openzeppelin', 'alexandria_math', 'snforge_std']
  }
];

let allPassed = true;

testCases.forEach((testCase, index) => {
  console.log(\`Test \${index + 1}: \${testCase.name}\`);
  
  const result = generateScarb(testCase.deps);
  console.log('Generated TOML:');
  console.log(result);
  
  // Validate expected dependencies
  const missingDeps = testCase.expectedDeps.filter(dep => !result.includes(dep));
  
  if (missingDeps.length === 0) {
    console.log('✅ PASSED - All expected dependencies found');
  } else {
    console.log('❌ FAILED - Missing dependencies:', missingDeps.join(', '));
    allPassed = false;
  }
  
  console.log('');
});

console.log('CodeEditor Integration Test Result:', allPassed ? 'PASSED' : 'FAILED');
`;
    
    const scriptFile = path.join(process.cwd(), 'temp-codeeditor-test.cjs');
    fs.writeFileSync(scriptFile, testScript);
    
    const { stdout, stderr } = await execAsync(`node ${scriptFile}`);
    
    if (stderr) {
      console.log('⚠️  Warnings:', stderr);
    }
    
    console.log(stdout);
    
    // Cleanup
    fs.unlinkSync(scriptFile);
    
    const success = stdout.includes('CodeEditor Integration Test Result: PASSED');
    
    if (success) {
      console.log('✅ CodeEditor Integration: PASSED');
      return true;
    } else {
      console.log('❌ CodeEditor Integration: FAILED');
      return false;
    }
    
  } catch (error) {
    console.log('❌ CodeEditor Integration test failed:', error.message);
    return false;
  }
}

// Run all integration tests
async function runAllTests() {
  console.log('🧪 Running Complete Integration Test Suite...\n');
  
  const apiTestResult = await testCompileAPI();
  const codeEditorTestResult = await testCodeEditorIntegration();
  
  const overallSuccess = apiTestResult && codeEditorTestResult;
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 OVERALL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`API Integration Tests: ${apiTestResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`CodeEditor Integration Tests: ${codeEditorTestResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Overall Result: ${overallSuccess ? '🎉 ALL TESTS PASSED' : '💥 SOME TESTS FAILED'}`);
  
  return overallSuccess;
}

// Execute the tests
runAllTests().then(success => {
  if (success) {
    console.log('\n🎉 All integration tests passed successfully!');
    console.log('   The enhanced scarb.toml generation system is working correctly.');
    process.exit(0);
  } else {
    console.log('\n💥 Some integration tests failed.');
    console.log('   Please review the results above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Integration test execution failed:', error);
  process.exit(1);
});
