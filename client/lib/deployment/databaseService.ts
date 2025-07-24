// lib/deployment/databaseService.ts
import chalk from "chalk";
import prisma from "@/lib/db";
import { ContractCacheService } from "@/lib/services/contractCacheService";

export class DatabaseService {
  static async saveDeployedContract(
    contractName: string,
    sourceCode: string,
    scarbToml: string,
    userId: string,
    contractAddress: string,
    classHash: string,
    transactionHash: string
  ) {
    try {
      const deployed = await prisma.deployedContract.create({
        data: {
          name: contractName,
          sourceCode: sourceCode,
          scarbConfig: scarbToml,
          userId,
          contractAddress: contractAddress,
          classHash: classHash,
          transactionHash: transactionHash,
        },
      });
      
      console.log(chalk.green("✓ Deployment saved to database"));
      
      // Mark as deployed in Redis cache (if present)
      try {
        // Find cached contract by user and sourceCode
        const cachedContracts =
          await ContractCacheService.listContractsByUser(userId);
        const match = cachedContracts.find(
          (c) => c.sourceCode === sourceCode
        );
        if (match) {
          await ContractCacheService.markDeployed(match.id, deployed.id);
        }
      } catch (cacheError) {
        console.error(
          "Error marking contract as deployed in Redis:",
          cacheError
        );
      }
      
      return deployed;
    } catch (dbError) {
      console.error(
        chalk.yellow("⚠️  Warning: Could not save to database:"),
        dbError
      );
      throw dbError;
    }
  }

  static async getDeployedContracts(userId: string) {
    try {
      const contracts = await prisma.deployedContract.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          contractAddress: true,
          classHash: true,
          transactionHash: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return contracts;
    } catch (error) {
      console.error("Error fetching deployed contracts:", error);
      throw new Error("Failed to fetch deployed contracts");
    }
  }
}