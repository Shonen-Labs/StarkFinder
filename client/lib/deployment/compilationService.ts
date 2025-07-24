// lib/deployment/compilationService.ts
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import chalk from "chalk";
import { CompilationResult } from "@/types/deployment";
import { getContractsPath, normalizePaths } from "./fileOperations";

const execAsync = promisify(exec);

export class CompilationService {
  static async checkScarbVersion(): Promise<void> {
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

  static async cleanupBuildArtifacts(): Promise<void> {
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

  static async compileCairo(): Promise<CompilationResult> {
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
      await this.checkScarbVersion();

      const scarbPath = getContractsPath("Scarb.toml");
      console.log(chalk.blue(`🔍 Checking for Scarb.toml at: ${scarbPath}`));
      await fs.access(scarbPath);
      console.log(chalk.green("✓ Scarb.toml found"));

      console.log(chalk.blue("📦 Starting Cairo compilation..."));
      const startTime = Date.now();

      // Clean previous build artifacts
      await this.cleanupBuildArtifacts();

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
}