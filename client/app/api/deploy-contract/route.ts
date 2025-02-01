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

function getContractsPath(...paths: string[]) {
  return path.join(process.cwd(), "..", "contracts", ...paths);
}

const execAsync = promisify(exec);

async function compileCairo(): Promise<CompilationResult> {
  try {
    await execAsync("scarb --version");
    const scarbPath = getContractsPath("Scarb.toml");
    await fs.access(scarbPath);

    console.log(chalk.blue("📦 Starting Cairo compilation..."));
    const startTime = Date.now();

    const { stderr } = await execAsync("scarb build", {
      cwd: getContractsPath(),
    });

    if (stderr && !stderr.includes("Finished")) {
      throw new Error(`Compilation error: ${stderr}`);
    }

    const targetDir = getContractsPath("target", "dev");
    const files = await fs.readdir(targetDir);

    const contractFiles = files.filter(
      (file) =>
        file.endsWith(".contract_class.json") ||
        file.endsWith(".compiled_contract_class.json")
    );

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
    const file = await fs.readFile(filePath);
    return JSON.parse(file.toString("ascii"));
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
    "STARKNET_PROVIDER_URL",
  ];

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

export async function POST(req: NextRequest) {
  try {
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

    const { contractName = 'lib', userId } = await req.json();

    const isValid = await validateCompilation(contractName);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Contract ${contractName} not found in compilation output`,
          details: `Available contracts: ${compilation.contracts.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log('Initializing Starknet provider...');
    const provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL,
    });

    const account = new Account(
      provider,
      process.env.ACCOUNT_ADDRESS!,
      process.env.OZ_ACCOUNT_PRIVATE_KEY!
    );

    console.log('Reading compiled contract code...');
    const { sierraCode, casmCode } = await getCompiledCode(contractName);

    console.log('Declaring contract...');
    const declareResponse = await account.declare({
      contract: sierraCode,
      casm: casmCode,
    });

    console.log('Waiting for declaration transaction...');
    await provider.waitForTransaction(declareResponse.transaction_hash);

    console.log('Deploying contract...');
    const deployResponse = await account.deployContract({
      classHash: declareResponse.class_hash,
    });

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

    await prisma.deployedContract.create({
      data: {
        name: contractName,
        sourceCode: JSON.stringify(sierraCode),
        userId,
        contractAddress: contract.address,
        classHash: declareResponse.class_hash,
        transactionHash: deployResponse.transaction_hash,
      },
    });

    return NextResponse.json({
      success: true,
      contractAddress: contract.address,
      classHash: declareResponse.class_hash,
      transactionHash: deployResponse.transaction_hash,
    });
  } catch (error) {
    console.error('Contract deployment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Contract deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}