/* eslint-disable @typescript-eslint/no-explicit-any */
export type TransactionAction =
  | "swap"
  | "transfer"
  | "deposit"
  | "withdraw"
  | "bridge";

export interface TransactionStep {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
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

export interface BridgeTransactionData {
  sourceNetwork: string;
  destinationNetwork: string;
  sourceToken: string;
  destinationToken: string;
  amount: number;
  sourceAddress: string;
  destinationAddress: string;
  depositActions?: TransactionStep[];
}

export interface BrianTransactionData {
  description: string;
  steps: BrianStep[];
  fromToken?: BrianToken;
  toToken?: BrianToken;
  fromAmount?: string;
  toAmount?: string;
  receiver?: string;
  amountToApprove?: string;
  gasCostUSD?: string;
  protocol?: string;
  bridge?: BridgeTransactionData;
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

// lib/layerswap/types.ts
export interface LayerswapRequest {
  sourceAddress: string;
  destinationAddress: string;
  sourceNetwork: string;
  destinationNetwork: string;
  sourceToken: string;
  destinationToken: string;
  amount: number;
}

export interface LayerswapErrorResponse {
  errors?: Array<{
    code: string;
    message: string;
  }>;
  error?: string;
}

export interface LayerswapCreateSwapRequest {
  source: string;
  destination: string;
  amount: number;
  source_asset: string;
  destination_asset: string;
  destination_address: string;
  refuel: boolean;
  reference_id?: string;
  source_address?: string;
  use_deposit_address?: boolean;
}

export interface LayerswapCreateSwapResponse {
  data: {
    swap_id: string;
  };
  error: null | {
    message: string;
  };
}

export interface LayerswapResponse {
  data: {
    quote: LayerswapQuote;
    refuel: LayerswapRefuel | null;
    reward: LayerswapReward | null;
    deposit_actions: LayerswapAction[];
    swap: LayerswapSwap;
  };
}

export interface LayerswapError {
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LayerswapNetwork {
  tokens?: LayerswapToken[];
  name: string;
  display_name: string;
  chain_id: string;
  token: LayerswapToken;
  transaction_explorer_template: string;
  type: string;
  metadata?: Record<string, string>;
  deposit_methods?: Record<string, string>;
}

export interface LayerswapLimit {
  min_amount_in_usd: number;
  min_amount: number;
  max_amount_in_usd: number;
  max_amount: number;
}

export interface LayerswapQuoteResponse {
  quote: LayerswapQuote;
  refuel: LayerswapRefuel | null;
  reward: LayerswapReward | null;
}

export interface LayerswapRefuel {
  token: LayerswapToken;
  network: LayerswapNetwork;
  amount: number;
  amount_in_usd: number;
}

export interface LayerswapReward {
  token: LayerswapToken;
  network: LayerswapNetwork;
  amount: number;
  amount_in_usd: number;
}

export interface LayerswapSwap {
  id: string;
  created_date: string;
  source_network: LayerswapNetwork;
  source_token: LayerswapToken;
  source_exchange: LayerswapExchange;
  destination_network: LayerswapNetwork;
  destination_token: LayerswapToken;
  destination_exchange: LayerswapExchange;
  requested_amount: number;
  destination_address: string;
  status: string;
  fail_reason: string;
  use_deposit_address: string;
  deposit_methods?: Record<string, string>;
  transactions: LayerswapTransaction[];
}

export interface LayerswapTransaction {
  from: string;
  to: string;
  timestamp: string;
  transaction_hash: string;
  confirmations: number;
  max_confirmations: number;
  amount: number;
  type: string;
  status: string;
  token: LayerswapToken;
  network: LayerswapNetwork;
}

export interface LayerswapExchange {
  name: string;
  display_name: string;
  deposit_methods?: Record<string, any>;
}

export interface LayerswapAction {
  call_data?: string;
  chain_id: string;
  created_date: string;
  network: LayerswapNetwork;
  status: string;
  type: string;
  to_address: string;
  amount: number;
  order: number;
  token: LayerswapToken;
  fee_token: LayerswapToken;
}

export interface LayerswapQuote {
  source_network: LayerswapNetwork;
  source_token: LayerswapToken;
  destination_network: LayerswapNetwork;
  destination_token: LayerswapToken;
  receive_amount: number;
  min_receive_amount: number;
  blockchain_fee: number;
  service_fee: number;
  avg_completion_time: string;
  slippage: number;
  total_fee?: number;
  total_fee_in_usd?: number;
}

export interface LayerswapToken {
  symbol: string;
  decimals: number;
  contract: string;
  price_in_usd: string;
}
