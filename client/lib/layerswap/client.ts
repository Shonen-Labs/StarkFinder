/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  LayerswapResponse,
  LayerswapError,
  LayerswapNetwork,
  LayerswapLimit,
  LayerswapQuoteResponse,
} from "@/lib/transaction/types";

export class LayerswapClient {
  private readonly API_URL = "https://api.layerswap.io/api/v2";
  private readonly API_KEY: string;

  constructor(apiKey: string) {
    this.API_KEY = apiKey;
  }

  async getNetworks(): Promise<LayerswapNetwork[]> {
    try {
      const response = await fetch(`${this.API_URL}/networks`, {
        method: 'GET',
        headers: {
          'X-LS-APIKEY': this.API_KEY,
          'accept': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as LayerswapError;
        throw new Error(`Failed to get available routes: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting available routes:', error);
      throw error;
    }
  }

  async getQuote(params: {
    sourceNetwork: string;
    destinationNetwork: string;
    sourceToken: string;
    destinationToken: string;
    amount: number;
    sourceAddress: string;
    destinationAddress: string;
  }): Promise<LayerswapQuoteResponse> {
    try {
      // Format request to match their implementation
      const useDepositAddress = params.sourceAddress.toLowerCase() == params.destinationAddress.toLowerCase();
      const reqParams = {
        source_network: params.sourceNetwork,
        source_token: params.sourceToken,
        destination_network: params.destinationNetwork,
        destination_token: params.destinationToken,
        source_address: params.sourceAddress,
        use_deposit_address: useDepositAddress? "true" : "false",
        amount: params.amount.toString(),
      };

      const urlParams = new URLSearchParams(reqParams).toString();

      const response = await fetch(`${this.API_URL}/quote?` + urlParams, {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as LayerswapError;
        throw new Error(`Failed to get transaction quote: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting transaction quote details:', error);
      throw error;
    }
  }

  async getDestinations(params: {
    sourceNetwork: string;
    sourceToken: string;
  }): Promise<LayerswapNetwork[]> {
    try {
      const reqParams = {
        source_network: params.sourceNetwork,
        source_token: params.sourceToken,
        include_swaps: "true",
      };

      const urlParams = new URLSearchParams(reqParams).toString();

      const response = await fetch(`${this.API_URL}/destinations?` + urlParams, {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as LayerswapError;
        throw new Error(`Failed to get destinations: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting supported bridge destination routes:', error);
      throw error;
    }
  }

  async getSources(params: {
    destinationNetwork: string;
    destinationToken: string;
  }): Promise<LayerswapNetwork[]> {
    try {
      const reqParams = {
        destination_network: params.destinationNetwork,
        destination_token: params.destinationToken,
        include_swaps: "true",
      };

      const urlParams = new URLSearchParams(reqParams).toString();

      const response = await fetch(`${this.API_URL}/sources?` + urlParams, {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as LayerswapError;
        throw new Error(`Failed to get destinations: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting supported bridge destination routes:', error);
      throw error;
    }
  }

  async getLimits(params: {
    sourceNetwork: string;
    sourceToken: string;
    destinationNetwork: string;
    destinationToken: string;
  }): Promise<LayerswapLimit> {
    try {
      const reqParams = {
        source_network: params.sourceNetwork,
        source_token: params.sourceToken,
        destination_network: params.destinationNetwork,
        destination_token: params.destinationToken,
      };

      const urlParams = new URLSearchParams(reqParams).toString();

      const response = await fetch(`${this.API_URL}/limits?` + urlParams, {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as LayerswapError;
        throw new Error(`Failed to get limits: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting route limits:', error);
      throw error;
    }
  }
  
  async createSwap(params: {
    sourceNetwork: string;
    destinationNetwork: string;
    sourceToken: string;
    destinationToken: string;
    amount: number;
    sourceAddress: string;
    destinationAddress: string;
    referenceId: string;
  }): Promise<LayerswapResponse> {
    try {
      // Format request to match their implementation
      const useDepositAddress = params.sourceAddress.toLowerCase() == params.destinationAddress.toLowerCase();
      const formattedRequest = {
        destination_address: params.destinationAddress,
        reference_id: params.referenceId,
        source_network: params.sourceNetwork,
        source_token: params.sourceToken,
        destination_network: params.destinationNetwork,
        destination_token: params.destinationToken,
        use_deposit_address: useDepositAddress,
        amount: params.amount,
        source_address: params.sourceAddress,
      };

      const response = await fetch(`${this.API_URL}/swaps`, {
        method: "POST",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(formattedRequest),
      });

      const data = await response.json();
      console.log("Layerswap response:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        if (data.error) {
          throw new Error(
            `Layerswap error: ${
              typeof data.error === "string"
                ? data.error
                : JSON.stringify(data.error)
            }`
          );
        }
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(
            `Layerswap errors: ${data.errors
              .map((e: { message: string }) => e.message)
              .join(", ")}`
          );
        }
        throw new Error(
          `Layerswap request failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Layerswap error details:", {
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
      console.error("Unknown Layerswap error:", JSON.stringify(error, null, 2));
      throw new Error("Unknown Layerswap error occurred");
    }
  }

  async getSwapInfo(
    swapId: string
  ): Promise<LayerswapResponse> {
    try {
      const response = await fetch(`${this.API_URL}/swaps/${swapId}`, {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as LayerswapError;
        throw new Error(`Failed to get limits: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting route limits:', error);
      throw error;
    }
  }


}
