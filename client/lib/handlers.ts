/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from 'starknet';
import { 
  TransactionStep, 
  BrianTransactionData, 
  BrianResponse, 
  ProcessedTransaction,
  BrianToken,
  LayerswapSwapStatus
} from './transaction/types';
import { LayerswapClient } from './layerswap/client';

abstract class BaseTransactionHandler {
  abstract processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]>;
}

class SwapHandler extends BaseTransactionHandler {
  async processSteps(data: BrianTransactionData): Promise<TransactionStep[]> {
    const transactions: TransactionStep[] = [];
    
    for (const step of data.steps) {
      if (step.approve) transactions.push(step.approve);
      if (step.transactionData) transactions.push(step.transactionData);
      if (step.contractAddress && step.entrypoint && step.calldata) {
        transactions.push({
          contractAddress: step.contractAddress,
          entrypoint: step.entrypoint,
          calldata: step.calldata
        });
      }
    }
    
    return transactions;
  }
}

class TransferHandler extends BaseTransactionHandler {
  async processSteps(data: BrianTransactionData): Promise<TransactionStep[]> {
    const transactions: TransactionStep[] = [];
    
    for (const step of data.steps) {
      if (step.contractAddress && step.entrypoint && step.calldata) {
        transactions.push({
          contractAddress: step.contractAddress,
          entrypoint: step.entrypoint,
          calldata: step.calldata
        });
      }
    }

    return transactions;
  }
}

interface NostraTokenAddresses {
  [key: string]: {
    token: string;
    iToken: string;
  };
}

class NostraBaseHandler {
  protected readonly TOKENS: NostraTokenAddresses = {
    'strk': {
      token: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      iToken: '0x026c5994c2462770bbf940552c5824fb0e0920e2a8a5ce1180042da1b3e489db'
    },
    'eth': {
      token: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      iToken: '0x076bb5a142fa1e6b6a44d055b3cd6e31401ebbc76b6873b9f8a3f180f5b4870e'
    }
  };

  getTokenDetails(symbol: string, isInterestBearing: boolean = false): BrianToken {
    const token = symbol.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    return {
      address: isInterestBearing ? addresses.iToken : addresses.token,
      symbol: isInterestBearing ? `i${symbol.toUpperCase()}` : symbol.toUpperCase(),
      decimals: 18
    };
  }
}

class NostraDepositHandler extends NostraBaseHandler implements BaseTransactionHandler {
  async processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]> {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra deposit');
    }

    const token = params.token1.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token for Nostra deposit: ${params.token1}`);
    }

    const amountWithDecimals = (BigInt(params.amount) * BigInt(10 ** 18)).toString();

    return [{
      contractAddress: addresses.token,
      entrypoint: 'approve',
      calldata: [addresses.iToken, amountWithDecimals, '0']
    }, {
      contractAddress: addresses.iToken,
      entrypoint: 'deposit',
      calldata: [amountWithDecimals]
    }];
  }
}

class NostraWithdrawHandler extends NostraBaseHandler implements BaseTransactionHandler {
  async processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]> {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra withdraw');
    }

    const token = params.token1.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token for Nostra withdraw: ${params.token1}`);
    }

    const amountWithDecimals = (BigInt(params.amount) * BigInt(10 ** 18)).toString();

    return [{
      contractAddress: addresses.iToken,
      entrypoint: 'withdraw',
      calldata: [amountWithDecimals]
    }];
  }
}

class BridgeHandler extends BaseTransactionHandler {
  private readonly layerswapClient: LayerswapClient;

  constructor() {
    super();
    if (!process.env.LAYERSWAP_API_KEY) {
      throw new Error('LAYERSWAP_API_KEY environment variable is required');
    }
    this.layerswapClient = new LayerswapClient(process.env.LAYERSWAP_API_KEY);
  }

