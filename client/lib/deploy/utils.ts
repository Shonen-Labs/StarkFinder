// @ts-nocheck
import path from "path";

export function getContractsPath(...paths: string[]) {
  return path.join(process.cwd(), "..", "contracts", ...paths);
}

export function normalizePaths(output: string): string {
  const contractsPath = path.resolve(getContractsPath());
  const escapedContractsPath = contractsPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

  const contractsRegex = new RegExp(escapedContractsPath, "g");
  const cacheRegex = /\/home\/[^\/]+\/\.cache\/scarb\/registry\/git\/checkouts/g;

  return output
    .replace(contractsRegex, "devx/contracts")
    .replace(cacheRegex, "devx/.cache/scarb/registry/git/checkouts");
}

export async function validateEnvironment(): Promise<{ valid: boolean; error?: string }>{
  const requiredEnvVars = ["OZ_ACCOUNT_PRIVATE_KEY", "ACCOUNT_ADDRESS"];
  const missing = requiredEnvVars.filter((k) => !process.env[k]);
  if (missing.length) return { valid: false, error: `Missing environment variables: ${missing.join(", ")}` };
  return { valid: true };
}

export async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3, delayMs = 2000): Promise<T> {
  let attempt = 1;
  let wait = delayMs;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await operation();
    } catch (err) {
      if (attempt++ >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, wait));
      wait *= 2;
    }
  }
}

export const SEPOLIA_ETH_ADDRESS =
  "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7";
