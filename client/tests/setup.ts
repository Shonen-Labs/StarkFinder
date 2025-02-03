import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test file
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set default timeout for all tests
jest.setTimeout(30000);

// Mock fetch for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        id: 'test-swap-id',
        created_date: new Date().toISOString(),
        status: 'created',
        transaction_id: 'test-tx-id',
        source_network: 'starknet_mainnet',
        destination_network: 'ethereum_mainnet',
        source_token: 'ETH',
        destination_token: 'ETH',
        amount: 0.1,
        source_address: '0x1234567890123456789012345678901234567890',
        destination_address: '0x1234567890123456789012345678901234567890'
      })
  } as Response)
);
