#!/bin/bash

# Test script for the POST /generate endpoint

echo "🧪 Testing POST /generate endpoint"
echo "================================"

BASE_URL="http://localhost:8080"

# Test 1: Valid request
echo "Test 1: Valid contract generation"
curl -X POST "$BASE_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "MyToken",
    "source_code": "#[starknet::contract]\nmod MyToken {\n    use starknet::ContractAddress;\n    \n    #[storage]\n    struct Storage {\n        name: felt252,\n        symbol: felt252,\n    }\n    \n    #[constructor]\n    fn constructor(ref self: ContractState, name: felt252, symbol: felt252) {\n        self.name.write(name);\n        self.symbol.write(symbol);\n    }\n}",
    "scarb_config": "[package]\nname = \"my_token\"\nversion = \"0.1.0\"\nedition = \"2024_07\"\ncairo_version = \"2.8.0\"\n\n[dependencies]\nstarknet = \"2.8.0\"",
    "blockchain": "starknet",
    "session_id": "test-session-123"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo -e "\n---\n"

# Test 2: Empty name (should fail)
echo "Test 2: Empty name validation"
curl -X POST "$BASE_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "",
    "source_code": "#[starknet::contract]\nmod TestContract {}",
    "blockchain": "starknet"
  }' \x
  -w "\nStatus: %{http_code}\n\n"

echo -e "\n---\n"

# Test 3: Empty source code (should fail)
echo "Test 3: Empty source code validation"
curl -X POST "$BASE_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "TestContract",
    "source_code": "",
    "blockchain": "starknet"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo -e "\n---\n"

# Test 4: Non-existent user (should fail)
echo "Test 4: Non-existent user"
curl -X POST "$BASE_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 999999,
    "name": "TestContract",
    "source_code": "#[starknet::contract]\nmod TestContract {}",
    "blockchain": "starknet"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo -e "\n---\n"

echo "✅ Test script completed!"
echo "Expected results:"
echo "- Test 1: 201 Created (with contract data)"
echo "- Test 2: 400 Bad Request (contract name cannot be empty)"
echo "- Test 3: 400 Bad Request (source code cannot be empty)"
echo "- Test 4: 400 Bad Request (user not found)"
