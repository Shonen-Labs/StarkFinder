/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTransactionHandler } from './base';
import { LayerswapClient } from '../../layerswap/client';
import { BrianTransactionData } from '../types';
import { TransactionStep } from '../types';
import { LayerswapSwapResponse, LayerswapRoutes } from '../types/layerswap';

export class BridgeHandler extends BaseTransactionHandler {
  private readonly NETWORK_MAPPING: Record<string, string> = {
    starknet: "starknet_mainnet",
    base: "base_mainnet",
    ethereum: "ethereum_mainnet",
    arbitrum: "arbitrum_mainnet",
    optimism: "optimism_mainnet",
    polygon: "polygon_mainnet",
    zkera: "zkera_mainnet",
    linea: "linea_mainnet",
    scroll: "scroll_mainnet",
    zksync: "zksync_mainnet",
  } as const;

  private layerswapClient: LayerswapClient;
  private availableRoutes: LayerswapRoutes | null = null;

  constructor(apiKey: string) {
    super();
    if (!apiKey) {
      throw new Error('Layerswap API key is required for bridging');
    }
    this.layerswapClient = new LayerswapClient(apiKey);
  }

  private formatNetwork(network: string): string {
    const mappedNetwork = this.NETWORK_MAPPING[network.toLowerCase()];
    if (!mappedNetwork) {
      throw new Error(`Network ${network} is not supported for bridging`);
    }
    return mappedNetwork;
  }

  private async getAvailableTokens(sourceNetwork: string, destinationNetwork: string): Promise<string[]> {
    if (!this.availableRoutes) {
      this.availableRoutes = await this.layerswapClient.getAvailableRoutes();
    }

    const route = this.availableRoutes.routes.find(
      r => r.source_network === sourceNetwork && r.destination_network === destinationNetwork
    );

    if (!route) {
      throw new Error(`No available route found for ${sourceNetwork} -> ${destinationNetwork}`);
    }

    // Return intersection of source and destination tokens
    return route.source_tokens.filter(token => route.destination_tokens.includes(token));
  }

  private async validateTokens(sourceNetwork: string, destinationNetwork: string, sourceToken?: string, destinationToken?: string): Promise<void> {
    if (!sourceToken || !destinationToken) {
      throw new Error('Source and destination tokens are required');
    }

    const availableTokens = await this.getAvailableTokens(sourceNetwork, destinationNetwork);
    const normalizedSourceToken = sourceToken.toUpperCase();
    const normalizedDestToken = destinationToken.toUpperCase();

    if (!availableTokens.includes(normalizedSourceToken) || !availableTokens.includes(normalizedDestToken)) {
      throw new Error(`Token pair ${sourceToken}->${destinationToken} not supported for this route. Available tokens: ${availableTokens.join(', ')}`);
    }
  }

  private validateAddresses(sourceAddress?: string, destinationAddress?: string): void {
    if (!sourceAddress || !destinationAddress) {
      throw new Error('Source and destination addresses are required');
    }

    const addressRegex = /^0x[a-fA-F0-9]{40,64}$/;
    if (!addressRegex.test(sourceAddress)) {
      throw new Error('Invalid source address format');
    }
    if (!addressRegex.test(destinationAddress)) {
      throw new Error('Invalid destination address format');
    }
  }

  private validateAmount(amount?: string | number): number {
    if (!amount) {
      throw new Error('Amount is required');
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    return numAmount;
  }

  async processSteps(
    data: BrianTransactionData,
    params?: any
  ): Promise<TransactionStep[]> {
    try {
      // Extract and validate parameters
      const sourceNetwork = this.formatNetwork(params?.chain || "starknet");
      const destinationNetwork = this.formatNetwork(params?.dest_chain || "base");
      
      // Get available tokens and validate
      const availableTokens = await this.getAvailableTokens(sourceNetwork, destinationNetwork);
      console.log(`Available tokens for ${sourceNetwork}->${destinationNetwork}:`, availableTokens);

      // Default to ETH if available, otherwise use first available token
      const defaultToken = availableTokens.includes('ETH') ? 'ETH' : availableTokens[0];
      const sourceToken = (params?.token1 || defaultToken).toUpperCase();
      const destinationToken = (params?.token2 || defaultToken).toUpperCase();

      // Validate tokens
      await this.validateTokens(sourceNetwork, destinationNetwork, sourceToken, destinationToken);

      // Extract and validate addresses
      const sourceAddress = data.bridge?.sourceAddress || params?.address;
      const destinationAddress = data.bridge?.destinationAddress || params?.address;
      this.validateAddresses(sourceAddress, destinationAddress);

      // Validate amount
      const amount = this.validateAmount(params?.amount);

      // Create swap request
      const response: LayerswapSwapResponse = await this.layerswapClient.createSwap({
        sourceNetwork,
        destinationNetwork,
        sourceToken,
        destinationToken,
        amount,
        sourceAddress,
        destinationAddress,
      });

      return [
        {
          type: 'bridge',
          status: 'success',
          message: `Bridge transaction created from ${sourceNetwork} to ${destinationNetwork}`,
          data: response,
          url: `https://www.layerswap.io/track/${response.id}`,
        },
      ];
    } catch (error: any) {
      console.error('Bridge error:', error);
      throw error;
    }
  }
}
