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
  private readonly MAX_RETRIES = 3; // Number of retries before failing
  private readonly RETRY_DELAY_MS = 1000; // Base delay in milliseconds (1 sec)

  constructor(apiKey: string) {
    this.API_KEY = apiKey;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = this.MAX_RETRIES
  ): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }

        if ([429, 500, 502, 503, 504].includes(response.status)) {
          console.warn(
            `Request failed with status ${response.status}, retrying (${
              attempt + 1
            }/${retries})...`
          );
          await this.sleep(this.RETRY_DELAY_MS * 2 ** attempt); // Exponential backoff
          continue;
        }

        return response;
      } catch (error) {
        console.error(
          `Fetch error on attempt ${attempt + 1}/${retries}:`,
          error
        );
        if (attempt === retries) throw error;
        await this.sleep(this.RETRY_DELAY_MS * 2 ** attempt);
      }
    }
    throw new Error(`Failed to fetch after ${retries} retries`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getNetworks(): Promise<LayerswapNetwork[]> {
    const response = await this.fetchWithRetry(`${this.API_URL}/networks`, {
      method: "GET",
      headers: {
        "X-LS-APIKEY": this.API_KEY,
        accept: "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(`Failed to get networks: ${data.message}`);
    return data.data;
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
    const reqParams = {
      source_network: params.sourceNetwork,
      source_token: params.sourceToken,
      destination_network: params.destinationNetwork,
      destination_token: params.destinationToken,
      source_address: params.sourceAddress,
      use_deposit_address:
        params.sourceAddress.toLowerCase() ===
        params.destinationAddress.toLowerCase()
          ? "true"
          : "false",
      amount: params.amount.toString(),
    };

    const urlParams = new URLSearchParams(reqParams).toString();

    const response = await this.fetchWithRetry(
      `${this.API_URL}/quote?${urlParams}`,
      {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok)
      throw new Error(`Failed to get transaction quote: ${data.message}`);
    return data.data;
  }

  async getDestinations(params: {
    sourceNetwork: string;
    sourceToken: string;
  }): Promise<LayerswapNetwork[]> {
    const urlParams = new URLSearchParams({
      source_network: params.sourceNetwork,
      source_token: params.sourceToken,
      include_swaps: "true",
    }).toString();

    const response = await this.fetchWithRetry(
      `${this.API_URL}/destinations?${urlParams}`,
      {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok)
      throw new Error(`Failed to get destinations: ${data.message}`);
    return data.data;
  }

  async getSources(params: {
    destinationNetwork: string;
    destinationToken: string;
  }): Promise<LayerswapNetwork[]> {
    const urlParams = new URLSearchParams({
      destination_network: params.destinationNetwork,
      destination_token: params.destinationToken,
      include_swaps: "true",
    }).toString();

    const response = await this.fetchWithRetry(
      `${this.API_URL}/sources?${urlParams}`,
      {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(`Failed to get sources: ${data.message}`);
    return data.data;
  }

  async getLimits(params: {
    sourceNetwork: string;
    sourceToken: string;
    destinationNetwork: string;
    destinationToken: string;
  }): Promise<LayerswapLimit> {
    const urlParams = new URLSearchParams({
      source_network: params.sourceNetwork,
      source_token: params.sourceToken,
      destination_network: params.destinationNetwork,
      destination_token: params.destinationToken,
    }).toString();

    const response = await this.fetchWithRetry(
      `${this.API_URL}/limits?${urlParams}`,
      {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(`Failed to get limits: ${data.message}`);
    return data.data;
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
    const formattedRequest = {
      destination_address: params.destinationAddress,
      reference_id: params.referenceId,
      source_network: params.sourceNetwork,
      source_token: params.sourceToken,
      destination_network: params.destinationNetwork,
      destination_token: params.destinationToken,
      use_deposit_address:
        params.sourceAddress.toLowerCase() ===
        params.destinationAddress.toLowerCase(),
      amount: params.amount,
      source_address: params.sourceAddress,
    };

    const response = await this.fetchWithRetry(`${this.API_URL}/swaps`, {
      method: "POST",
      headers: {
        "X-LS-APIKEY": this.API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(formattedRequest),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Failed to create swap: ${data.message}`);
    return data;
  }

  async getSwapInfo(swapId: string): Promise<LayerswapResponse> {
    const response = await this.fetchWithRetry(
      `${this.API_URL}/swaps/${swapId}`,
      {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok)
      throw new Error(`Failed to get swap info: ${data.message}`);
    return data.data;
  }
}
