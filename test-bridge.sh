#!/bin/bash

# Test wallet address - replace with your test wallet
TEST_WALLET="0x1234567890123456789012345678901234567890"

# Test bridging from Starknet to Ethereum
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "bridge 0.1 ETH from starknet to ethereum",
    "address": "'$TEST_WALLET'",
    "chainId": "starknet",
    "messages": [
      {
        "role": "user",
        "content": "bridge 0.1 ETH from starknet to ethereum"
      }
    ],
    "userId": "test-user"
  }'
