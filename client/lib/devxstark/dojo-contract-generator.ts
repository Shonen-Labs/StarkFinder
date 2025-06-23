import path from "path";
import { createDeepSeekClient, DeepSeekClient } from "./deepseek-client";
import { dojoContractPromptTemplate } from "./prompt-generate";
import fs from "fs/promises";
import type { BaseMessage } from "@langchain/core/messages";

interface DojoContractGenerationResult {
  success: boolean;
  sourceCode?: string;
  error?: string;
}

interface GenerateOptions {
  onProgress?: (chunk: string) => void;
}

export class DojoContractGenerator {
  private model: DeepSeekClient;

  constructor() {
    this.model = createDeepSeekClient();
  }

  async generateContract(
    requirements: string,
    options: GenerateOptions = {}
  ): Promise<DojoContractGenerationResult> {
    try {
      // Format the messages using LangChain's ChatPromptTemplate
      const messages = await dojoContractPromptTemplate.formatMessages({ requirements });
      
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

        return {
          success: true,
          sourceCode,
        };
      } else {
        // Use non-streaming for simpler cases
        const sourceCode = await this.model.chat(deepseekMessages);

        if (!sourceCode.trim()) {
          throw new Error("Generated source code is empty");
        }

        return {
          success: true,
          sourceCode,
        };
      }
    } catch (error) {
      console.error("Error generating Dojo contract:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async generateContractNonStreaming(
    requirements: string
  ): Promise<DojoContractGenerationResult> {
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

  async saveContract(
    sourceCode: string,
    contractName: string
  ): Promise<string> {
    if (!sourceCode?.trim()) {
      throw new Error("Cannot save empty contract source code");
    }

    const contractsDir = path.join(process.cwd(), "..", "contracts", "src");

    try {
      await fs.mkdir(contractsDir, { recursive: true });
      const filePath = path.join(contractsDir, `${contractName}.cairo`);
      await fs.writeFile(filePath, sourceCode);
      return filePath;
    } catch (error) {
      console.error("Error saving Dojo contract:", error);
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
    contractName: string,
    options: GenerateOptions = {}
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const result = await this.generateContract(requirements, options);
      
      if (!result.success || !result.sourceCode) {
        return {
          success: false,
          error: result.error || "Failed to generate Dojo contract"
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

  // Method to validate generated Dojo Cairo code
  validateDojoCode(sourceCode: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Dojo-specific validation
    if (!sourceCode.includes('#[dojo::contract]') && !sourceCode.includes('mod contract')) {
      issues.push("Missing Dojo contract definition (#[dojo::contract] or mod contract)");
    }
    
    if (!sourceCode.includes('#[dojo::model]') && !sourceCode.includes('dojo::model')) {
      issues.push("No Dojo models found - Dojo contracts typically need models");
    }
    
    if (!sourceCode.includes('use ')) {
      issues.push("No imports found - Dojo contracts typically need imports");
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