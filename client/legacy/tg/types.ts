/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Message {
    role: string;
    id: string;
    content: string;
    timestamp: string;
    user: string;
    transaction?: {
      data: {
        transactions: Array<{
          contractAddress: string;
          entrypoint: string;
          calldata: string[];
        }>;
        fromToken?: any;
        toToken?: any;
        fromAmount?: string;
        toAmount?: string;
        receiver?: string;
        gasCostUSD?: string;
        solver?: string;
      };
      type: string;
    };
  }
  
  export interface MessageContentProps {
    message: Message;
    onTransactionSuccess: (hash: string) => void;
  }
  