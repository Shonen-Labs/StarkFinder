// lib/deployment/blockchainService.ts
import {
  RpcProvider,
  Account,
  Contract,
  DeclareContractResponse,
  Call,
  uint256,
  Calldata,
  CallData,
} from "starknet";
import chalk from "chalk";
import { ConstructorArg, checkForConstructorArgs } from "@/lib/codeEditor";
import { CompiledContract } from "@/types/deployment";

const SEPOLIA_ETH_ADDRESS =
  "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7";

export class BlockchainService {
  private provider: RpcProvider;
  private account: Account;

  constructor(rpcUrl: string, accountAddress: string, privateKey: string) {
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });
    this.account = new Account(this.provider, accountAddress, privateKey);
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 2000
  ): Promise<T> {
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        console.warn(
          chalk.yellow(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`)
        );
        if (attempt === maxAttempts) throw error;
        await new Promise((res) => setTimeout(res, delayMs));
        delayMs *= 2;
        attempt++;
      }
    }
    throw new Error("All retry attempts failed");
  }

  static formatWeiToEth(wei: string): string {
    try {
      const weiBigInt = BigInt(wei);
      const eth = Number(weiBigInt) / 1e18;
      return eth.toFixed(6);
    } catch {
      return wei;
    }
  }

  static selectRandomRpcProvider(): string {
    const rpcProviders = [
      process.env.STARKNET_RPC_URL,
      process.env.STARKNET_PROVIDER_URL,
    ].filter(Boolean) as string[];

    if (rpcProviders.length === 0) {
      throw new Error("No RPC providers configured");
    }

    return rpcProviders[Math.floor(Math.random() * rpcProviders.length)];
  }

  async testConnection(): Promise<void> {
    console.log(chalk.yellow("\n🧪 Testing RPC connection...\n"));
    try {
      const block = await BlockchainService.withRetry(() => 
        this.provider.getBlock("latest"), 2
      );
      console.log(
        chalk.green(`✓ RPC connected (Block #${block.block_number})`)
      );
    } catch (error) {
      console.error(chalk.red("❌ RPC test failed:"), error);
      throw new Error("RPC provider unavailable");
    }
  }

  async getAccountBalance(): Promise<void> {
    try {
      const call: Call = {
        contractAddress: SEPOLIA_ETH_ADDRESS,
        entrypoint: "balanceOf",
        calldata: [this.account.address],
      };

      const result = await this.provider.callContract(call);

      // Convert Uint256 balance to bigint
      const balanceLow = BigInt(result[0]);
      const balanceHigh = BigInt(result[1]);
      const balance = uint256.uint256ToBN({
        low: balanceLow,
        high: balanceHigh,
      });

      const formattedBalance = Number(balance / BigInt(1e15)) / 1000;
      console.log(chalk.blue(`💰 Account balance: ${formattedBalance} ETH`));

      if (balance < BigInt(1e15)) {
        // Less than 0.001 ETH
        console.warn(
          chalk.yellow("⚠️  Low account balance - deployment may fail")
        );
      }
    } catch {
      console.warn(chalk.yellow("⚠️  Could not fetch account balance"));
    }
  }

  private parseConstructorCalldata(
    sierrCode: any,
    constructorArgs: ConstructorArg[]
  ): Calldata {
    const contractCalldata: CallData = new CallData(sierrCode.abi);

    const unsetArg = constructorArgs.find(
      (arg) => !arg.value || arg.value.trim() === ""
    );

    if (unsetArg) {
      throw new Error(`Constructor argument "${unsetArg.name}" is not set.`);
    }

    const constructorObject = constructorArgs.reduce<Record<string, string>>(
      (acc, arg) => {
        acc[arg.name] = arg.value!;
        return acc;
      },
      {}
    );

    const constructorCalldata: Calldata = contractCalldata.compile(
      "constructor",
      constructorObject
    );

    return constructorCalldata;
  }

  async declareContract(compiledContract: CompiledContract): Promise<DeclareContractResponse> {
    console.log(chalk.yellow("\n📣 Declaring contract...\n"));
    
    try {
      const declareResponse = await BlockchainService.withRetry(() =>
        this.account.declare({
          contract: compiledContract.sierraCode,
          casm: compiledContract.casmCode,
        })
      );

      console.log(
        chalk.blue(`📋 Declaration transaction: ${declareResponse.transaction_hash}`)
      );
      console.log(chalk.blue(`📋 Class hash: ${declareResponse.class_hash}`));

      if (declareResponse.transaction_hash !== "0x0") {
        console.log(
          chalk.yellow("\n⏳ Waiting for declaration transaction...\n")
        );
        await BlockchainService.withRetry(() =>
          this.provider.waitForTransaction(declareResponse.transaction_hash)
        );
      }

      return declareResponse;
    } catch (error) {
      console.error(chalk.red("❌ Declaration failed:"), error);

      if (
        error instanceof Error &&
        error.message.includes("already declared")
      ) {
        console.log(
          chalk.yellow(
            "⚠️  Contract already declared, continuing with deployment..."
          )
        );
        const match = error.message.match(/0x[a-fA-F0-9]+/);
        const classHash = match ? match[0] : "";

        if (!classHash) {
          throw new Error(
            "Could not extract class hash from already declared contract"
          );
        }

        return {
          transaction_hash: "0x0",
          class_hash: classHash,
        } as DeclareContractResponse;
      } else {
        throw error;
      }
    }
  }

  async deployContract(
    classHash: string,
    sourceCode: string,
    constructorArgs?: string,
    sierraCode?: any
  ) {
    console.log(chalk.yellow("\n🚀 Deploying contract...\n"));

    let constructorData: Calldata = [];

    if (constructorArgs && checkForConstructorArgs(sourceCode) && sierraCode) {
      constructorData = this.parseConstructorCalldata(
        sierraCode,
        JSON.parse(constructorArgs)
      );
    }

    const deployResponse = await BlockchainService.withRetry(() =>
      this.account.deployContract({
        classHash: classHash,
        constructorCalldata: constructorData,
      })
    );

    console.log(
      chalk.blue(`📋 Deploy transaction: ${deployResponse.transaction_hash}`)
    );
    console.log(
      chalk.blue(`📋 Contract address: ${deployResponse.contract_address}`)
    );

    console.log(chalk.yellow("\n⏳ Waiting for deployment transaction...\n"));
    await BlockchainService.withRetry(() =>
      this.provider.waitForTransaction(deployResponse.transaction_hash)
    );

    return deployResponse;
  }

  async getContractAbi(classHash: string) {
    const { abi } = await BlockchainService.withRetry(() =>
      this.provider.getClassByHash(classHash)
    );
    
    if (!abi) {
      throw new Error("No ABI found for deployed contract");
    }
    
    return abi;
  }

  createContract(abi: any, contractAddress: string): Contract {
    return new Contract(abi, contractAddress, this.provider);
  }

  get accountAddress(): string {
    return this.account.address;
  }
}