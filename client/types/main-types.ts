/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FlowSummaryItem {
  content: any;
  id: string;
}

export interface DeploymentStep {
  title: string;
  status: "pending" | "processing" | "complete" | "error";
  details?: string;
  hash?: string;
}

export interface DeploymentResponse {
  success: boolean;
  contractAddress?: string;
  classHash?: string;
  transactionHash?: string;
  error?: string;
  details?: string;
  title?: string;
}
