/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { NextRequest, NextResponse } from "next/server";
import {
  RpcProvider,
  Account,
  Contract,
  DeclareContractResponse,
  Call,
  uint256,
} from "starknet";
import path from "path";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import prisma from "@/lib/db";
import { ContractCacheService } from '@/lib/services/contractCacheService';

interface CompilationResult {
  success: boolean;
  contracts: string[];
  error?: string;
}

function getContractsPath(...paths: string[]) {
  return path.join(process.cwd(), "..", "contracts", ...paths);
}

const execAsync = promisify(exec);
const SEPOLIA_ETH_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

// Save source code and Scarb.toml
async function saveContractFiles(
  sourceCode: string,
  scarbToml: string,
  contractName: string = "lib"
): Promise<void> {
  const contractsDir = path.join(process.cwd(), "..", "contracts");
  const srcDir = path.join(contractsDir, "src");

  try {
    console.log(chalk.blue(`📁 Creating directories at: ${contractsDir}`));
    await fs.mkdir(srcDir, { recursive: true });

    const sourceFilePath = path.join(srcDir, "lib.cairo");
    console.log(chalk.blue(`📝 Writing source code to: ${sourceFilePath}`));
    await fs.writeFile(sourceFilePath, sourceCode, {
      encoding: "utf8",
      flag: "w",
    });
    console.log(chalk.green(`✓ Saved source code`));

    const scarbFilePath = path.join(contractsDir, "Scarb.toml");
    console.log(chalk.blue(`📝 Writing Scarb.toml to: ${scarbFilePath}`));
    await fs.writeFile(scarbFilePath, scarbToml, {
      encoding: "utf8",
      flag: "w",
    });
    console.log(chalk.green(`✓ Saved Scarb.toml`));

    const writtenSource = await fs.readFile(sourceFilePath, "utf8");
    const writtenScarb = await fs.readFile(scarbFilePath, "utf8");

    if (writtenSource !== sourceCode) {
      throw new Error("Source file verification failed - content mismatch");
    }

    if (writtenScarb !== scarbToml) {
      throw new Error("Scarb.toml verification failed - content mismatch");
    }

    console.log(chalk.green(`✅ All files verified successfully`));
  } catch (error) {
    console.error(chalk.red("❌ Error saving contract files:"), error);
    throw new Error(
      `Failed to save contract files: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Validate contract structure before compilation
// Replace the validateContract function in your deploy-contract/route.ts with this:

// Validate Starknet contract structure before compilation
async function validateContract(sourceCode: string) {
  console.log(chalk.blue("🔍 Validating Starknet contract structure..."));

  // Required patterns for Starknet contracts
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

  // Optional but common patterns (warnings, not errors)
  const recommendedPatterns = [
    {
      pattern: /#\[external\(\w*\)\]|#\[external\]/,
      message: "No external functions found - contract may not be callable",
    },
    {
      pattern: /use\s+starknet::/,
      message: "No Starknet imports found - may cause compilation issues",
    },
  ];

  // Check required patterns
  for (const { pattern, message } of requiredPatterns) {
    if (!pattern.test(sourceCode)) {
      console.error(chalk.red(`❌ Validation failed: ${message}`));
      throw new Error(`Contract validation failed: ${message}`);
    }
  }

  // Check recommended patterns (warnings only)
  for (const { pattern, message } of recommendedPatterns) {
    if (!pattern.test(sourceCode)) {
      console.warn(chalk.yellow(`⚠️  Warning: ${message}`));
    }
  }

  // Security checks - things that shouldn't be in contracts
  const unsafePatterns = [
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

  for (const { pattern, message } of unsafePatterns) {
    if (pattern.test(sourceCode)) {
      console.warn(chalk.yellow(`⚠️  Security warning: ${message}`));
      // Don't throw error, just warn
    }
  }

  // Basic syntax checks
  const syntaxChecks = [
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

  for (const { pattern, counterPattern, message } of syntaxChecks) {
    const openCount = (sourceCode.match(pattern) || []).length;
    const closeCount = (sourceCode.match(counterPattern) || []).length;
    if (openCount !== closeCount) {
      console.warn(chalk.yellow(`⚠️  Syntax warning: ${message}`));
    }
  }

  console.log(chalk.green("✓ Contract structure validation passed"));
}

// Clean up build artifacts after deployment
async function cleanupBuildArtifacts() {
  try {
    console.log(chalk.blue("🧹 Cleaning build artifacts..."));
    await execAsync("scarb clean", {
      cwd: getContractsPath(),
    });
    console.log(chalk.green("✓ Build artifacts cleaned"));
  } catch (error) {
    console.warn(chalk.yellow("⚠️  Warning: Could not clean build artifacts"));
  }
}

// Check Scarb version compatibility
async function checkScarbVersion() {
  try {
    const { stdout } = await execAsync("scarb --version");
    const versionMatch = stdout.match(/scarb\s+(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      const [_, version] = versionMatch;
      const [major, minor] = version.split(".").map(Number);

      if (major < 2 || (major === 2 && minor < 4)) {
        throw new Error(`Unsupported Scarb version: ${version}. Requires 2.4+`);
      }
      console.log(chalk.green(`✓ Scarb version ${version} is supported`));
    }
  } catch (error) {
    throw new Error(
      "Scarb version check failed: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}

async function compileCairo(): Promise<CompilationResult> {
  try {
    console.log(chalk.blue("🔍 Checking Scarb installation..."));
    try {
      const { stdout } = await execAsync("scarb --version");
      console.log(chalk.green(`✓ Scarb found: ${stdout.trim()}`));
    } catch {
      throw new Error(
        "Scarb is not installed. Please install Scarb to compile Cairo contracts."
      );
    }

    console.log(chalk.blue("🔍 Checking Scarb version..."));
    await checkScarbVersion();

    const scarbPath = getContractsPath("Scarb.toml");
    console.log(chalk.blue(`🔍 Checking for Scarb.toml at: ${scarbPath}`));
    await fs.access(scarbPath);
    console.log(chalk.green("✓ Scarb.toml found"));

    console.log(chalk.blue("📦 Starting Cairo compilation..."));
    const startTime = Date.now();

    // Clean previous build artifacts
    await cleanupBuildArtifacts();

    console.log(chalk.blue("🔨 Running scarb build..."));
    let stdout = "",
      stderr = "";
    try {
      const result = await execAsync("scarb build", {
        cwd: getContractsPath(),
        // maxBuffer: 1024 * 1024 * 10, // 10 MB buffer
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      if (error instanceof Error) {
        stdout = (error as any).stdout || "";
        stderr = (error as any).stderr || error.message;
      }
      throw error;
    }

    console.log(chalk.blue("📋 Build Output:"));
    if (stdout) console.log(chalk.gray(stdout));
    if (stderr) console.log(chalk.yellow(stderr));

    // Check for common errors
    if (stderr.includes("error: ") || stdout.includes("error: ")) {
      const errorOutput = stderr || stdout;
      let errorMessage = "Compilation failed";

      if (errorOutput.includes("not found in module")) {
        errorMessage = "Undefined symbol reference";
      } else if (errorOutput.includes("mismatched types")) {
        errorMessage = "Type mismatch";
      } else if (errorOutput.includes("cannot infer type")) {
        errorMessage = "Type inference failure";
      } else if (errorOutput.includes("Expected identifier")) {
        errorMessage = "Syntax error";
      }

      throw new Error(`${errorMessage}\n${errorOutput.substring(0, 1000)}`);
    }

    const targetDir = getContractsPath("target", "dev");
    console.log(chalk.blue(`📂 Checking build output in: ${targetDir}`));

    const files = await fs.readdir(targetDir);
    const contractFiles = files.filter(
      (file) =>
        file.endsWith(".contract_class.json") ||
        file.endsWith(".compiled_contract_class.json")
    );

    if (contractFiles.length === 0) {
      throw new Error("No compiled contracts found. Build may have failed.");
    }

    const contracts = [
      ...new Set(
        contractFiles.map((file) =>
          file
            .replace(".contract_class.json", "")
            .replace(".compiled_contract_class.json", "")
        )
      ),
    ];

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(chalk.green(`✅ Compilation successful in ${duration}s!`));
    console.log(chalk.blue("📄 Compiled contracts:"));
    contracts.forEach((contract) =>
      console.log(chalk.cyan(`   - ${contract}`))
    );

    return {
      success: true,
      contracts,
    };
  } catch (error) {
    console.error(chalk.red("❌ Compilation failed:"));
    const errorDetails =
      error instanceof Error ? error.message : "Unknown error";
    console.error(chalk.red(errorDetails));

    return {
      success: false,
      contracts: [],
      error: errorDetails,
    };
  }
}

async function validateCompilation(contractName: string): Promise<boolean> {
  const targetDir = getContractsPath("target", "dev");

  try {
    const sierraPath = path.join(
      targetDir,
      `${contractName}.contract_class.json`
    );
    const casmPath = path.join(
      targetDir,
      `${contractName}.compiled_contract_class.json`
    );

    console.log(chalk.blue(`🔍 Checking for compiled files:`));
    console.log(chalk.gray(`   - Sierra: ${sierraPath}`));
    console.log(chalk.gray(`   - CASM: ${casmPath}`));

    await Promise.all([fs.access(sierraPath), fs.access(casmPath)]);
    console.log(chalk.green("✓ Both compiled files found"));
    return true;
  } catch {
    console.error(chalk.red("❌ Compiled files not found"));
    return false;
  }
}

async function getCompiledCode(filename: string) {
  const sierraFilePath = getContractsPath(
    "target",
    "dev",
    `${filename}.contract_class.json`
  );
  const casmFilePath = getContractsPath(
    "target",
    "dev",
    `${filename}.compiled_contract_class.json`
  );

  console.log(chalk.blue("📖 Reading compiled contract files..."));

  const [sierraFile, casmFile] = await Promise.all([
    fs.readFile(sierraFilePath),
    fs.readFile(casmFilePath),
  ]);

  const sierraCode = JSON.parse(sierraFile.toString("utf8"));
  const casmCode = JSON.parse(casmFile.toString("utf8"));

  console.log(chalk.green("✓ Compiled code loaded successfully"));
  return {
    sierraCode,
    casmCode,
  };
}

async function validateEnvironment(): Promise<{
  valid: boolean;
  error?: string;
}> {
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

async function findCompiledContractName(
  expectedName: string,
  availableContracts: string[]
): Promise<string | null> {
  const possibleNames = [
    expectedName,
    "lib",
    `${expectedName}_${expectedName}`,
    expectedName.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase(),
  ];

  for (const name of possibleNames) {
    if (availableContracts.includes(name)) {
      return name;
    }
  }
  return availableContracts.length > 0 ? availableContracts[0] : null;
}

// Retry function for RPC calls
async function withRetry<T>(
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

// Helper function to convert wei to ETH
function formatWeiToEth(wei: string): string {
  try {
    const weiBigInt = BigInt(wei);
    const eth = Number(weiBigInt) / 1e18;
    return eth.toFixed(6);
  } catch {
    return wei;
  }
}

export async function POST(req: NextRequest) {
  console.log(chalk.blue("\n🚀 Starting contract deployment process...\n"));

  try {
    const envValidation = await validateEnvironment();
    if (!envValidation.valid) {
      console.error(
        chalk.red("❌ Environment validation failed:"),
        envValidation.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Environment configuration error",
          details: envValidation.error,
        },
        { status: 500 }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log(
        chalk.blue("📥 Request received with fields:"),
        Object.keys(requestBody)
      );
    } catch {
      console.error(chalk.red("❌ Failed to parse request body"));
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const { contractName = "lib", userId, sourceCode, scarbToml } = requestBody;

    if (!sourceCode) {
      console.error(chalk.red("❌ Missing source code"));
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: sourceCode",
          details: "Source code is required for deployment",
        },
        { status: 400 }
      );
    }

    if (!scarbToml) {
      console.error(chalk.red("❌ Missing Scarb.toml"));
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: scarbToml",
          details: "Scarb.toml configuration is required for deployment",
        },
        { status: 400 }
      );
    }

    console.log(chalk.blue(`📋 Contract name: ${contractName}`));
    console.log(
      chalk.blue(`📋 Source code length: ${sourceCode.length} chars`)
    );
    console.log(chalk.blue(`📋 Scarb.toml length: ${scarbToml.length} chars`));

    // Validate contract structure
    console.log(chalk.yellow("\n🔍 Validating contract structure...\n"));
    await validateContract(sourceCode);
    console.log(chalk.green("✓ Contract structure validated"));

    console.log(chalk.yellow("\n📁 Saving contract files...\n"));
    await saveContractFiles(sourceCode, scarbToml, contractName);

    console.log(chalk.yellow("\n🔨 Starting contract compilation...\n"));
    const compilation = await compileCairo();
    if (!compilation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Compilation failed",
          details: compilation.error,
        },
        { status: 500 }
      );
    }

    let actualContractName = await findCompiledContractName(
      contractName,
      compilation.contracts
    );
    if (!actualContractName) {
      console.error(chalk.red(`❌ No compiled contracts found`));
      return NextResponse.json(
        {
          success: false,
          error: "No compiled contracts found",
          details: "Compilation succeeded but no contract files were generated",
        },
        { status: 500 }
      );
    }

    console.log(
      chalk.blue(`📋 Using compiled contract name: ${actualContractName}`)
    );

    const isValid = await validateCompilation(actualContractName);
    if (!isValid) {
      const availableContracts = compilation.contracts.join(", ");
      console.error(
        chalk.red(
          `❌ Contract validation failed. Available: ${availableContracts}`
        )
      );
      return NextResponse.json(
        {
          success: false,
          error: `Contract validation failed`,
          details: `Could not find compiled files for ${actualContractName}. Available contracts: ${availableContracts}`,
        },
        { status: 400 }
      );
    }

    console.log(chalk.yellow("\n🌐 Initializing Starknet provider...\n"));
    const rpcProviders = [
      process.env.STARKNET_RPC_URL,
      process.env.STARKNET_PROVIDER_URL,
      "https://starknet-sepolia.public.blastapi.io",
      "https://starknet-sepolia-rpc.publicnode.com",
      "https://rpc.sepolia.starknet.lava.build",
    ].filter(Boolean) as string[];

    if (rpcProviders.length === 0) {
      console.error(chalk.red("❌ No RPC providers configured"));
      return NextResponse.json(
        {
          success: false,
          error: "Configuration error",
          details: "No Starknet RPC endpoints configured",
        },
        { status: 500 }
      );
    }

    // Select a random provider
    const selectedRpcUrl =
      rpcProviders[Math.floor(Math.random() * rpcProviders.length)];
    const provider = new RpcProvider({
      nodeUrl: selectedRpcUrl,
    });

    const account = new Account(
      provider,
      process.env.ACCOUNT_ADDRESS!,
      process.env.OZ_ACCOUNT_PRIVATE_KEY!
    );
    // Get current account balance using ETH contract
    try {
      const call: Call = {
        contractAddress: SEPOLIA_ETH_ADDRESS,
        entrypoint: "balanceOf",
        calldata: [account.address],
      };

      const result = await provider.callContract(call);

      // Convert Uint256 balance to bigint
      const balanceLow = BigInt(result[0]);
      const balanceHigh = BigInt(result[1]);
      const balance = uint256.uint256ToBN({
        low: balanceLow,
        high: balanceHigh,
      });

      // Convert wei to ETH (1 ETH = 1e15 wei)
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

    console.log(
      chalk.blue(`🌐 Using RPC: ${selectedRpcUrl.substring(0, 50)}...`)
    );

    // Test RPC connection
    console.log(chalk.yellow("\n🧪 Testing RPC connection...\n"));
    try {
      const block = await withRetry(() => provider.getBlock("latest"), 2);
      if (!block.block_number) throw new Error("Invalid RPC response");
      console.log(
        chalk.green(`✓ RPC connected (Block #${block.block_number})`)
      );
    } catch (error) {
      console.error(chalk.red("❌ RPC test failed:"), error);
      return NextResponse.json(
        {
          success: false,
          error: "RPC provider unavailable",
          details: "Starknet provider failed to respond. Try again later.",
        },
        { status: 503 }
      );
    }

    // Get current account balance
    try {
      const call: Call = {
        contractAddress: SEPOLIA_ETH_ADDRESS,
        entrypoint: "balanceOf",
        calldata: [account.address],
      };

      const result = await provider.callContract(call);

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

    console.log(chalk.blue(`📍 Account address: ${account.address}`));

    console.log(chalk.yellow("\n📖 Reading compiled contract code...\n"));
    const { sierraCode, casmCode } = await getCompiledCode(actualContractName);

    console.log(chalk.yellow("\n📣 Declaring contract...\n"));
    let declareResponse: DeclareContractResponse;
    try {
      declareResponse = await withRetry(() =>
        account.declare({
          contract: sierraCode,
          casm: casmCode,
        })
      );
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

        declareResponse = {
          transaction_hash: "0x0",
          class_hash: classHash,
        } as DeclareContractResponse;
      } else {
        throw error;
      }
    }

    console.log(
      chalk.blue(
        `📋 Declaration transaction: ${declareResponse.transaction_hash}`
      )
    );
    console.log(chalk.blue(`📋 Class hash: ${declareResponse.class_hash}`));

    if (declareResponse.transaction_hash !== "0x0") {
      console.log(
        chalk.yellow("\n⏳ Waiting for declaration transaction...\n")
      );
      await withRetry(() =>
        provider.waitForTransaction(declareResponse.transaction_hash)
      );
    }

    console.log(chalk.yellow("\n🚀 Deploying contract...\n"));
    const deployResponse = await withRetry(() =>
      account.deployContract({
        classHash: declareResponse.class_hash,
      })
    );

    console.log(
      chalk.blue(`📋 Deploy transaction: ${deployResponse.transaction_hash}`)
    );
    console.log(
      chalk.blue(`📋 Contract address: ${deployResponse.contract_address}`)
    );

    console.log(chalk.yellow("\n⏳ Waiting for deployment transaction...\n"));
    await withRetry(() =>
      provider.waitForTransaction(deployResponse.transaction_hash)
    );

    const { abi } = await withRetry(() =>
      provider.getClassByHash(declareResponse.class_hash)
    );
    if (!abi) {
      throw new Error("No ABI found for deployed contract");
    }

    const contract = new Contract(
      abi,
      deployResponse.contract_address,
      provider
    );
    console.log(chalk.green("\n✅ Contract deployment successful!\n"));

    // Save to database if userId is provided
    if (userId) {
      try {
        const deployed = await prisma.deployedContract.create({
          data: {
            name: contractName,
            sourceCode: sourceCode,
            scarbConfig: scarbToml,
            userId,
            contractAddress: contract.address,
            classHash: declareResponse.class_hash,
            transactionHash: deployResponse.transaction_hash,
          },
        });
        console.log(chalk.green("✓ Deployment saved to database"));
        // Mark as deployed in Redis cache (if present)
        try {
          // Find cached contract by user and sourceCode
          const cachedContracts = await ContractCacheService.listContractsByUser(userId);
          const match = cachedContracts.find(c => c.sourceCode === sourceCode);
          if (match) {
            await ContractCacheService.markDeployed(match.id, deployed.id);
          }
        } catch (cacheError) {
          console.error('Error marking contract as deployed in Redis:', cacheError);
        }
      } catch (dbError) {
        console.error(
          chalk.yellow("⚠️  Warning: Could not save to database:"),
          dbError
        );
      }
    }

    const casmHash = casmCode.hash || casmCode.compiled_class_hash || "N/A";

    // Clean up build artifacts
    await cleanupBuildArtifacts();

    return NextResponse.json({
      success: true,
      contractAddress: contract.address,
      classHash: declareResponse.class_hash,
      casmHash: casmHash,
      transactionHash: deployResponse.transaction_hash,
    });
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
      }
    }

    // Clean up even after failure
    await cleanupBuildArtifacts().catch(() => {});

    return NextResponse.json(
      { success: false, error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}

export async function GET({ params }: { params: { id: string } }) {
  try {
    const userId = params.id;

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

    if (!contracts.length) {
      return NextResponse.json(
        { error: "No deployed contracts found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ userId, contracts });
  } catch (error) {
    console.error("Error fetching deployed contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployed contracts" },
      { status: 500 }
    );
  }
}
