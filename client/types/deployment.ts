// types/deployment.ts
export interface CompilationResult {
  success: boolean;
  contracts: string[];
  error?: string;
  errorLog?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface DeploymentRequest {
  contractName?: string;
  userId?: string;
  sourceCode: string;
  scarbToml: string;
  constructorArgs?: string;
}

export interface DeploymentResponse {
  success: boolean;
  contractAddress?: string;
  classHash?: string;
  casmHash?: string;
  transactionHash?: string;
  error?: string;
  details?: string;
  errorLog?: string;
}

export interface CompiledContract {
  sierraCode: any;
  casmCode: any
}

export interface ContractPattern {
  pattern: RegExp;
  message: string;
}

export interface SyntaxCheck {
  pattern: RegExp;
  counterPattern: RegExp;
  message: string;
}