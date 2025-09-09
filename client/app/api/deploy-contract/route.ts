/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { NextRequest, NextResponse } from "next/server";
import chalk from "chalk";
import { Calldata } from "starknet";
import { validateEnvironment } from "@/lib/deploy/utils";
import { saveContractFiles, compileCairo, validateCompilation, findCompiledContractName, cleanupBuildArtifacts } from "@/lib/deploy/files";
import { validateContract, validateConstructorArgs, needsConstructorArgs, parseConstructorCalldata } from "@/lib/deploy/validation";
import { createProvider, createAccount, testRpc, logEthBalance } from "@/lib/deploy/network";
import { declareAndDeploy } from "@/lib/deploy/deployer";

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

  const { contractName = "lib", userId, sourceCode, scarbToml, constructorArgs, generatedContractId } = requestBody;

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

  if (needsConstructorArgs(sourceCode)) {
      if (!constructorArgs) {
        console.error(chalk.red("❌ Missing Constructor Args"));
        return NextResponse.json(
          {
            success: false,
            error: "Missing required field: constructorArgs",
            details: "constructorArgs configuration is required for deployment",
          },
          { status: 400 }
        );
      } else {
    await validateConstructorArgs(sourceCode, JSON.parse(constructorArgs));
      }
    }

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
          errorLog: compilation.errorLog,
        },
        { status: 500 }
      );
    }

  let actualContractName = await findCompiledContractName(contractName, compilation.contracts);

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
    let provider;
    try {
      provider = createProvider();
      await testRpc(provider);
    } catch (error) {
      console.error(chalk.red("❌ RPC test failed:"), error);
      return NextResponse.json(
        { success: false, error: "RPC provider unavailable", details: "Starknet provider failed to respond. Try again later." },
        { status: 503 }
      );
    }

    const account = createAccount(provider);
    await logEthBalance(provider, account);
    console.log(chalk.blue(`📍 Account address: ${account.address}`));

    let constructorData: Calldata = [];
    if (constructorArgs && needsConstructorArgs(sourceCode)) {
      const { sierraCode } = await (await import("@/lib/deploy/files")).getCompiledCode(actualContractName);
      constructorData = parseConstructorCalldata(sierraCode, JSON.parse(constructorArgs));
    }

    const outcome = await declareAndDeploy(
      { account, provider, sourceCode, scarbToml, contractName, userId, generatedContractId, constructorCalldata: constructorData },
      actualContractName
    );

    await cleanupBuildArtifacts();

    return NextResponse.json({ success: true, ...outcome, generatedContractDeleted: !!generatedContractId });
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

  await cleanupBuildArtifacts().catch(() => {});

    return NextResponse.json(
      { success: false, error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: userId } = context.params;

  const contracts = await (await import("@/lib/db")).default.deployedContract.findMany({
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
