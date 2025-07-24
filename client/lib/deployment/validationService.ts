// lib/deployment/validationService.ts
import chalk from "chalk";
import { extractConstructorArgs, ConstructorArg } from "@/lib/codeEditor";
import { ValidationResult, ContractPattern, SyntaxCheck } from "@/types/deployment";

export class ValidationService {
  private static requiredPatterns: ContractPattern[] = [
    {
      pattern: /#\[starknet::contract\]|mod\s+contract\s*\{/,
      message:
        "Missing Starknet contract definition (#[starknet::contract] or mod contract)",
    },
    {
      pattern: /#\[storage\]|struct\s+Storage\s*\{/,
      message: "Missing storage definition",
    },
  ];

  private static recommendedPatterns: ContractPattern[] = [
    {
      pattern: /#\[external\(\w*\)\]|#\[external\]/,
      message: "No external functions found - contract may not be callable",
    },
    {
      pattern: /use\s+starknet::/,
      message: "No Starknet imports found - may cause compilation issues",
    },
  ];

  private static unsafePatterns: ContractPattern[] = [
    {
      pattern: /unsafe\s*\{/,
      message: "Unsafe blocks detected - remove for security",
    },
    {
      pattern: /panic\s*\(/,
      message: "Direct panic calls detected - use proper error handling",
    },
    {
      pattern: /loop\s*\{[^}]*\}(?![^}]*break)/,
      message:
        "Potential infinite loops detected - ensure proper exit conditions",
    },
  ];

  private static syntaxChecks: SyntaxCheck[] = [
    {
      pattern: /\{/g,
      counterPattern: /\}/g,
      message: "Unbalanced braces detected",
    },
    {
      pattern: /\(/g,
      counterPattern: /\)/g,
      message: "Unbalanced parentheses detected",
    },
  ];

  static async validateEnvironment(): Promise<ValidationResult> {
    const requiredEnvVars = ["OZ_ACCOUNT_PRIVATE_KEY", "ACCOUNT_ADDRESS"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return {
        valid: false,
        error: `Missing environment variables: ${missingVars.join(", ")}`,
      };
    }

    return { valid: true };
  }

  static async validateContract(sourceCode: string): Promise<void> {
    console.log(chalk.blue("🔍 Validating Starknet contract structure..."));

    // Check required patterns
    for (const { pattern, message } of this.requiredPatterns) {
      if (!pattern.test(sourceCode)) {
        console.error(chalk.red(`❌ Validation failed: ${message}`));
        throw new Error(`Contract validation failed: ${message}`);
      }
    }

    // Check recommended patterns (warnings only)
    for (const { pattern, message } of this.recommendedPatterns) {
      if (!pattern.test(sourceCode)) {
        console.warn(chalk.yellow(`⚠️  Warning: ${message}`));
      }
    }

    // Security checks - things that shouldn't be in contracts
    for (const { pattern, message } of this.unsafePatterns) {
      if (pattern.test(sourceCode)) {
        console.warn(chalk.yellow(`⚠️  Security warning: ${message}`));
        // Don't throw error, just warn
      }
    }

    // Basic syntax checks
    for (const { pattern, counterPattern, message } of this.syntaxChecks) {
      const openCount = (sourceCode.match(pattern) || []).length;
      const closeCount = (sourceCode.match(counterPattern) || []).length;
      if (openCount !== closeCount) {
        console.warn(chalk.yellow(`⚠️  Syntax warning: ${message}`));
      }
    }

    console.log(chalk.green("✓ Contract structure validation passed"));
  }

  static async validateConstructorArgs(
    sourceCode: string,
    constructorArgs: ConstructorArg[]
  ): Promise<void> {
    const expectedArgs = extractConstructorArgs(sourceCode);

    if (expectedArgs.length === 0) return;

    for (const expected of expectedArgs) {
      const provided = constructorArgs.find((arg) => arg.name === expected.name);
      if (!provided || !provided.value || provided.value.trim() === "") {
        throw new Error(
          `Constructor argument "${expected.name}" is missing or empty.`
        );
      }
    }
  }
}