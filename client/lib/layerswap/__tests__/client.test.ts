import { LayerswapClient } from '../client';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('LayerswapClient', () => {
  let client: LayerswapClient;
  const mockApiKey = 'test_api_key';

  beforeEach(() => {
    client = new LayerswapClient(mockApiKey);
  });

  describe('constructor', () => {
    it('should throw error if API key is not provided', () => {
      expect(() => new LayerswapClient('')).toThrow('Layerswap API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(client).toBeInstanceOf(LayerswapClient);
    });
  });

  describe('createSwap', () => {
    const mockSwapRequest = {
      sourceNetwork: 'ethereum_mainnet',
      destinationNetwork: 'starknet_mainnet',
      sourceToken: 'ETH',
      destinationToken: 'ETH',
      amount: 0.1,
      destinationAddress: '0x1234567890123456789012345678901234567890',
    };

    it('should validate amount', async () => {
      await expect(client.createSwap({
        ...mockSwapRequest,
        amount: 0,
      })).rejects.toThrow('Amount must be greater than 0');
    });

    it('should validate destination address', async () => {
      await expect(client.createSwap({
        ...mockSwapRequest,
        destinationAddress: 'invalid_address',
      })).rejects.toThrow('Invalid destination address format');
    });

    it('should handle route not found error', async () => {
      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'ROUTE_NOT_FOUND_ERROR',
          }),
        })
      );

      await expect(client.createSwap(mockSwapRequest))
        .rejects.toThrow(/Bridge route not available/);
    });

    it('should handle insufficient liquidity error', async () => {
      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'INSUFFICIENT_LIQUIDITY',
          }),
        })
      );

      await expect(client.createSwap(mockSwapRequest))
        .rejects.toThrow(/Insufficient liquidity/);
    });

    it('should create swap successfully', async () => {
      const mockResponse = {
        data: {
          deposit_actions: [{
            call_data: JSON.stringify([{ type: 'approve' }, { type: 'transfer' }]),
          }],
        },
      };

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      const result = await client.createSwap(mockSwapRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSwapStatus', () => {
    it('should validate swap ID format', async () => {
      await expect(client.getSwapStatus('invalid-id!')).rejects.toThrow('Invalid swap ID format');
    });

    it('should get swap status successfully', async () => {
      const mockStatus = { status: 'completed' };
      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatus),
        })
      );

      const result = await client.getSwapStatus('valid-id-123');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getAvailableRoutes', () => {
    it('should get available routes successfully', async () => {
      const mockRoutes = {
        source_networks: ['ethereum_mainnet'],
        destination_networks: ['starknet_mainnet'],
        tokens: {
          ethereum_mainnet: ['ETH', 'USDC'],
          starknet_mainnet: ['ETH', 'USDC'],
        },
      };

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoutes),
        })
      );

      const result = await client.getAvailableRoutes();
      expect(result).toEqual(mockRoutes);
    });

    it('should handle API errors', async () => {
      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'API_ERROR',
          }),
        })
      );

      await expect(client.getAvailableRoutes()).rejects.toThrow();
    });
  });
});
