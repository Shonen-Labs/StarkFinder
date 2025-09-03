// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import { normalizePaths, getContractsPath } from "@/lib/deploy/utils";
import type { CompilationResult } from "@/types/deploy";

const execAsync = promisify(exec);

export async function saveContractFiles(
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

export async function cleanupBuildArtifacts() {
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

async function checkScarbVersion() {
  try {
    const { stdout } = await execAsync("scarb --version");
    const versionMatch = stdout.match(/scarb\s+(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      const version = versionMatch[1];
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

export async function compileCairo(): Promise<CompilationResult> {
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

    await cleanupBuildArtifacts();

    console.log(chalk.blue("🔨 Running scarb build..."));
    let stdout = "",
      stderr = "";
    try {
      const result = await execAsync("scarb build", {
        cwd: getContractsPath(),
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      console.log(error);
      throw error as Error;
    }

    console.log(chalk.blue("📋 Build Output:"));
    if (stdout) console.log(chalk.gray(stdout));
    if (stderr) console.log(chalk.yellow(stderr));

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
    const contractFiles = (files as string[]).filter(
      (file: string) =>
        file.endsWith(".contract_class.json") ||
        file.endsWith(".compiled_contract_class.json")
    );

    if (contractFiles.length === 0) {
      throw new Error("No compiled contracts found. Build may have failed.");
    }

  const contracts: string[] = [
      ...new Set(
    contractFiles.map((file: string) =>
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

    return { success: true, contracts };
  } catch (error) {
    console.error(chalk.red("❌ Compilation failed:"));
    const errorDetails =
      error instanceof Error ? error.message : "Unknown error";
    console.error(chalk.red(errorDetails));

    let stdout = "",
      stderr = "";
    if (error instanceof Error) {
      stdout = (error as any).stdout || "";
      stderr = (error as any).stderr || error.message;
    }

    return {
      success: false,
      contracts: [],
      error: errorDetails,
      errorLog: stdout ? normalizePaths(stdout) : stderr,
    };
  }
}

export async function validateCompilation(contractName: string): Promise<boolean> {
  const targetDir = getContractsPath("target", "dev");
  try {
    const sierraPath = path.join(targetDir, `${contractName}.contract_class.json`);
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

export async function getCompiledCode(filename: string) {
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
  return { sierraCode, casmCode };
}

export async function findCompiledContractName(
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
    if (availableContracts.includes(name)) return name;
  }
  return availableContracts.length > 0 ? availableContracts[0] : null;
}
