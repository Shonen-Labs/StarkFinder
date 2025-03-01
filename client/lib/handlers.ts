/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from 'starknet';
import { 
  TransactionStep, 
  BrianTransactionData, 
  BrianResponse, 
  ProcessedTransaction,
  BrianToken
} from './transaction/types';

abstract class BaseTransactionHandler {
  abstract processSteps(data: BrianTransactionData, params?: any): TransactionStep[];
}

class SwapHandler extends BaseTransactionHandler {
  processSteps(data: BrianTransactionData): TransactionStep[] {
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
  processSteps(data: BrianTransactionData): TransactionStep[] {
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
  processSteps(data: BrianTransactionData, params?: any): TransactionStep[] {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra deposit');
    }

    const token = params.token1.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token for Nostra deposit: ${params.token1}`);
    }

    const amountWithDecimals = (BigInt(params.amount) * BigInt(10 ** 18)).toString();

    return [
      {
        contractAddress: addresses.token,
        entrypoint: 'approve',
        calldata: [addresses.iToken, amountWithDecimals, '0']
      },
      {
        contractAddress: addresses.iToken,
        entrypoint: 'mint',
        calldata: [params.address || '0x0', amountWithDecimals, '0']
      }
    ];
  }
}

class NostraWithdrawHandler extends NostraBaseHandler implements BaseTransactionHandler {
  processSteps(data: BrianTransactionData, params?: any): TransactionStep[] {
    if (!params?.amount || !params?.token1 || params?.protocol?.toLowerCase() !== 'nostra') {
      throw new Error('Missing required parameters for Nostra withdraw');
    }

    const token = params.token1.toLowerCase();
    const addresses = this.TOKENS[token];

    if (!addresses) {
      throw new Error(`Unsupported token for Nostra withdraw: ${params.token1}`);
    }

    const amountWithDecimals = (BigInt(params.amount) * BigInt(10 ** 18)).toString();

    return [
      {
        contractAddress: addresses.iToken,
        entrypoint: 'burn',
        calldata: [
          params.address || '0x0',
          params.address || '0x0',
          amountWithDecimals,
          '0'
        ]
      }
    ];
  }
}

// lib/transaction/processor.ts
export class TransactionProcessor {
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
      'withdraw': new NostraWithdrawHandler()
    };
  }

  async processTransaction(response: BrianResponse): Promise<ProcessedTransaction> {
    try {
      if (!response.extractedParams?.protocol && ['deposit', 'withdraw'].includes(response.action)) {
        throw new Error('Protocol must be specified for deposits and withdrawals');
      }

      const handler = this.handlers[response.action];
      if (!handler) {
        throw new Error(`Unsupported action type: ${response.action}`);
      }

      const transactions = handler.processSteps(response.data, response.extractedParams);

      let fromToken, toToken;
      if (['deposit', 'withdraw'].includes(response.action) && response.extractedParams?.protocol === 'nostra') {
        const nostraHandler = handler as unknown as NostraBaseHandler;
        if (response.action === 'deposit') {
          fromToken = nostraHandler.getTokenDetails(response.extractedParams.token1);
          toToken = nostraHandler.getTokenDetails(response.extractedParams.token1, true);
        } else {
          fromToken = nostraHandler.getTokenDetails(response.extractedParams.token1, true);
          toToken = nostraHandler.getTokenDetails(response.extractedParams.token1);
        }
      }

      return {
        success: true,
        description: response.data.description,
        transactions,
        action: response.action,
        solver: response.solver,
        fromToken,
        toToken,
        fromAmount: response.extractedParams?.amount,
        toAmount: response.extractedParams?.amount,
        receiver: response.extractedParams?.address,
        estimatedGas: '0',
        protocol: response.extractedParams?.protocol
      };
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  }
}

export const transactionProcessor = new TransactionProcessor();
