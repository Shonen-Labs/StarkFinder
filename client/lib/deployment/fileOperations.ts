// lib/deployment/fileOperations.ts
import path from "path";
import { promises as fs } from "fs";
import chalk from "chalk";

export function getContractsPath(...paths: string[]) {
  return path.join(process.cwd(), "..", "contracts", ...paths);
}

export function normalizePaths(output: string): string {
  const contractsPath = path.resolve(getContractsPath()); // normalized absolute path
  const escapedContractsPath = contractsPath.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  const contractsRegex = new RegExp(escapedContractsPath, "g");
  const cacheRegex =
    /\/home\/[^\/]+\/\.cache\/scarb\/registry\/git\/checkouts/g;

  return output
    .replace(contractsRegex, "devx/contracts")
    .replace(cacheRegex, "devx/.cache/scarb/registry/git/checkouts");
}

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
  return {
    sierraCode,
    casmCode,
  };
}

export async function validateCompilation(contractName: string): Promise<boolean> {
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
    if (availableContracts.includes(name)) {
      return name;
    }
  }
  return availableContracts.length > 0 ? availableContracts[0] : null;
}