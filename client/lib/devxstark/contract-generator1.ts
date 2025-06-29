// lib/devxstark/contract-generator1.ts
import path from "path";
import { contractPromptTemplate } from "./prompt-generate";
import fs from "fs/promises";
import { DeepSeekClient, createDeepSeekClient } from "./deepseek-client";
import type { BaseMessage } from "@langchain/core/messages";

interface ContractGenerationResult {
  success: boolean;
  sourceCode?: string;
  error?: string;
}

interface GenerateOptions {
  onProgress?: (chunk: string) => void;
}

export class CairoContractGenerator {
  private model: DeepSeekClient;

  constructor() {
    this.model = createDeepSeekClient({
      model: 'deepseek-coder',
      temperature: 0.2,
      maxTokens: 4000
    });
  }

  async generateContract(
    requirements: string,
    options: GenerateOptions = {}
  ): Promise<ContractGenerationResult> {
    try {
      // Format the messages using LangChain's ChatPromptTemplate
      const messages = await contractPromptTemplate.formatMessages({ requirements });
      
      // Convert LangChain messages to our DeepSeek format
      const deepseekMessages = this.convertLangChainMessages(messages);
      
      if (options.onProgress) {
        // Use streaming to get real-time updates
        const stream = await this.model.chatStream(deepseekMessages);
        const reader = stream.getReader();
        const chunks: string[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            chunks.push(value);
            if (options.onProgress) {
              options.onProgress(value);
            }
          }
        } finally {
          reader.releaseLock();
        }

        const sourceCode = chunks.join("");

        if (!sourceCode.trim()) {
          throw new Error("Generated source code is empty");
        }

        // Clean up the generated code
        const cleanedCode = this.cleanGeneratedCode(sourceCode);

        return {
          success: true,
          sourceCode: cleanedCode,
        };
      } else {
        // Use non-streaming for simpler cases
        const sourceCode = await this.model.chat(deepseekMessages);

        if (!sourceCode.trim()) {
          throw new Error("Generated source code is empty");
        }

        // Clean up the generated code
        const cleanedCode = this.cleanGeneratedCode(sourceCode);

        return {
          success: true,
          sourceCode: cleanedCode,
        };
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async generateContractNonStreaming(
    requirements: string
  ): Promise<ContractGenerationResult> {
    return this.generateContract(requirements, {});
  }

  private convertLangChainMessages(messages: BaseMessage[]) {
    return messages.map(message => {
      // Handle different message types
      const messageType = message._getType();
      let role: 'system' | 'user' | 'assistant';
      
      switch (messageType) {
        case 'system':
          role = 'system';
          break;
        case 'human':
          role = 'user';
          break;
        case 'ai':
          role = 'assistant';
          break;
        default:
          role = 'user'; // Fallback
      }

      return {
        role,
        content: typeof message.content === 'string' ? message.content : String(message.content)
      };
    });
  }

  private cleanGeneratedCode(sourceCode: string): string {
    // Remove markdown code blocks if present
    let cleaned = sourceCode.replace(/```(?:cairo|rust)?\n?/g, '');
    cleaned = cleaned.replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Ensure proper formatting
    return cleaned;
  }

  async saveContract(
    sourceCode: string,
    contractName: string = "lib"
  ): Promise<string> {
    if (!sourceCode?.trim()) {
      throw new Error("Cannot save empty contract source code");
    }
  
    const contractsDir = path.join(process.cwd(), "..", "contracts", "src");
  
    try {
      // Ensure the directory exists
      await fs.mkdir(contractsDir, { recursive: true });
      
      // Create the full file path with .cairo extension
      const filePath = path.join(contractsDir, `${contractName}.cairo`);

      // Check if file exists and get its stats
      let fileExists = false;
      try {
        await fs.access(filePath);
        fileExists = true;
      } catch {
        // File doesn't exist
      }
      
      if (fileExists) {
        // If file exists, explicitly clear it by writing an empty string first
        await fs.writeFile(filePath, '', { encoding: 'utf8', flag: 'w' });
      }
      
      // Now write the actual content
      await fs.writeFile(filePath, sourceCode, { 
        encoding: 'utf8',
        flag: 'w' // Ensures we start from the beginning
      });
      
      // Verify the file was written correctly
      const writtenContent = await fs.readFile(filePath, 'utf8');
      if (writtenContent !== sourceCode) {
        throw new Error('File content verification failed');
      }
      
      console.log(`Contract saved successfully to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error("Error saving contract:", error);
      throw new Error(
        `Failed to save contract: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Utility method to generate and save in one step
  async generateAndSaveContract(
    requirements: string,
    contractName: string = "lib",
    options: GenerateOptions = {}
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const result = await this.generateContract(requirements, options);
      
      if (!result.success || !result.sourceCode) {
        return {
          success: false,
          error: result.error || "Failed to generate contract"
        };
      }

      const filePath = await this.saveContract(result.sourceCode, contractName);
      
      return {
        success: true,
        filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  // Method to validate generated Cairo code (basic validation)
  validateCairoCode(sourceCode: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Basic Cairo contract validation
    if (!sourceCode.includes('#[starknet::contract]') && !sourceCode.includes('mod contract')) {
      issues.push("Missing contract definition (#[starknet::contract] or mod contract)");
    }
    
    if (!sourceCode.includes('use ')) {
      issues.push("No imports found - Cairo contracts typically need imports");
    }
    
    // Check for balanced braces
    const openBraces = (sourceCode.match(/{/g) || []).length;
    const closeBraces = (sourceCode.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push("Unbalanced braces in generated code");
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Utility method for simple completions
  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return await this.model.chat(messages);
  }
}

export default CairoContractGenerator;