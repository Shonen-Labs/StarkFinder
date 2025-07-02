/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/devxstark/scarb-generator.ts
import { createDeepSeekClient, DeepSeekClient } from "./deepseek-client";

interface ScarbDependency {
  name: string;
  version: string;
  path?: string;
  git?: string;
  branch?: string;
  tag?: string;
}

interface ScarbConfig {
  package: {
    name: string;
    version: string;
    edition?: string;
    cairo_version?: string;
    description?: string;
  };
  dependencies: Record<string, string | { [key: string]: string }>;
  dev_dependencies?: Record<string, string | { [key: string]: string }>;
  profile?: {
    [key: string]: any;
  };
}

export class ScarbGenerator {
  private model: DeepSeekClient;

  constructor() {
    this.model = createDeepSeekClient({
      temperature: 0.1, // Lower temperature for more deterministic output
    });
  }

  async generateScarbToml(
    sourceCode: string,
    contractName: string = "GeneratedContract"
  ): Promise<string> {
    try {
      // First, extract basic imports from the code
      const imports = this.extractImports(sourceCode);
      
      // Analyze the code to understand what it does
      const codeAnalysis = await this.analyzeCode(sourceCode);
      
      // Generate appropriate Scarb.toml based on the analysis
      const scarbConfig = await this.generateScarbConfig(
        sourceCode,
        contractName,
        imports,
        codeAnalysis
      );
      
      // Convert to TOML format
      return this.configToToml(scarbConfig);
    } catch (error) {
      console.error("Error generating Scarb.toml:", error);
      // Fallback to basic generation
      return this.generateBasicScarbToml(sourceCode, contractName);
    }
  }

  private extractImports(code: string): string[] {
    const importRegex = /use\s+([a-zA-Z0-9_:]+)(?:::\{([^}]+)\})?;/g;
    const matches = [...code.matchAll(importRegex)];
    
    return matches.flatMap((match) => {
      const base = match[1];
      const inner = match[2];
      
      if (inner) {
        return inner
          .split(",")
          .map((item) => `${base}::${item.trim()}`);
      }
      return [base];
    });
  }

  private async analyzeCode(sourceCode: string): Promise<string> {
    const prompt = `Analyze this Cairo smart contract and identify:
1. What type of contract it is (ERC20, ERC721, ERC1155, Game, DeFi, etc.)
2. Key features and functionality
3. Which standard libraries and external dependencies it needs
4. Recommended dependency versions for Cairo 2.8.0+

Contract code:
\`\`\`cairo
${sourceCode}
\`\`\`

Provide a concise analysis focusing on dependencies needed.`;

    return await this.model.complete(prompt);
  }

  private async generateScarbConfig(
    sourceCode: string,
    contractName: string,
    imports: string[],
    codeAnalysis: string
  ): Promise<ScarbConfig> {
    const prompt = `Based on this Cairo contract analysis and imports, generate a proper Scarb.toml configuration.

Contract Name: ${contractName}
Imports found: ${imports.join(", ")}
Code Analysis: ${codeAnalysis}

Generate a JSON object with the following structure:
{
  "package": {
    "name": "contract_name",
    "version": "0.1.0",
    "edition": "2024_07",
    "cairo_version": "2.8.0"
  },
  "dependencies": {
    "starknet": "2.8.0",
    "openzeppelin": { "git": "https://github.com/OpenZeppelin/cairo-contracts.git", "tag": "v0.15.0" }
  }
}

Rules:
1. Use appropriate versions for Cairo 2.8.0 compatibility
2. Include OpenZeppelin if ERC20/ERC721/Access control is detected
3. Include alexandria if advanced math/data structures are needed
4. Use semantic versioning
5. Return ONLY the JSON object, no markdown or explanation`;

    const response = await this.model.complete(prompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No valid JSON found in response");
    } catch (error) {
      console.error("Error parsing Scarb config:", error);
      // Return a sensible default
      return this.getDefaultScarbConfig(contractName, imports);
    }
  }

  private getDefaultScarbConfig(contractName: string, imports: string[]): ScarbConfig {
    const dependencies: Record<string, any> = {
      starknet: "2.8.0"
    };

    // Detect common dependencies from imports
    const importStr = imports.join(" ");
    
    if (importStr.includes("openzeppelin") || 
        importStr.includes("ERC20") || 
        importStr.includes("ERC721") ||
        importStr.includes("Ownable")) {
      dependencies.openzeppelin = {
        git: "https://github.com/OpenZeppelin/cairo-contracts.git",
        tag: "v0.15.0"
      };
    }

    if (importStr.includes("alexandria")) {
      dependencies.alexandria = {
        git: "https://github.com/keep-starknet-strange/alexandria.git",
        tag: "v0.1.0"
      };
    }

    return {
      package: {
        name: contractName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        version: "0.1.0",
        edition: "2024_07",
        cairo_version: "2.8.0"
      },
      dependencies
    };
  }

  private configToToml(config: ScarbConfig): string {
    let toml = "[package]\n";
    
    // Package section
    for (const [key, value] of Object.entries(config.package)) {
      toml += `${key} = "${value}"\n`;
    }
    
    // Dependencies section
    toml += "\n[dependencies]\n";
    for (const [name, value] of Object.entries(config.dependencies)) {
      if (typeof value === "string") {
        toml += `${name} = "${value}"\n`;
      } else {
        toml += `${name} = { `;
        const parts = Object.entries(value).map(([k, v]) => `${k} = "${v}"`);
        toml += parts.join(", ");
        toml += " }\n";
      }
    }
    
    // Dev dependencies if present
    if (config.dev_dependencies && Object.keys(config.dev_dependencies).length > 0) {
      toml += "\n[dev-dependencies]\n";
      for (const [name, value] of Object.entries(config.dev_dependencies)) {
        if (typeof value === "string") {
          toml += `${name} = "${value}"\n`;
        } else {
          toml += `${name} = { `;
          const parts = Object.entries(value).map(([k, v]) => `${k} = "${v}"`);
          toml += parts.join(", ");
          toml += " }\n`;"
        }
      }
    }
    
    // Cairo configuration
    toml += "\n[[target.starknet-contract]]\n";
    toml += 'sierra = true\n';
    toml += 'casm = true\n';
    toml += '\n[cairo]\n';
    toml += 'sierra-replace-ids = true\n';
    
    return toml;
  }

  private generateBasicScarbToml(sourceCode: string, contractName: string): string {
    const imports = this.extractImports(sourceCode);
    const config = this.getDefaultScarbConfig(contractName, imports);
    return this.configToToml(config);
  }
}

// Export a singleton instance
export const scarbGenerator = new ScarbGenerator();