  async processSteps(data: BrianTransactionData): Promise<TransactionStep[]> {
    if (!data.bridge) {
      throw new Error('Bridge data is required for bridge transactions');
    }

    const { sourceNetwork, destinationNetwork, sourceToken, destinationToken, amount, sourceAddress, destinationAddress } = data.bridge;

    try {
      // First verify the route is available
      const routes = await this.layerswapClient.getAvailableRoutes();
      
      if (!routes.source_networks.includes(sourceNetwork.toLowerCase())) {
        throw new Error(`Source network ${sourceNetwork} is not supported`);
      }
      if (!routes.destination_networks.includes(destinationNetwork.toLowerCase())) {
        throw new Error(`Destination network ${destinationNetwork} is not supported`);
      }
      if (!routes.tokens[sourceNetwork.toLowerCase()]?.includes(sourceToken.toUpperCase())) {
        throw new Error(`Token ${sourceToken} is not supported on ${sourceNetwork}`);
      }

      // Create the swap
      const response = await this.layerswapClient.createSwap({
        sourceNetwork,
        destinationNetwork,
        sourceToken,
        destinationToken: destinationToken || sourceToken,
        amount,
        sourceAddress,
        destinationAddress: destinationAddress || sourceAddress
      });

      if (!response.data.deposit_actions || response.data.deposit_actions.length === 0) {
        throw new Error('No deposit actions received from Layerswap');
      }

      // Convert Layerswap actions to TransactionSteps
      const transactions: TransactionStep[] = [];
      for (const action of response.data.deposit_actions) {
        if (action.call_data) {
          try {
            const callData = JSON.parse(action.call_data);
            if (Array.isArray(callData)) {
              transactions.push(...callData);
            }
          } catch (error) {
            console.error('Error parsing call data:', error);
            throw new Error('Invalid call data received from Layerswap');
          }
        }
      }

      return transactions;
    } catch (error) {
      console.error('Layerswap bridge error:', error);
      throw error;
    }
  }

  private async waitForSwapCompletion(swapId: string, maxAttempts = 10): Promise<LayerswapSwapStatus> {
    let attempts = 0;
    const minDelay = 3000; // Minimum 3 seconds
    const maxDelay = 7000; // Maximum 7 seconds
    
    while (attempts < maxAttempts) {
      const status = await this.layerswapClient.getSwapStatus(swapId);
      
      if (status.status === 'completed') {
        return status;
      }
      if (status.status === 'failed' || status.status === 'cancelled') {
        throw new Error(`Swap ${status.status}`);
      }
      
      // Random delay between minDelay and maxDelay
      const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempts++;
      if (attempts === maxAttempts) {
        throw new Error('Swap verification timed out. Please check the status manually.');
      }
    }
    
    throw new Error('Swap timed out');
  }
}

class TransactionProcessor {
  private provider: Provider;
  private handlers: Record<string, BaseTransactionHandler>;

  constructor() {
    this.provider = new Provider({
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io"
    });
    
    this.handlers = {
      'swap': new SwapHandler(),
      'transfer': new TransferHandler(),
      'deposit': new NostraDepositHandler(),
      'withdraw': new NostraWithdrawHandler(),
      'bridge': new BridgeHandler()
    };
  }

  async processTransaction(response: BrianResponse): Promise<ProcessedTransaction> {
    try {
      const handler = this.handlers[response.action];
      if (!handler) {
        throw new Error(`Unsupported action: ${response.action}`);
      }

      const transactions = await handler.processSteps(response.data, response.extractedParams);

      return {
        success: true,
        description: response.data.description || `${response.action} transaction`,
        transactions,
        action: response.action,
        solver: response.solver,
        fromToken: response.data.fromToken,
        toToken: response.data.toToken,
        fromAmount: response.data.fromAmount,
        toAmount: response.data.toAmount,
        receiver: response.data.receiver,
        estimatedGas: "0",
        protocol: response.extractedParams?.protocol,
        bridge: response.data.bridge
      };
    } catch (error) {
      console.error('Transaction processing error:', error);
      throw error;
    }
  }
}

export const transactionProcessor = new TransactionProcessor();
