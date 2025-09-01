// @ts-nocheck
import chalk from "chalk";
import { CallData, Calldata } from "starknet";
import { extractConstructorArgs, ConstructorArg, checkForConstructorArgs } from "@/lib/codeEditor";

export async function validateContract(sourceCode: string) {
  console.log(chalk.blue("🔍 Validating Starknet contract structure..."));
  const requiredPatterns = [
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

  const recommendedPatterns = [
    { pattern: /#\[external\(\w*\)\]|#\[external\]/, message: "No external functions found - contract may not be callable" },
    { pattern: /use\s+starknet::/, message: "No Starknet imports found - may cause compilation issues" },
  ];

  for (const { pattern, message } of requiredPatterns) {
    if (!pattern.test(sourceCode)) {
      console.error(chalk.red(`❌ Validation failed: ${message}`));
      throw new Error(`Contract validation failed: ${message}`);
    }
  }
  for (const { pattern, message } of recommendedPatterns) {
    if (!pattern.test(sourceCode)) console.warn(chalk.yellow(`⚠️  Warning: ${message}`));
  }

  const unsafePatterns = [
    { pattern: /unsafe\s*\{/, message: "Unsafe blocks detected - remove for security" },
    { pattern: /panic\s*\(/, message: "Direct panic calls detected - use proper error handling" },
    { pattern: /loop\s*\{[^}]*\}(?![^}]*break)/, message: "Potential infinite loops detected - ensure proper exit conditions" },
  ];
  for (const { pattern, message } of unsafePatterns) {
    if (pattern.test(sourceCode)) console.warn(chalk.yellow(`⚠️  Security warning: ${message}`));
  }

  const syntaxChecks = [
    { pattern: /\{/g, counterPattern: /\}/g, message: "Unbalanced braces detected" },
    { pattern: /\(/g, counterPattern: /\)/g, message: "Unbalanced parentheses detected" },
  ];
  for (const { pattern, counterPattern, message } of syntaxChecks) {
    const openCount = (sourceCode.match(pattern) || []).length;
    const closeCount = (sourceCode.match(counterPattern) || []).length;
    if (openCount !== closeCount) console.warn(chalk.yellow(`⚠️  Syntax warning: ${message}`));
  }
  console.log(chalk.green("✓ Contract structure validation passed"));
}

export async function validateConstructorArgs(
  sourceCode: string,
  constructorArgs: ConstructorArg[]
): Promise<void> {
  const expectedArgs = extractConstructorArgs(sourceCode);
  if (expectedArgs.length === 0) return;
  for (const expected of expectedArgs) {
    const provided = constructorArgs.find((arg) => arg.name === expected.name);
    if (!provided || !provided.value || provided.value.trim() === "") {
      throw new Error(`Constructor argument "${expected.name}" is missing or empty.`);
    }
  }
}

export function needsConstructorArgs(source: string): boolean {
  return checkForConstructorArgs(source);
}

export function parseConstructorCalldata(sierrCode: any, constructorArgs: ConstructorArg[]): Calldata {
  const contractCalldata: CallData = new CallData(sierrCode.abi);
  const unsetArg = constructorArgs.find((arg) => !arg.value || arg.value.trim() === "");
  if (unsetArg) throw new Error(`Constructor argument "${unsetArg.name}" is not set.`);
  const constructorObject = constructorArgs.reduce<Record<string, string>>((acc, arg) => {
    acc[arg.name] = arg.value!;
    return acc;
  }, {});
  return contractCalldata.compile("constructor", constructorObject);
}
