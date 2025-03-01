// lib/transaction/processor.ts
import { Provider } from 'starknet';
import { BrianResponse, ProcessedTransaction, BrianTransactionData, TransactionAction } from './types';
import { STARKNET_RPC_URL } from './config';
import {
  SwapHandler,
  TransferHandler,
  NostraDepositHandler,
  NostraWithdrawHandler,
  BridgeHandler,
  BaseTransactionHandler
} from './handlers';

export class TransactionProcessor {
  private provider: Provider;
  private handlers: Record<string, BaseTransactionHandler>;

  constructor() {
    this.provider = new Provider({ nodeUrl: STARKNET_RPC_URL });
    
    this.handlers = {
      'swap': new SwapHandler(),
      'transfer': new TransferHandler(),
      'deposit': new NostraDepositHandler(),
      'withdraw': new NostraWithdrawHandler(),
      'bridge': new BridgeHandler(process.env.LAYERSWAP_API_KEY || '')
    };
  }

  validateBrianResponse(response: BrianResponse): void {
    if (!response) {
      throw new Error('Invalid response: Response is null or undefined');
    }

    if (!response.action) {
      throw new Error('Invalid response: Missing action');
    }

    // For deposit/withdraw, validate required parameters
    if (['deposit', 'withdraw'].includes(response.action)) {
      if (!response.extractedParams?.protocol) {
        throw new Error(`${response.action} requires a protocol parameter`);
      }

      if (!response.extractedParams.token1) {
        throw new Error(`${response.action} requires a token parameter`);
      }

      if (!response.extractedParams.amount) {
        throw new Error(`${response.action} requires an amount parameter`);
      }
    } else if (response.action === 'bridge') {

      if (!response.extractedParams?.token1) {
        throw new Error('Bridge requires a source token parameter');
      }
      if (!response.extractedParams?.token2) {
        throw new Error('Bridge requires a destination token parameter');
      }
      if (!response.extractedParams?.chain) {
        throw new Error('Bridge requires a source chain parameter');
      }
      if (!response.extractedParams?.dest_chain) {
        throw new Error('Bridge requires a destination chain parameter');
      }
      if (!response.extractedParams?.amount) {
        throw new Error('Bridge requires an amount parameter');
      }
    } else {
      // For other actions, validate data and steps
      if (!response.data?.steps) {
        throw new Error('Invalid response: Missing steps array');
      }
    }
  }

  generateDescription(response: BrianResponse): string {
    const params = response.extractedParams;
    const action: TransactionAction = response.action;

    switch (action) {
      case 'bridge':
        return `Bridge ${params?.amount} ${params?.token1?.toUpperCase()} from ${params?.chain?.toUpperCase()} to ${params?.token2?.toUpperCase()} on ${params?.dest_chain?.toUpperCase()}`;
      case 'deposit':
        return `Deposit ${params?.amount} ${params?.token1?.toUpperCase()} to ${params?.protocol?.toUpperCase()}`;
      case 'withdraw':
        return `Withdraw ${params?.amount} ${params?.token1?.toUpperCase()} from ${params?.protocol?.toUpperCase()}`;
      case 'transfer':
        return `Transfer ${params?.amount} ${params?.token1?.toUpperCase()} to ${params?.address}`;
      case 'swap':
        return `Swap ${params?.amount} ${params?.token1?.toUpperCase()} for ${params?.token2?.toUpperCase()}`;
      default: {
        const actionStr = (action as string).toString();
        return `${actionStr.charAt(0).toUpperCase() + actionStr.slice(1)} transaction`;
      }
    }
  }

  createTransactionData(response: BrianResponse): BrianTransactionData {
    const action: TransactionAction = response.action;

    if (['deposit', 'withdraw'].includes(action) && response.extractedParams) {
      return {
        description: this.generateDescription(response),
        steps: [],
        fromAmount: response.extractedParams.amount,
        toAmount: response.extractedParams.amount,
        receiver: response.extractedParams.address,
        protocol: response.extractedParams.protocol
      };
    }

    if (action === 'bridge' && response.extractedParams) {
      const params = response.extractedParams;
      return {
        description: this.generateDescription(response),
        steps: [],
        fromAmount: params.amount,
        toAmount: params.amount,
        bridge: {
          sourceNetwork: params.chain,
          destinationNetwork: params.dest_chain || '',
          sourceToken: params.token1,
          destinationToken: params.token2,
          amount: parseFloat(params.amount),
          sourceAddress: params.address || '',
          destinationAddress: params.destinationAddress || params.address || ''
        }
      };
    }

    return response.data;
  }


  async processTransaction(response: BrianResponse): Promise<ProcessedTransaction> {
    try {
      this.validateBrianResponse(response);

      const handler = this.handlers[response.action];
      if (!handler) {
        throw new Error(`Unsupported action type: ${response.action}`);
      }


      const transactionData = this.createTransactionData(response);


      const transactions = await handler.processSteps(transactionData, response.extractedParams);


      const description = this.generateDescription(response);

      return {
        success: true,
        description,
        transactions,
        action: response.action,
        solver: response.solver,
        fromToken: transactionData.fromToken,
        toToken: transactionData.toToken,
        fromAmount: response.extractedParams?.amount,
        toAmount: response.extractedParams?.amount,
        receiver: response.extractedParams?.address,
        estimatedGas: '0',
        protocol: response.extractedParams?.protocol,
        bridge: transactionData.bridge // Include bridge data if present
      };
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  }
}

export const transactionProcessor = new TransactionProcessor();
