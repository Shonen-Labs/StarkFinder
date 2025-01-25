import type {
  LayerswapCreateSwapRequest,
  LayerswapSuccessResponse,
  LayerswapErrorResponse,
  LayerswapError,
  LayerswapRoutes,
} from "@/lib/transaction/types"

export class LayerswapClient {
  private readonly API_URL = "https://api.layerswap.io/api/v2/swaps"
  private readonly API_KEY: string

  constructor(apiKey: string) {
    this.API_KEY = apiKey
  }

  async createSwap(params: LayerswapCreateSwapRequest): Promise<LayerswapSuccessResponse> {
    try {
      const formattedRequest = {
        destination_address: params.destination_address,
        reference_id: params.reference_id || null,
        source_exchange: params.source_exchange || null,
        destination_exchange: params.destination_exchange || null,
        source_network: params.source_network,
        source_token: params.source_token,
        destination_network: params.destination_network,
        destination_token: params.destination_token,
        refuel: params.refuel,
        use_deposit_address: params.use_deposit_address,
        use_new_deposit_address: params.use_new_deposit_address || null,
        amount: params.amount,
        source_address: params.source_address || null,
        slippage: params.slippage || null,
      }

      console.log("Creating Layerswap request:", JSON.stringify(formattedRequest, null, 2))

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(formattedRequest),
      })

      const data = await response.json()
      console.log("Layerswap response:", JSON.stringify(data, null, 2))

      if (!response.ok) {
        if (data.error) {
          throw new Error(
            `Layerswap error: ${typeof data.error === "string" ? data.error : JSON.stringify(data.error)}`,
          )
        }
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(`Layerswap errors: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`)
        }
        throw new Error(`Layerswap request failed with status ${response.status}`)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error("Layerswap error details:", { message: error.message, stack: error.stack })
        throw error
      }
      console.error("Unknown Layerswap error:", JSON.stringify(error, null, 2))
      throw new Error("Unknown Layerswap error occurred")
    }
  }

  async getAvailableRoutes(): Promise<LayerswapRoutes> {
    try {
      const response = await fetch(`${this.API_URL}/layers`, {
        method: "GET",
        headers: {
          "X-LS-APIKEY": this.API_KEY,
          accept: "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        const error = data as LayerswapError
        throw new Error(`Failed to get available routes: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error getting available routes:", error)
      throw error
    }
  }
}

