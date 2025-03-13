/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BrianTransactionData,
  LayerswapNetwork,
  TransactionStep,
} from "../types";
import { BaseTransactionHandler } from "./base";
import { LayerswapClient } from "../../layerswap/client";

export class BridgeHandler extends BaseTransactionHandler {
  private layerswapClient: LayerswapClient;

  constructor(apiKey: string) {
    super();
    this.layerswapClient = new LayerswapClient(apiKey);
  }

  private async validateRoute(
    sourceNetwork: string,
    destinationNetwork: string,
    sourceToken: string,
    destinationToken: string,
    amount: number
  ): Promise<{
    sourceNetwork: string;
    sourceToken: string;
    destinationNetwork: string;
    destinationToken: string;
  }> {
    try {
      const networks = await this.layerswapClient.getNetworks();
      console.log("Available Networks:", JSON.stringify(networks, null, 2));

      const sourceNetworkFormatted = await this.checkNetwork(
        sourceNetwork,
        networks
      );
      const destinationNetworkFormatted = await this.checkNetwork(
        destinationNetwork,
        networks
      );
      console.log("Source Network:", sourceNetworkFormatted.name, "Tokens:", sourceNetworkFormatted.tokens);
      console.log("Destination Network:", destinationNetworkFormatted.name, "Tokens:", destinationNetworkFormatted.tokens);

      const sourceTokenFormatted = this.checkToken(
        sourceToken,
        sourceNetworkFormatted
      );
      const destinationTokenFormatted = this.checkToken(
        destinationToken,
        destinationNetworkFormatted
      );

      await this.checkDestination(
        sourceNetworkFormatted,
        sourceTokenFormatted,
        destinationNetworkFormatted,
        destinationTokenFormatted
      );

      const limits = await this.layerswapClient.getLimits({
        sourceNetwork: sourceNetworkFormatted.name,
        sourceToken: sourceTokenFormatted,
        destinationNetwork: destinationNetworkFormatted.name,
        destinationToken: destinationTokenFormatted,
      });

      if (amount < limits.min_amount) {
        throw new Error(`Bridge amount below min amount ${limits.min_amount}`);
      }

      if (amount > limits.max_amount) {
        throw new Error(`Brigde amount above max amount ${limits.max_amount}`);
      }

      return {
        sourceNetwork: sourceNetworkFormatted.name,
        sourceToken: sourceTokenFormatted,
        destinationNetwork: destinationNetworkFormatted.name,
        destinationToken: destinationTokenFormatted,
      };
    } catch (error) {
      console.error("Route validation error:", error);
      throw error;
    }
  }

  private async checkNetwork(
    network: string,
    networks: LayerswapNetwork[]
  ): Promise<LayerswapNetwork> {
    const normalized = network.toLowerCase();
    for (const network of networks) {
      if (network.name.toLowerCase().includes(normalized)) {
        return network;
      }
    }
    throw new Error("Network not supported");
  }

  private checkToken(token: string, network: LayerswapNetwork): string {
    const normalized = token.toLowerCase();
    if (!network.tokens) {
      throw new Error(`Tokens not available for ${network.display_name}`);
    }
    for (const token of network.tokens) {
      const networkToken = token.symbol.toLowerCase();

      if (
        networkToken === normalized ||
        networkToken.includes(normalized) ||
        normalized.includes(networkToken)
      ) {
        return token.symbol;
      }
    }

    throw new Error("Token not supported");
  }

  private async checkDestination(
    sourceNetwork: LayerswapNetwork,
    sourceToken: string,
    destinationNetwork: LayerswapNetwork,
    destinationToken: string
  ) {
    const destinations = await this.layerswapClient.getDestinations({
      sourceNetwork: sourceNetwork.name,
      sourceToken,
    });

    const accepted_destination = destinations.map(
      (destination) => destination.display_name
    );

    for (const destination of destinations) {
      if (destination.name === destinationNetwork.name) {
        if (!destination.tokens) {
          throw new Error("Tokens not available");
        }

        const accepted_destination_tokens = destination.tokens.map(
          (token) => token.symbol
        );
        const token = destination.tokens.find(
          (token) => token.symbol === destinationToken
        );

        if (!token) {
          throw new Error(
            `${sourceToken} to ${destinationToken} bridge not supported. Supported tokens are: ${accepted_destination_tokens.join(
              ", "
            )}`
          );
        }

        return;
      }
    }

    const sources = await this.layerswapClient.getSources({
      destinationNetwork: destinationNetwork.name,
      destinationToken,
    });
    const accepted_sources = sources.map((source) => source.display_name);

    throw new Error(
      `${sourceNetwork.display_name} to ${destinationNetwork.display_name} bridge not supported. ` +
        `Supported bridges from source network ${
          sourceNetwork.display_name
        }: ${accepted_destination.join(", ")}. ` +
        `Supported bridges to  destination network ${
          destinationNetwork.display_name
        }: ${accepted_sources.join(", ")}.`
    );
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
      
        const destChain = params.dest_chain === "base" ? "ethereum" : params.dest_chain;

      // Validate route before proceeding
      const formattedData = await this.validateRoute(
        params.chain || "starknet",
        destChain || "ethereum",
        params.token1.toUpperCase(),
        params.token2.toUpperCase(),
        Number.parseFloat(params.amount)
      );

      // Create layerswap request
      const request = {
        sourceNetwork: formattedData.sourceNetwork,
        destinationNetwork: formattedData.destinationNetwork,
        sourceToken: formattedData.sourceToken,
        destinationToken: formattedData.destinationToken,
        amount: Number.parseFloat(params.amount),
        sourceAddress,
        destinationAddress,
        referenceId: params.reference_id,
      };

      // Log request for debugging
      console.log("Layerswap Request:", JSON.stringify(request, null, 2));

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
