import path from "path";
import { createAnthropicClient } from "./anthropic-client";
import { contractPromptTemplate } from "./prompt-generate";
import { StringOutputParser } from "@langchain/core/output_parsers";
import fs from "fs/promises";

const parser = new StringOutputParser();

interface ContractGenerationResult {
  success: boolean;
  sourceCode?: string;
  error?: string;
}

interface GenerateOptions {
  onProgress?: (chunk: string) => void;
}

export class CairoContractGenerator {
  private model = createAnthropicClient();
  private chain = contractPromptTemplate.pipe(this.model).pipe(parser);

  async generateContract(
    requirements: string,
    options: GenerateOptions = {}
  ): Promise<ContractGenerationResult> {
    try {
      const stream = await this.chain.stream(requirements);
      const chunks: string[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
        if (options.onProgress) {
          options.onProgress(chunk);
        }
      }

      const sourceCode = chunks.join("");

      if (!sourceCode.trim()) {
        throw new Error("Generated source code is empty");
      }

      return {
        success: true,
        sourceCode,
      };
    } catch (error) {
      console.error("Error generating contract:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
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
      console.error("Error saving contract:", error);
      throw new Error(
        `Failed to save contract: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
