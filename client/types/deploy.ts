export interface CompilationResult {
  success: boolean;
  contracts: string[];
  error?: string;
  errorLog?: string;
}
