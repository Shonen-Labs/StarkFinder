// @ts-nocheck
import { RpcProvider, Account, Call } from "starknet";
import chalk from "chalk";
import { SEPOLIA_ETH_ADDRESS, withRetry } from "@/lib/deploy/utils";

export function pickProviderUrl(): string {
  const rpcProviders = [
    process.env.STARKNET_RPC_URL,
    process.env.STARKNET_PROVIDER_URL,
  ].filter(Boolean) as string[];
  if (rpcProviders.length === 0) throw new Error("No Starknet RPC endpoints configured");
  return rpcProviders[Math.floor(Math.random() * rpcProviders.length)];
}

export function createProvider(): RpcProvider {
  const selectedRpcUrl = pickProviderUrl();
  return new RpcProvider({ nodeUrl: selectedRpcUrl });
}

export function createAccount(provider: RpcProvider): Account {
  return new Account(provider, process.env.ACCOUNT_ADDRESS!, process.env.OZ_ACCOUNT_PRIVATE_KEY!);
}

export async function testRpc(provider: RpcProvider) {
  console.log(chalk.yellow("\n🧪 Testing RPC connection...\n"));
  const block = await withRetry(() => provider.getBlock("latest"), 2);
  console.log(chalk.green(`✓ RPC connected (Block #${(block as any).block_number})`));
}

export async function logEthBalance(provider: RpcProvider, account: Account) {
  try {
    const call: Call = {
      contractAddress: SEPOLIA_ETH_ADDRESS,
      entrypoint: "balanceOf",
      calldata: [account.address],
    };
    const result = await provider.callContract(call);
    const balanceLow = BigInt(result[0]);
    const balanceHigh = BigInt(result[1]);
    const balance = (balanceHigh << 128n) + balanceLow;
    const formattedBalance = Number(balance / 1000000000000000n) / 1000; // ~ETH with 3dp
    console.log(chalk.blue(`💰 Account balance: ${formattedBalance} ETH`));
    if (balance < 1000000000000000n) console.warn(chalk.yellow("⚠️  Low account balance - deployment may fail"));
  } catch {
    console.warn(chalk.yellow("⚠️  Could not fetch account balance"));
  }
}
