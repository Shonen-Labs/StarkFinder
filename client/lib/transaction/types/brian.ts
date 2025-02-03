export interface BrianTransactionData {
  description: string;
  steps: any[];
  bridge?: {
    sourceNetwork: string;
    destinationNetwork: string;
    sourceToken: string;
    destinationToken: string;
    amount: number;
    sourceAddress: string;
    destinationAddress: string;
  };
}
