export type TransactionAction =
  | "swap"
  | "transfer"
  | "deposit"
  | "withdraw"
  | "bridge";

export interface TransactionStep {
  type: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  url?: string;
  error?: string;
  contractAddress?: string;
  entrypoint?: string;
  calldata?: string[];
}

export interface BrianStep {
  approve?: TransactionStep;
  transactionData?: TransactionStep;
  contractAddress?: string;
  entrypoint?: string;
  calldata?: string[];
}

export interface BrianToken {
  address: string;
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  chainId: string;
  name: string;
}

export interface BridgeConfig {
  source: NetworkConfig;
  destination: NetworkConfig;
  supportedTokens: {
    [key: string]: {
      sourceToken: string;
      destinationToken: string;
    };
  };
}

export interface LayerswapAction {
  call_data: string; // JSON string of TransactionStep[]
  chain_id: string;
  created_date: string;
  network: string;
  status: string;
  type: string;
}

export interface LayerswapSwapStatus {
  id: string;
  status: string;
  created_date: string;
  source_network: string;
  destination_network: string;
  source_token: string;
  destination_token: string;
  source_amount: number;
  destination_amount: number;
  source_address: string;
  destination_address: string;
  deposit_actions: LayerswapAction[];
}

export interface LayerswapSuccessResponse {
  data: LayerswapSwapStatus;
}

export interface LayerswapErrorResponse {
  errors?: Array<{
    code: string;
    message: string;
  }>;
  error?: string;
}

export interface LayerswapCreateSwapRequest {
  source_network: string;
  destination_network: string;
  source_token: string;
  destination_token: string;
  destination_address: string;
  amount: number;
  source_address?: string;
  use_deposit_address?: boolean;
}

export interface LayerswapRequest {
  sourceAddress: string;
  destinationAddress: string;
  sourceNetwork: string;
  destinationNetwork: string;
  sourceToken: string;
  destinationToken: string;
  amount: number;
}

export interface LayerswapRoutes {
  source_networks: string[];
  destination_networks: string[];
  tokens: {
    [network: string]: string[];
  };
}

export interface LayerswapError {
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface BridgeTransactionData {
  sourceAddress?: string;
  destinationAddress?: string;
  sourceNetwork?: string;
  destinationNetwork?: string;
  sourceToken?: string;
  destinationToken?: string;
  amount?: number;
  depositActions?: TransactionStep[];
}

export interface BrianTransactionData {
  type?: TransactionAction;
  description?: string;
  steps?: TransactionStep[];
  bridge?: BridgeTransactionData;
  fromToken?: BrianToken;
  toToken?: BrianToken;
  fromAmount?: string;
  toAmount?: string;
  receiver?: string;
  amountToApprove?: string;
  gasCostUSD?: string;
  protocol?: string;
}

export interface BrianResponse {
  solver: string;
  action: "swap" | "transfer" | "deposit" | "withdraw" | "bridge";
  type: "write";
  data: BrianTransactionData;
  extractedParams?: {
    [x: string]: string | undefined;
    action: string;
    token1: string;
    token2: string;
    chain: string;
    amount: string;
    protocol: string;
    address: string;
    dest_chain?: string;
    destinationChain?: string;
    destinationAddress?: string;
  };
}

export interface ProcessedTransaction {
  success: boolean;
  description: string;
  transactions: TransactionStep[];
  action: string;
  solver: string;
  fromToken?: BrianToken;
  toToken?: BrianToken;
  fromAmount?: string;
  toAmount?: string;
  receiver?: string;
  estimatedGas: string;
  protocol?: string;
  bridge?: BridgeTransactionData;
}

export interface NostraTokenAddresses {
  [key: string]: {
    token: string;
    iToken: string;
  };
}