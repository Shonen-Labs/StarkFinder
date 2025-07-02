/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * AI Model Types
 */
type AIModel = "deepseek" | "claude" | "openai";

/**
 * Flow Summary Types
 */
export interface FlowSummaryItem {
  content: any;
  id: string;
}

/**
 * Deployment Status Types
 */
export type DeploymentStatus = "pending" | "processing" | "complete" | "error";

/**
 * Deployment Step Types
 */
export interface DeploymentStep {
  title: string;
  status: DeploymentStatus;
  details?: string;
  hash?: string;
}

/**
 * Deployment Response Types
 */
export interface DeploymentResponse {
  success: boolean;
  contractAddress?: string;
  classHash?: string;
  transactionHash?: string;
  error?: string;
  details?: string;
  title?: string;
  casmHash?: string;
}

/**
 * AI Chat Response Types
 */
export interface AIChatResponse {
  response: string;
  provider: AIModel;
}

/**
 * Error Response Types
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}

export type {
  AIModel
};
