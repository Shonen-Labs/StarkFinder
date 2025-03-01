/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianTransactionData, TransactionStep } from "../types";
import { BaseTransactionHandler } from "./base";
import { LayerswapClient } from "../../layerswap/client";

// const NETWORK_MAPPING = {
//   'starknet': 'STARKNET_MAINNET',
//   'base': 'BASE_MAINNET',
//   'ethereum': 'ETHEREUM_MAINNET',
//   'arbitrum': 'ARBITRUM_MAINNET',
//   'optimism': 'OPTIMISM_MAINNET'
// } as const;


export class BridgeHandler extends BaseTransactionHandler {
  private layerswapClient: LayerswapClient;

  // Network mapping for Layerswap
  private readonly NETWORK_MAPPING: Record<string, string> = {
    starknet: "STARKNET_MAINNET",
    base: "BASE_MAINNET",
    ethereum: "ETHEREUM_MAINNET",
    arbitrum: "ARBITRUM_MAINNET",
    optimism: "OPTIMISM_MAINNET",
    polygon: "POLYGON_MAINNET",
    zkera: "ZKERA_MAINNET",
    linea: "LINEA_MAINNET",
    scroll: "SCROLL_MAINNET",
    zksync: "ZKSYNC_MAINNET",
  } as const;

  constructor(apiKey: string) {
    super();
    this.layerswapClient = new LayerswapClient(apiKey);
  }

    private async validateRoute(
      sourceNetwork: string,
      destinationNetwork: string,
      sourceToken: string,
      destinationToken: string
    ): Promise<void> {
      try {
        const routes = await this.layerswapClient.getAvailableRoutes();
        
        const sourceNetworkFormatted = this.formatNetwork(sourceNetwork);
        const destNetworkFormatted = this.formatNetwork(destinationNetwork);
  
        if (!routes.source_networks.includes(sourceNetworkFormatted)) {
          throw new Error(`Source network ${sourceNetwork} is not supported. Available networks: ${routes.source_networks.join(', ')}`);
        }
  
        if (!routes.destination_networks.includes(destNetworkFormatted)) {
          throw new Error(`Destination network ${destinationNetwork} is not supported. Available networks: ${routes.destination_networks.join(', ')}`);
        }
  
        // Check tokens
        const sourceNetworkTokens = routes.tokens[sourceNetworkFormatted] || [];
        const destNetworkTokens = routes.tokens[destNetworkFormatted] || [];
  
        const sourceTokenFormatted = sourceToken.toUpperCase();
        const destTokenFormatted = destinationToken.toUpperCase();
  
        if (!sourceNetworkTokens.includes(sourceTokenFormatted)) {
          throw new Error(`Token ${sourceToken} is not supported on ${sourceNetwork}. Available tokens: ${sourceNetworkTokens.join(', ')}`);
        }
  
        if (!destNetworkTokens.includes(destTokenFormatted)) {
          throw new Error(`Token ${destinationToken} is not supported on ${destinationNetwork}. Available tokens: ${destNetworkTokens.join(', ')}`);
        }
      } catch (error) {
        console.error('Route validation error:', error);
        throw error;
      }
    }
  
    private formatNetwork(network: string): string {
      const normalized = network.toLowerCase();
      switch (normalized) {
        case 'starknet':
          return 'STARKNET_MAINNET';
        case 'base':
          return 'BASE_MAINNET';
        case 'ethereum':
          return 'ETHEREUM_MAINNET';
        case 'arbitrum':
          return 'ARBITRUM_MAINNET';
        case 'optimism':
          return 'OPTIMISM_MAINNET';
        default:
          return `${network.toUpperCase()}_MAINNET`;
      }
    }
    async processSteps(
    data: BrianTransactionData,
    params?: any
  ): Promise<TransactionStep[]> {
    try {
      // Extract addresses from parameters
      const sourceAddress = data.bridge?.sourceAddress || params.address;
      const destinationAddress =
        data.bridge?.destinationAddress || params.address;

      // Create layerswap request
      const request = {
        sourceNetwork: this.formatNetwork(params.chain || "starknet"),
        destinationNetwork: this.formatNetwork(params.dest_chain || "base"),
        sourceToken: params.token1.toUpperCase(),
        destinationToken: params.token2.toUpperCase(),
        amount: parseFloat(params.amount),
        sourceAddress,
        destinationAddress,
      };

      // Log request for debugging
      console.log("Layerswap Request:", JSON.stringify(request, null, 2));

      // Validate route before proceeding
      await this.validateRoute(
        request.sourceNetwork,
        request.destinationNetwork,
        request.sourceToken,
        request.destinationToken
      );

      try {
        const response = await this.layerswapClient.createSwap(request);
        console.log("Layerswap Response:", JSON.stringify(response, null, 2));

        if (response.data?.deposit_actions?.[0]?.call_data) {
          return JSON.parse(
            response.data.deposit_actions[0].call_data
          ) as TransactionStep[];
        }

        throw new Error("No deposit actions in Layerswap response");
      } catch (error: any) {
        if (error.message?.includes("ROUTE_NOT_FOUND_ERROR")) {
          throw new Error(
            `Bridge route not available from ${request.sourceToken} on ${params.chain} to ${request.destinationToken} on ${params.dest_chain}. ` +
              "You might need to bridge through an intermediate token like ETH."
          );
        }
        throw error;
      }
    } catch (error) {
      console.error("Bridge processing error:", error);
      throw error;
    }
  }
}
