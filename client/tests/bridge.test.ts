import { BridgeHandler } from '../lib/transaction/handlers/bridge';
import { BrianTransactionData } from '../lib/transaction/types';

describe('Bridge Handler Tests', () => {
  let bridgeHandler: BridgeHandler;

  beforeEach(() => {
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();

    // Mock successful network routes response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            source_networks: [
              {
                id: 'starknet_mainnet',
                display_name: 'StarkNet',
                internal_name: 'starknet_mainnet',
                tokens: [{ asset: 'ETH', decimals: 18, symbol: 'ETH' }],
                status: 'active'
              }
            ],
            destination_networks: [
              {
                id: 'base_mainnet',
                display_name: 'Base',
                internal_name: 'base_mainnet',
                tokens: [{ asset: 'ETH', decimals: 18, symbol: 'ETH' }],
                status: 'active'
              }
            ],
            routes: [
              {
                source_network: 'starknet_mainnet',
                destination_network: 'base_mainnet',
                source_tokens: ['ETH'],
                destination_tokens: ['ETH']
              }
            ]
          })
      })
    );

    // Ensure we have an API key
    if (!process.env.LAYERSWAP_API_KEY) {
      throw new Error('LAYERSWAP_API_KEY is required in environment variables');
    }
    
    bridgeHandler = new BridgeHandler(process.env.LAYERSWAP_API_KEY);
  });

  it('should validate bridge parameters', async () => {
    // Mock successful swap response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'test-swap-id',
            created_date: new Date().toISOString(),
            status: 'created',
            transaction_id: 'test-tx-id',
            source_network: 'starknet_mainnet',
            destination_network: 'base_mainnet',
            source_token: 'ETH',
            destination_token: 'ETH',
            amount: 0.1,
            source_address: '0x1234567890123456789012345678901234567890',
            destination_address: '0x1234567890123456789012345678901234567890'
          })
      })
    );

    const data: BrianTransactionData = {
      type: 'bridge',
      bridge: {
        sourceAddress: '0x1234567890123456789012345678901234567890',
        destinationAddress: '0x1234567890123456789012345678901234567890'
      }
    };

    const params = {
      chain: 'starknet',
      dest_chain: 'base',
      token1: 'ETH',
      token2: 'ETH',
      amount: 0.1,
      address: '0x1234567890123456789012345678901234567890'
    };

    const steps = await bridgeHandler.processSteps(data, params);
    expect(steps).toBeDefined();
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].type).toBe('bridge_initiate');
    expect(steps[1].type).toBe('bridge_transaction');
    expect(steps[1].url).toContain('test-swap-id');
  });

  it('should handle invalid parameters', async () => {
    const data: BrianTransactionData = {
      type: 'bridge',
      bridge: {
        sourceAddress: '0x1234567890123456789012345678901234567890',
        destinationAddress: '0x1234567890123456789012345678901234567890'
      }
    };

    const params = {
      chain: 'invalid',
      dest_chain: 'invalid',
      token1: 'INVALID',
      token2: 'INVALID',
      amount: -1,
      address: 'invalid'
    };

    await expect(bridgeHandler.processSteps(data, params)).rejects.toThrow();
  });
});
