import { NextRequest, NextResponse } from "next/server";
import { RpcProvider, Account, Contract } from "starknet";
import path from "path";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import prisma from '@/lib/db';

interface CompilationResult {
  success: boolean;
  contracts: string[];
  error?: string;
}

interface DeploymentRequest {
  contractName?: string;
  userId?: string;
  contractCode?: string;
  networkType?: 'mainnet' | 'testnet' | 'devnet';
}

function getContractsPath(...paths: string[]) {
  return path.join(process.cwd(), "..", "contracts", ...paths);
}

const execAsync = promisify(exec);

async function compileCairo(): Promise<CompilationResult> {
  try {
    // Check if Scarb is available
    try {
      await execAsync("scarb --version");
    } catch (scarbError) {
      throw new Error("Scarb is not installed or not available in PATH. Please install Scarb first.");
    }

    const scarbPath = getContractsPath("Scarb.toml");
    await fs.access(scarbPath);

    console.log(chalk.blue("📦 Starting Cairo compilation..."));
    const startTime = Date.now();

    const { stderr, stdout } = await execAsync("scarb build", {
      cwd: getContractsPath(),
      timeout: 120000, // Increase timeout to 2 minutes
    });

    // Log build output for debugging
    if (stdout) {
      console.log(chalk.gray("Build output:"), stdout);
    }

    if (stderr && !stderr.includes("Finished") && !stderr.includes("Compiling")) {
      console.warn(chalk.yellow("Build warnings:"), stderr);
    }

    const targetDir = getContractsPath("target", "dev");
    
    // Check if target directory exists
    try {
      await fs.access(targetDir);
    } catch (targetError) {
      throw new Error(`Target directory not found: ${targetDir}. Compilation may have failed.`);
    }

    const files = await fs.readdir(targetDir);

    const contractFiles = files.filter(
      (file) =>
        file.endsWith(".contract_class.json") ||
        file.endsWith(".compiled_contract_class.json")
    );

    if (contractFiles.length === 0) {
      throw new Error("No compiled contract files found. Check your Cairo code for syntax errors.");
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
    contracts.forEach((contract) => {
      console.log(chalk.cyan(`   - ${contract}`));
    });

    return {
      success: true,
      contracts,
    };
  } catch (error) {
    console.error(chalk.red("❌ Compilation failed:"));
    console.error(
      chalk.red(error instanceof Error ? error.message : "Unknown error")
    );

    return {
      success: false,
      contracts: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function validateCompilation(contractName: string): Promise<boolean> {
  const targetDir = getContractsPath("target", "dev");

  try {
    await Promise.all([
      fs.access(path.join(targetDir, `${contractName}.contract_class.json`)),
      fs.access(
        path.join(targetDir, `${contractName}.compiled_contract_class.json`)
      ),
    ]);
    return true;
  } catch {
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

  const code = [sierraFilePath, casmFilePath].map(async (filePath) => {
    try {
      const file = await fs.readFile(filePath);
      return JSON.parse(file.toString("ascii"));
    } catch (error) {
      throw new Error(`Failed to read compiled contract file: ${filePath}`);
    }
  });

  const [sierraCode, casmCode] = await Promise.all(code);

  return {
    sierraCode,
    casmCode,
  };
}

async function validateEnvironment(): Promise<{
  valid: boolean;
  error?: string;
}> {
  const requiredEnvVars = [
    "OZ_ACCOUNT_PRIVATE_KEY",
    "ACCOUNT_ADDRESS",
    "STARKNET_RPC_URL",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    return {
      valid: false,
      error: `Missing environment variables: ${missingVars.join(", ")}. Please check your .env file.`,
    };
  }

  // Validate environment variable formats
  if (process.env.ACCOUNT_ADDRESS && !process.env.ACCOUNT_ADDRESS.startsWith('0x')) {
    return {
      valid: false,
      error: "ACCOUNT_ADDRESS must start with '0x'"
    };
  }

  if (process.env.OZ_ACCOUNT_PRIVATE_KEY && !process.env.OZ_ACCOUNT_PRIVATE_KEY.startsWith('0x')) {
    return {
      valid: false,
      error: "OZ_ACCOUNT_PRIVATE_KEY must start with '0x'"
    };
  }

  return { valid: true };
}

async function checkLibCairoExists(): Promise<boolean> {
  try {
    const libCairoPath = getContractsPath("src", "lib.cairo");
    await fs.access(libCairoPath);
    
    // Check if file has content (not just empty or comments)
    const content = await fs.readFile(libCairoPath, 'utf-8');
    const meaningfulContent = content
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('//'))
      .join('\n');
      
    return meaningfulContent.length > 50; // Reasonable minimum for a contract
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    const body: DeploymentRequest = await req.json();
    const { contractName = 'lib', userId = 'default-user', contractCode, networkType = 'testnet' } = body;

    console.log(`Starting deployment process for contract: ${contractName}`);

    // Validate environment first
    const envValidation = await validateEnvironment();
    if (!envValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Environment configuration error',
          details: envValidation.error,
        },
        { status: 500 }
      );
    }

    // If contract code is provided, save it to lib.cairo first
    if (contractCode) {
      const libCairoPath = getContractsPath("src", "lib.cairo");
      try {
        await fs.writeFile(libCairoPath, contractCode, 'utf-8');
        console.log('Contract code saved to lib.cairo');
      } catch (saveError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to save contract code',
            details: saveError instanceof Error ? saveError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Check if lib.cairo exists and has content
    const libExists = await checkLibCairoExists();
    if (!libExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'No contract found to deploy',
          details: 'lib.cairo is missing or empty. Please generate a contract first.',
        },
        { status: 400 }
      );
    }

    console.log('Starting contract compilation...');
    const compilation = await compileCairo();
    if (!compilation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Compilation failed',
          details: compilation.error,
        },
        { status: 500 }
      );
    }

    const isValid = await validateCompilation(contractName);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Contract ${contractName} not found in compilation output`,
          details: `Available contracts: ${compilation.contracts.join(', ')}. Make sure your contract name matches the compiled output.`,
        },
        { status: 400 }
      );
    }

    console.log('Initializing Starknet provider...');
    const provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL,
    });

    // Test provider connection
    try {
      await provider.getChainId();
    } catch (providerError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to connect to StarkNet provider',
          details: `Check your STARKNET_RPC_URL: ${providerError instanceof Error ? providerError.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }

    const account = new Account(
      provider,
      process.env.ACCOUNT_ADDRESS!,
      process.env.OZ_ACCOUNT_PRIVATE_KEY!
    );

    // Verify account exists
    try {
      await account.getNonce();
    } catch (accountError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid account configuration',
          details: `Account not found or invalid private key: ${accountError instanceof Error ? accountError.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }

    console.log('Reading compiled contract code...');
    const { sierraCode, casmCode } = await getCompiledCode(contractName);

    console.log('Declaring contract...');
    const declareResponse = await account.declare({
      contract: sierraCode,
      casm: casmCode,
    });

    console.log(`Declaration transaction hash: ${declareResponse.transaction_hash}`);
    console.log('Waiting for declaration transaction...');
    await provider.waitForTransaction(declareResponse.transaction_hash);

    console.log('Deploying contract...');
    const deployResponse = await account.deployContract({
      classHash: declareResponse.class_hash,
    });

    console.log(`Deployment transaction hash: ${deployResponse.transaction_hash}`);
    console.log('Waiting for deployment transaction...');
    await provider.waitForTransaction(deployResponse.transaction_hash);

    const { abi } = await provider.getClassByHash(declareResponse.class_hash);
    if (!abi) {
      throw new Error('No ABI found for deployed contract');
    }

    const contract = new Contract(
      abi,
      deployResponse.contract_address,
      provider
    );

    console.log('Contract deployment successful!');
    console.log(`Contract address: ${contract.address}`);
    console.log(`Class hash: ${declareResponse.class_hash}`);

    // Save deployment to database
    try {
      const sourceCodeToSave = contractCode || JSON.stringify(sierraCode);
      
      await prisma.deployedContract.create({
        data: {
          name: contractName,
          sourceCode: sourceCodeToSave,
          userId,
          contractAddress: contract.address,
          classHash: declareResponse.class_hash,
          transactionHash: deployResponse.transaction_hash,
        },
      });
      console.log('Deployment saved to database');
    } catch (dbError) {
      console.warn('Failed to save to database:', dbError);
      // Don't fail the deployment if database save fails
    }

    return NextResponse.json({
      success: true,
      contractAddress: contract.address,
      classHash: declareResponse.class_hash,
      transactionHash: deployResponse.transaction_hash,
      casmHash: declareResponse.class_hash, // For backwards compatibility
      networkType,
    });

  } catch (error) {
    console.error('Contract deployment error:', error);
    
    let errorMessage = 'Contract deployment failed';
    let details = 'Unknown error';
    
    if (error instanceof Error) {
      details = error.message;
      
      // Provide more specific error messages based on error type
      if (error.message.includes('timeout')) {
        errorMessage = 'Deployment timeout';
        details = 'The deployment took too long. This might be due to network congestion. Please try again.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds';
        details = 'Your account does not have enough funds to deploy the contract. Please add funds and try again.';
      } else if (error.message.includes('nonce')) {
        errorMessage = 'Nonce error';
        details = 'Transaction nonce issue. Please try again in a few moments.';
      } else if (error.message.includes('declare')) {
        errorMessage = 'Contract declaration failed';
        details = 'The contract could not be declared. Check your contract code for errors.';
      } else if (error.message.includes('deploy')) {
        errorMessage = 'Contract deployment failed';
        details = 'The contract declaration succeeded but deployment failed. Please try again.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: details,
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Deploy contract API is running',
    timestamp: new Date().toISOString(),
    environment: {
      hasPrivateKey: !!process.env.OZ_ACCOUNT_PRIVATE_KEY,
      hasAccountAddress: !!process.env.ACCOUNT_ADDRESS,
      hasRpcUrl: !!process.env.STARKNET_RPC_URL,
    }
  });
}