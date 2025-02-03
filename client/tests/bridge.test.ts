import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handleBridgeTransaction } from '../lib/transaction/handlers/bridge';

describe('Bridge Handler Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
  });

  it('should validate bridge parameters', async () => {
    const params = {
      amount: 0,
      sourceNetwork: 'ethereum_sepolia',
      destinationNetwork: 'starknet_testnet',
      sourceToken: 'ETH',
      destinationToken: 'ETH',
      destinationAddress: '0x1234567890123456789012345678901234567890',
    };

    await expect(handleBridgeTransaction(params)).rejects.toThrow('Amount must be greater than 0');
  });

  it('should handle invalid parameters', async () => {
    const params = {
      amount: 1,
      sourceNetwork: 'invalid_network',
      destinationNetwork: 'starknet_testnet',
      sourceToken: 'ETH',
      destinationToken: 'ETH',
      destinationAddress: '0x1234567890123456789012345678901234567890',
    };

    await expect(handleBridgeTransaction(params)).rejects.toThrow('Invalid network');
  });
});
