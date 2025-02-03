export interface TransactionStep {
  type: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  url?: string;
  error?: string;
}
