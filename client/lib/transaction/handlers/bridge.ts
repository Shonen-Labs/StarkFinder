/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BrianTransactionData, LayerswapNetwork, TransactionStep } from "../types";
import { BaseTransactionHandler } from "./base";
import { LayerswapClient } from "../../layerswap/client";
import { StarknetChainId } from "@argent/tma-wallet";
import { tokenize } from "prismjs";

export class BridgeHandler extends BaseTransactionHandler {
  private layerswapClient: LayerswapClient;
  private chainId: StarknetChainId;

  constructor(apiKey: string, chainId: StarknetChainId) {
    super();
    this.chainId = chainId;
    this.layerswapClient = new LayerswapClient(apiKey);
  }

    private async validateRoute(
      sourceNetwork: string,
      destinationNetwork: string,
      sourceToken: string,
      destinationToken: string
    ): Promise<void> {
      try {
        const networks = await this.layerswapClient.getNetworks();

        const sourceNetworkFormatted = await this.checkNetwork(sourceNetwork, networks);
        const destinationNetworkFormatted = await this.checkNetwork(destinationNetwork, networks);

        const sourceTokenFormatted = this.checkToken(sourceToken, sourceNetworkFormatted);
        const destinationTokenFormatted = this.checkToken(destinationToken, destinationNetworkFormatted);

        await this.checkDestination(sourceNetworkFormatted, sourceTokenFormatted, destinationNetworkFormatted, destinationTokenFormatted);
      } catch (error) {
        console.error('Route validation error:', error);
        throw error;
      }
    }
  
    private async checkNetwork(network: string, networks: LayerswapNetwork[]): Promise<LayerswapNetwork> {
      const normalized = network.toLowerCase();
      for (const network of networks){
        if(network.name.toLowerCase().includes(normalized)){
          return network;
        }
      }
      throw new Error('Network not supported');
    }

    private checkToken(token: string, network: LayerswapNetwork): string {
      const normalized = token.toLowerCase();
      if(!network.tokens){
        throw new Error('Tokens not available')
      }
      for (const token of network.tokens){
        const networkToken = token.symbol.toLowerCase();

        if(networkToken == normalized || networkToken.includes(normalized) || normalized.includes(networkToken)){
          return token.symbol
        }
      }
     
      throw new Error('Token not supported');
    }

    private async checkDestination(sourceNetwork: LayerswapNetwork, sourceToken: string, destinationNetwork: LayerswapNetwork, destinationToken: string) {
      const destinations  = await this.layerswapClient.getDestinations({sourceNetwork: sourceNetwork.name, sourceToken});

      for (const destination of destinations ){
        if (destination.name == destinationNetwork.name){
          if(!destination.tokens){
            throw new Error('Tokens not available')
          }
          const token = destination.tokens.find((token) => { token.symbol == destinationToken });
          if (!token) {
            throw new Error(`${sourceNetwork.display_name} cannot bridge to ${destinationToken}`);
          }
        }
      }

      throw new Error(`${sourceNetwork.display_name} - ${destinationNetwork.display_name} bridge not supported`);
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
        amount: Number.parseFloat(params.amount),
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
            `Bridge route not available from ${request.sourceToken} on ${params.chain} to ${request.destinationToken} on ${params.dest_chain}. You might need to bridge through an intermediate token like ETH.`
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
