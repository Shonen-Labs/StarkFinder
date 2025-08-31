// @ts-nocheck
import chalk from "chalk";
import { Account, Contract, DeclareContractResponse, Calldata } from "starknet";
import prisma from "@/lib/db";
import { ContractCacheService } from "@/lib/services/contractCacheService";
import { withRetry } from "@/lib/deploy/utils";
import { getCompiledCode } from "@/lib/deploy/files";

export interface DeploymentInputs {
  account: Account;
  sourceCode: string;
  scarbToml: string;
  contractName: string;
  provider: any;
  userId?: string;
  generatedContractId?: string;
  constructorCalldata?: Calldata;
}

export interface DeploymentResult {
  contractAddress: string;
  classHash: string;
  casmHash: string | undefined;
  transactionHash: string;
}

export async function declareAndDeploy(
  inputs: DeploymentInputs,
  compiledContractName: string
): Promise<DeploymentResult> {
  const { account, provider } = inputs;
  console.log(chalk.yellow("\n📖 Reading compiled contract code...\n"));
  const { sierraCode, casmCode } = await getCompiledCode(compiledContractName);

  console.log(chalk.yellow("\n📣 Declaring contract...\n"));
  let declareResponse: DeclareContractResponse;
  try {
    declareResponse = await withRetry(() => account.declare({ contract: sierraCode, casm: casmCode }));
  } catch (error) {
    console.error(chalk.red("❌ Declaration failed:"), error);
    if (error instanceof Error && error.message.includes("already declared")) {
      console.log(chalk.yellow("⚠️  Contract already declared, continuing with deployment..."));
      const match = error.message.match(/0x[a-fA-F0-9]+/);
      const classHash = match ? match[0] : "";
      if (!classHash) throw new Error("Could not extract class hash from already declared contract");
      declareResponse = { transaction_hash: "0x0", class_hash: classHash } as DeclareContractResponse;
    } else {
      throw error;
    }
  }

  console.log(chalk.blue(`📋 Declaration transaction: ${declareResponse.transaction_hash}`));
  console.log(chalk.blue(`📋 Class hash: ${declareResponse.class_hash}`));
  if (declareResponse.transaction_hash !== "0x0") {
    console.log(chalk.yellow("\n⏳ Waiting for declaration transaction...\n"));
    await withRetry(() => provider.waitForTransaction(declareResponse.transaction_hash));
  }

  console.log(chalk.yellow("\n🚀 Deploying contract...\n"));
  const deployResponse = await withRetry(() =>
    account.deployContract({ classHash: declareResponse.class_hash, constructorCalldata: inputs.constructorCalldata || [] })
  );

  console.log(chalk.blue(`📋 Deploy transaction: ${deployResponse.transaction_hash}`));
  console.log(chalk.blue(`📋 Contract address: ${deployResponse.contract_address}`));

  console.log(chalk.yellow("\n⏳ Waiting for deployment transaction...\n"));
  await withRetry(() => provider.waitForTransaction(deployResponse.transaction_hash));

  const casmHash = (casmCode as any).hash || (casmCode as any).compiled_class_hash;

  // Persist and cache
  if (inputs.userId) {
    try {
      const deployed = await prisma.deployedContract.create({
        data: {
          name: inputs.contractName,
          sourceCode: inputs.sourceCode,
          scarbConfig: inputs.scarbToml,
          userId: inputs.userId,
          contractAddress: deployResponse.contract_address,
          classHash: declareResponse.class_hash,
          transactionHash: deployResponse.transaction_hash,
        },
      });
      if (inputs.generatedContractId) {
        try {
          await prisma.generatedContract.delete({ where: { id: inputs.generatedContractId, userId: inputs.userId } });
        } catch (e) {
          console.warn(chalk.yellow("⚠️  Warning: Could not delete generated contract"), e);
        }
      }
      try {
        const cached = await ContractCacheService.listContractsByUser(inputs.userId);
        const match = cached.find((c) => c.sourceCode === inputs.sourceCode);
        if (match) await ContractCacheService.markDeployed(match.id, deployed.id);
      } catch (cacheError) {
        console.error("Error marking contract as deployed in Redis:", cacheError);
      }
    } catch (dbError) {
      console.error(chalk.yellow("⚠️  Warning: Could not save to database:"), dbError);
    }
  }

  return {
    contractAddress: deployResponse.contract_address,
    classHash: declareResponse.class_hash,
    casmHash,
    transactionHash: deployResponse.transaction_hash,
  };
}
