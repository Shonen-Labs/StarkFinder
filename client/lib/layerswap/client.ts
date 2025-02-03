/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  LayerswapErrorResponse,
  LayerswapSwapRequest,
  LayerswapSwapResponse,
  LayerswapRoutes,
  LayerswapNetwork
} from '../transaction/types/layerswap';

export class LayerswapClient {
  private readonly API_BASE_URL = "https://api.layerswap.io/api/v2";
  private readonly SWAPS_URL = `${this.API_BASE_URL}/swaps`;
  private readonly NETWORKS_URL = `${this.API_BASE_URL}/networks`;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests
  
  private lastRequestTime: number = 0;
  private availableRoutes: LayerswapRoutes | null = null;
  
  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('Layerswap API key is required');
    }
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    // Add security headers
    const headers = new Headers(options.headers);
    headers.set('X-LS-APIKEY', this.apiKey);
    headers.set('Accept', 'application/json');
    if (options.method === 'POST') {
      headers.set('Content-Type', 'application/json');
    }
    options.headers = headers;

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error() as LayerswapErrorResponse & Error;
        error.status = response.status;
        error.statusText = response.statusText;
        error.error = data.error;
        throw error;
      }

      return data as T;
    } catch (error) {
      console.error(`Error making request to ${url}:`, error);
      throw error;
    }
  }

  private async validateRoute(
    sourceNetwork: string,
    destinationNetwork: string,
    sourceToken: string,
    destinationToken: string
  ): Promise<void> {
    if (!this.availableRoutes) {
      this.availableRoutes = await this.getAvailableRoutes();
    }

    const route = this.availableRoutes.routes.find(
      r =>
        r.source_network === sourceNetwork &&
        r.destination_network === destinationNetwork &&
        r.source_tokens.includes(sourceToken) &&
        r.destination_tokens.includes(destinationToken)
    );

    if (!route) {
      throw new Error(
        `Invalid route: ${sourceNetwork} -> ${destinationNetwork} for tokens ${sourceToken} -> ${destinationToken}`
      );
    }
  }

  async getAvailableRoutes(): Promise<LayerswapRoutes> {
    return this.makeRequest<LayerswapRoutes>(this.NETWORKS_URL);
  }

  async createSwap(params: {
    sourceNetwork: string;
    destinationNetwork: string;
    sourceToken: string;
    destinationToken: string;
    amount: number;
    sourceAddress: string;
    destinationAddress: string;
  }): Promise<LayerswapSwapResponse> {
    try {
      await this.validateRoute(
        params.sourceNetwork,
        params.destinationNetwork,
        params.sourceToken,
        params.destinationToken
      );

      const formattedRequest: LayerswapSwapRequest = {
        source_network: params.sourceNetwork,
        destination_network: params.destinationNetwork,
        source_token: params.sourceToken,
        destination_token: params.destinationToken,
        amount: params.amount,
        source_address: params.sourceAddress,
        destination_address: params.destinationAddress
      };

      console.log(
        "Creating Layerswap swap with request:",
        JSON.stringify(formattedRequest, null, 2)
      );

      return this.makeRequest<LayerswapSwapResponse>(this.SWAPS_URL, {
        method: "POST",
        body: JSON.stringify(formattedRequest)
      });
    } catch (error) {
      console.error("Layerswap error:", error);
      throw error;
    }
  }

  async getSwapStatus(swapId: string): Promise<LayerswapSwapResponse> {
    if (!swapId) {
      throw new Error("Swap ID is required");
    }

    return this.makeRequest<LayerswapSwapResponse>(`${this.SWAPS_URL}/${swapId}`);
  }
}
