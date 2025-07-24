// lib/deployment/deploymentOrchestrator.ts
import chalk from "chalk";
import { checkForConstructorArgs } from "@/lib/codeEditor";
import { DeploymentRequest, DeploymentResponse } from "@/types/deployment";
import { ValidationService } from "./validationService";
import { CompilationService } from "./compilationService";
import { BlockchainService } from "./blockchainService";
import { DatabaseService } from "./databaseService";
import {
  saveContractFiles,
  getCompiledCode,
  validateCompilation,
  findCompiledContractName,
} from "./fileOperations";

export class DeploymentOrchestrator {
  static async deployContract(request: DeploymentRequest): Promise<DeploymentResponse> {
    const {
      contractName = "lib",
      userId,
      sourceCode,
      scarbToml,
      constructorArgs,
    } = request;

    try {
      console.log(chalk.blue("\n🚀 Starting contract deployment process...\n"));

      // 1. Environment Validation
      console.log(chalk.yellow("🔧 Validating environment...\n"));
      const envValidation = await ValidationService.validateEnvironment();
      if (!envValidation.valid) {
        console.error(
          chalk.red("❌ Environment validation failed:"),
          envValidation.error
        );
        return {
          success: false,
          error: "Environment configuration error",
          details: envValidation.error,
        };
      }

      console.log(chalk.blue(`📋 Contract name: ${contractName}`));
      console.log(
        chalk.blue(`📋 Source code length: ${sourceCode.length} chars`)
      );
      console.log(chalk.blue(`📋 Scarb.toml length: ${scarbToml.length} chars`));

      // 2. Contract Structure Validation
      console.log(chalk.yellow("\n🔍 Validating contract structure...\n"));
      await ValidationService.validateContract(sourceCode);

      // 3. Constructor Arguments Validation
      if (checkForConstructorArgs(sourceCode)) {
        if (!constructorArgs) {
          console.error(chalk.red("❌ Missing Constructor Args"));
          return {
            success: false,
            error: "Missing required field: constructorArgs",
            details: "constructorArgs configuration is required for deployment",
          };
        } else {
          await ValidationService.validateConstructorArgs(
            sourceCode,
            JSON.parse(constructorArgs)
          );
        }
      }

      console.log(chalk.green("✓ Contract structure validated"));

      // 4. Save Contract Files
      console.log(chalk.yellow("\n📁 Saving contract files...\n"));
      await saveContractFiles(sourceCode, scarbToml, contractName);

      // 5. Compile Contract
      console.log(chalk.yellow("\n🔨 Starting contract compilation...\n"));
      const compilation = await CompilationService.compileCairo();
      if (!compilation.success) {
        return {
          success: false,
          error: "Compilation failed",
          details: compilation.error,
          errorLog: compilation.errorLog,
        };
      }

      // 6. Find Compiled Contract
      let actualContractName = await findCompiledContractName(
        contractName,
        compilation.contracts
      );

      if (!actualContractName) {
        console.error(chalk.red(`❌ No compiled contracts found`));
        return {
          success: false,
          error: "No compiled contracts found",
          details: "Compilation succeeded but no contract files were generated",
        };
      }

      console.log(
        chalk.blue(`📋 Using compiled contract name: ${actualContractName}`)
      );

      // 7. Validate Compilation Output
      const isValid = await validateCompilation(actualContractName);
      if (!isValid) {
        const availableContracts = compilation.contracts.join(", ");
        console.error(
          chalk.red(
            `❌ Contract validation failed. Available: ${availableContracts}`
          )
        );
        return {
          success: false,
          error: `Contract validation failed`,
          details: `Could not find compiled files for ${actualContractName}. Available contracts: ${availableContracts}`,
        };
      }

      // 8. Initialize Blockchain Service
      console.log(chalk.yellow("\n🌐 Initializing Starknet provider...\n"));
      const selectedRpcUrl = BlockchainService.selectRandomRpcProvider();
      const blockchainService = new BlockchainService(
        selectedRpcUrl,
        process.env.ACCOUNT_ADDRESS!,
        process.env.OZ_ACCOUNT_PRIVATE_KEY!
      );

      // 9. Test RPC Connection
      await blockchainService.testConnection();

      // 10. Get Account Balance
      await blockchainService.getAccountBalance();
      console.log(chalk.blue(`📍 Account address: ${blockchainService.accountAddress}`));

      // 11. Read Compiled Code
      console.log(chalk.yellow("\n📖 Reading compiled contract code...\n"));
      const compiledContract = await getCompiledCode(actualContractName);

      // 12. Declare Contract
      const declareResponse = await blockchainService.declareContract(compiledContract);

      // 13. Deploy Contract
      const deployResponse = await blockchainService.deployContract(
        declareResponse.class_hash,
        sourceCode,
        constructorArgs,
        compiledContract.sierraCode
      );

      // 14. Get Contract ABI and Create Contract Instance
      const abi = await blockchainService.getContractAbi(declareResponse.class_hash);
      const contract = blockchainService.createContract(
        abi,
        deployResponse.contract_address
      );

      console.log(chalk.green("\n✅ Contract deployment successful!\n"));

      // 15. Save to Database
      if (userId) {
        try {
          await DatabaseService.saveDeployedContract(
            contractName,
            sourceCode,
            scarbToml,
            userId,
            contract.address,
            declareResponse.class_hash,
            deployResponse.transaction_hash
          );
        } catch (dbError) {
          console.error(
            chalk.yellow("⚠️  Warning: Could not save to database:"),
            dbError
          );
        }
      }

      // 16. Cleanup Build Artifacts
      await CompilationService.cleanupBuildArtifacts();

      const casmHash = compiledContract.casmCode.hash || 
                      compiledContract.casmCode.compiled_class_hash || 
                      "N/A";

      return {
        success: true,
        contractAddress: contract.address,
        classHash: declareResponse.class_hash,
        casmHash: casmHash,
        transactionHash: deployResponse.transaction_hash,
      };

    } catch (error) {
      console.error(chalk.red("\n❌ Contract deployment error:\n"), error);

      let errorMessage = "Contract deployment failed";
      let errorDetails = error instanceof Error ? error.message : "Unknown error";

      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          errorMessage = "File system error";
          errorDetails =
            "Could not find or create required files. Check file permissions.";
        } else if (error.message.includes("scarb")) {
          errorMessage = "Scarb compilation error";
          errorDetails = error.message.substring(0, 500);
        } else if (error.message.includes("declare")) {
          errorMessage = "Contract declaration failed";
          errorDetails =
            "Check your Starknet account balance and network connection";
        } else if (error.message.includes("Insufficient balance")) {
          errorMessage = "Insufficient balance";
          errorDetails =
            "Your account does not have enough ETH for deployment. Please fund your account.";
        } else if (error.message.includes("already declared")) {
          errorMessage = "Contract already declared";
          errorDetails = "This contract class is already declared on the network";
        } else if (error.message.includes("RPC provider unavailable")) {
          errorMessage = "RPC provider unavailable";
          errorDetails = "Starknet provider failed to respond. Try again later.";
        }
      }

      // Clean up even after failure
      await CompilationService.cleanupBuildArtifacts().catch(() => {});

      return {
        success: false,
        error: errorMessage,
        details: errorDetails,
      };
    }
  }
}