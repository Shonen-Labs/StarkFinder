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

// Enhanced dependency mapping with proper versions and compatibility
interface DependencyInfo {
  name: string;
  version?: string;
  git?: string;
  tag?: string;
  branch?: string;
  patterns: string[];
  cairoVersions: string[];
  description: string;
}

// Comprehensive dependency database
const DEPENDENCY_DATABASE: DependencyInfo[] = [
  {
    name: "starknet",
    version: "2.8.0",
    patterns: ["starknet", "ContractAddress", "ClassHash", "StorageAccess"],
    cairoVersions: ["2.8.0", "2.9.0", "2.9.1", "2.9.2", "2.9.3", "2.9.4"],
    description: "Core Starknet library"
  },
  {
    name: "openzeppelin",
    git: "https://github.com/OpenZeppelin/cairo-contracts.git",
    tag: "v0.15.0",
    patterns: [
      "openzeppelin", "ERC20", "ERC721", "ERC1155", "Ownable", "AccessControl",
      "Pausable", "ReentrancyGuard", "Upgradeable", "IERC20", "IERC721", "IERC1155"
    ],
    cairoVersions: ["2.8.0", "2.9.0", "2.9.1", "2.9.2", "2.9.3", "2.9.4"],
    description: "OpenZeppelin Cairo contracts for secure smart contract development"
  },
  {
    name: "alexandria_storage",
    git: "https://github.com/keep-starknet-strange/alexandria.git",
    tag: "v0.1.0",
    patterns: ["alexandria_storage", "List", "Vec"],
    cairoVersions: ["2.8.0", "2.9.0", "2.9.1", "2.9.2", "2.9.3", "2.9.4"],
    description: "Alexandria storage utilities"
  },
  {
    name: "alexandria_math",
    git: "https://github.com/keep-starknet-strange/alexandria.git",
    tag: "v0.1.0",
    patterns: ["alexandria_math", "pow", "sqrt", "fast_power"],
    cairoVersions: ["2.8.0", "2.9.0", "2.9.1", "2.9.2", "2.9.3", "2.9.4"],
    description: "Alexandria math utilities"
  },
  {
    name: "alexandria_data_structures",
    git: "https://github.com/keep-starknet-strange/alexandria.git",
    tag: "v0.1.0",
    patterns: ["alexandria_data_structures", "array_ext", "queue", "stack"],
    cairoVersions: ["2.8.0", "2.9.0", "2.9.1", "2.9.2", "2.9.3", "2.9.4"],
    description: "Alexandria data structures"
  },
  {
    name: "snforge_std",
    version: "0.39.0",
    patterns: ["snforge_std", "declare", "deploy", "start_prank", "stop_prank"],
    cairoVersions: ["2.8.0", "2.9.0", "2.9.1", "2.9.2", "2.9.3", "2.9.4"],
    description: "Starknet Foundry standard library for testing"
  }
];

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
    const imports: string[] = [];

    // Enhanced regex patterns for different import styles
    const patterns = [
      // Standard use statements: use path::to::module;
      /use\s+([a-zA-Z0-9_:]+)(?:::\{([^}]+)\})?;/g,
      // Direct imports: use path::to::{Item1, Item2};
      /use\s+([a-zA-Z0-9_:]+)::\{([^}]+)\};/g,
      // Single item imports: use path::to::Item;
      /use\s+([a-zA-Z0-9_:]+);/g,
      // Super imports: use super::something;
      /use\s+super::([a-zA-Z0-9_:]+);/g,
      // Crate imports: use crate::something;
      /use\s+crate::([a-zA-Z0-9_:]+);/g
    ];

    patterns.forEach(pattern => {
      const matches = [...code.matchAll(pattern)];
      matches.forEach(match => {
        const base = match[1];
        const inner = match[2];

        if (inner) {
          // Handle grouped imports like {Item1, Item2, Item3}
          inner.split(',').forEach(item => {
            const trimmed = item.trim();
            if (trimmed) {
              imports.push(`${base}::${trimmed}`);
            }
          });
        } else if (base) {
          imports.push(base);
        }
      });
    });

    // Also extract from trait implementations and struct definitions
    const traitImplRegex = /impl\s+([a-zA-Z0-9_:]+)/g;
    const traitMatches = [...code.matchAll(traitImplRegex)];
    traitMatches.forEach(match => {
      if (match[1] && match[1].includes('::')) {
        imports.push(match[1]);
      }
    });

    // Extract from function signatures and type annotations
    const typeRegex = /@([a-zA-Z0-9_:]+)|:\s*([a-zA-Z0-9_:]+)/g;
    const typeMatches = [...code.matchAll(typeRegex)];
    typeMatches.forEach(match => {
      const type = match[1] || match[2];
      if (type && type.includes('::')) {
        imports.push(type);
      }
    });

    // Remove duplicates and filter out invalid imports
    return Array.from(new Set(imports))
      .filter(imp => imp && imp.length > 0 && !imp.startsWith('_'))
      .sort();
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

  /**
   * Analyze imports and code to determine required dependencies
   */
  private analyzeDependencies(imports: string[], sourceCode: string): DependencyInfo[] {
    const requiredDeps: DependencyInfo[] = [];
    const codeContent = sourceCode.toLowerCase();
    const importContent = imports.join(' ').toLowerCase();

    // Always include starknet as base dependency
    const starknetDep = DEPENDENCY_DATABASE.find(dep => dep.name === 'starknet');
    if (starknetDep) {
      requiredDeps.push(starknetDep);
    }

    // Check each dependency in our database
    DEPENDENCY_DATABASE.forEach(dep => {
      if (dep.name === 'starknet') return; // Already added

      // Check if any patterns match in imports or code
      const hasPattern = dep.patterns.some(pattern =>
        importContent.includes(pattern.toLowerCase()) ||
        codeContent.includes(pattern.toLowerCase())
      );

      if (hasPattern) {
        requiredDeps.push(dep);
      }
    });

    // Special handling for OpenZeppelin - if we detect any ERC patterns, include it
    const hasErcPattern = /\b(erc20|erc721|erc1155|ierc20|ierc721|ierc1155)\b/i.test(sourceCode);
    const hasOzPattern = /\bopenzeppelin\b/i.test(sourceCode);
    const hasOwnable = /\bownable\b/i.test(sourceCode);
    const hasAccessControl = /\baccess_?control\b/i.test(sourceCode);

    if ((hasErcPattern || hasOzPattern || hasOwnable || hasAccessControl) &&
        !requiredDeps.some(dep => dep.name === 'openzeppelin')) {
      const ozDep = DEPENDENCY_DATABASE.find(dep => dep.name === 'openzeppelin');
      if (ozDep) {
        requiredDeps.push(ozDep);
      }
    }

    // Special handling for testing dependencies
    const hasTestPattern = /\b(test|assert|declare|deploy|start_prank|stop_prank)\b/i.test(sourceCode);
    if (hasTestPattern && !requiredDeps.some(dep => dep.name === 'snforge_std')) {
      const testDep = DEPENDENCY_DATABASE.find(dep => dep.name === 'snforge_std');
      if (testDep) {
        requiredDeps.push(testDep);
      }
    }

    return requiredDeps;
  }

  private async generateScarbConfig(
    sourceCode: string,
    contractName: string,
    imports: string[],
    codeAnalysis: string
  ): Promise<ScarbConfig> {
    // First try our enhanced local analysis
    const localConfig = this.getDefaultScarbConfig(contractName, imports, sourceCode);

    // Validate the dependencies are compatible
    const requiredDeps = this.analyzeDependencies(imports, sourceCode);
    if (!this.validateDependencyCompatibility(requiredDeps)) {
      console.warn("Dependency compatibility issues detected, using fallback");
      return localConfig;
    }

    // Enhanced prompt with better context
    const dependencyContext = requiredDeps.map(dep =>
      `${dep.name}: ${dep.description}`
    ).join('\n');

    const prompt = `You are a Cairo smart contract tooling assistant specializing in Scarb.toml generation.

      ## Contract Analysis
      - Contract Name: ${contractName}
      - Cairo Version: 2.8.0
      - Detected Imports: ${imports.slice(0, 20).join(", ")}${imports.length > 20 ? '...' : ''}
      - Required Dependencies Based on Analysis:
      ${dependencyContext}

      ## Code Analysis
      ${codeAnalysis}

      ## Available Dependencies Database
      ${DEPENDENCY_DATABASE.map(dep =>
        `${dep.name}: ${dep.version || `${dep.git} (${dep.tag || dep.branch})`}`
      ).join('\n')}

      ## Task
      Generate a complete Scarb.toml configuration as JSON that:
      1. Uses the exact dependency versions/sources from the database above
      2. Includes only dependencies that are actually needed
      3. Ensures all dependencies are compatible with Cairo 2.8.0
      4. Follows proper TOML naming conventions

      ## Output Format (JSON only, no explanations)
      {
        "package": {
          "name": "<sanitized_contract_name>",
          "version": "0.1.0",
          "edition": "2024_07",
          "cairo_version": "2.8.0",
          "description": "<brief_description>"
        },
        "dependencies": {
          "<dep_name>": "<version_or_git_object>"
        }
      }
    `;

    try {
      const response = await this.model.complete(prompt);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiConfig = JSON.parse(jsonMatch[0]);

        // Validate and merge with local analysis
        const mergedConfig = this.mergeConfigs(localConfig, aiConfig);
        return mergedConfig;
      }
      throw new Error("No valid JSON found in AI response");
    } catch (error) {
      console.error("Error generating AI Scarb config:", error);
      // Return our enhanced local analysis as fallback
      return localConfig;
    }
  }

  /**
   * Merge local analysis with AI-generated config, preferring local analysis for reliability
   */
  private mergeConfigs(localConfig: ScarbConfig, aiConfig: ScarbConfig): ScarbConfig {
    const merged: ScarbConfig = {
      package: {
        ...localConfig.package,
        description: aiConfig.package.description || localConfig.package.description
      },
      dependencies: { ...localConfig.dependencies }
    };

    // Add any additional dependencies from AI that we recognize
    Object.entries(aiConfig.dependencies).forEach(([name, value]) => {
      const knownDep = DEPENDENCY_DATABASE.find(dep => dep.name === name);
      if (knownDep && !merged.dependencies[name]) {
        merged.dependencies[name] = value;
      }
    });

    return merged;
  }

  private getDefaultScarbConfig(
    contractName: string,
    imports: string[],
    sourceCode?: string
  ): ScarbConfig {
    const dependencies: Record<string, any> = {};

    // Use enhanced dependency analysis
    const requiredDeps = this.analyzeDependencies(imports, sourceCode || '');

    // Convert dependency info to scarb format
    requiredDeps.forEach(dep => {
      if (dep.version) {
        dependencies[dep.name] = dep.version;
      } else if (dep.git && dep.tag) {
        dependencies[dep.name] = {
          git: dep.git,
          tag: dep.tag
        };
      } else if (dep.git && dep.branch) {
        dependencies[dep.name] = {
          git: dep.git,
          branch: dep.branch
        };
      }
    });

    // Ensure we have at least starknet dependency
    if (!dependencies.starknet) {
      dependencies.starknet = "2.8.0";
    }

    return {
      package: {
        name: contractName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        version: "0.1.0",
        edition: "2024_07",
        cairo_version: "2.8.0",
        description: `Generated Cairo contract: ${contractName}`
      },
      dependencies,
    };
  }

  private configToToml(config: ScarbConfig): string {
    let toml = "[package]\n";

    // Package section
    for (const [key, value] of Object.entries(config.package)) {
      if (value !== undefined && value !== null) {
        toml += `${key} = "${value}"\n`;
      }
    }

    // Dependencies section
    toml += "\n[dependencies]\n";
    for (const [name, value] of Object.entries(config.dependencies)) {
      if (typeof value === "string") {
        toml += `${name} = "${value}"\n`;
      } else if (typeof value === "object" && value !== null) {
        toml += `${name} = { `;
        const parts = Object.entries(value).map(([k, v]) => `${k} = "${v}"`);
        toml += parts.join(", ");
        toml += " }\n";
      }
    }

    // Dev dependencies if present
    if (
      config.dev_dependencies &&
      Object.keys(config.dev_dependencies).length > 0
    ) {
      toml += "\n[dev-dependencies]\n";
      for (const [name, value] of Object.entries(config.dev_dependencies)) {
        if (typeof value === "string") {
          toml += `${name} = "${value}"\n`;
        } else if (typeof value === "object" && value !== null) {
          toml += `${name} = { `;
          const parts = Object.entries(value).map(([k, v]) => `${k} = "${v}"`);
          toml += parts.join(", ");
          toml += " }\n";
        }
      }
    }

    // Cairo configuration
    toml += "\n[[target.starknet-contract]]\n";
    toml += "sierra = true\n";
    toml += "casm = true\n";

    toml += "\n[cairo]\n";
    toml += "sierra-replace-ids = true\n";

    return toml;
  }

  private generateBasicScarbToml(
    sourceCode: string,
    contractName: string
  ): string {
    const imports = this.extractImports(sourceCode);
    const config = this.getDefaultScarbConfig(contractName, imports, sourceCode);
    return this.configToToml(config);
  }

  /**
   * Get the latest compatible version for a dependency
   */
  private getLatestCompatibleVersion(depName: string, cairoVersion: string = "2.8.0"): string | null {
    const dep = DEPENDENCY_DATABASE.find(d => d.name === depName);
    if (!dep) return null;

    if (dep.version && dep.cairoVersions.includes(cairoVersion)) {
      return dep.version;
    }

    return null;
  }

  /**
   * Validate that all dependencies are compatible with each other
   */
  private validateDependencyCompatibility(dependencies: DependencyInfo[]): boolean {
    // Check for version conflicts
    const cairoVersions = new Set<string>();

    dependencies.forEach(dep => {
      dep.cairoVersions.forEach(version => cairoVersions.add(version));
    });

    // Find common Cairo versions
    const commonVersions = dependencies.reduce((common, dep) => {
      return common.filter(version => dep.cairoVersions.includes(version));
    }, Array.from(cairoVersions));

    return commonVersions.length > 0;
  }
}

// Export a singleton instance
export const scarbGenerator = new ScarbGenerator();
