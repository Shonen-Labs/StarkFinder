/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { CairoContractGenerator } from "@/lib/devxstark/contract-generator1";
import { DojoContractGenerator } from "@/lib/devxstark/dojo-contract-generator";
import { scarbGenerator } from "@/lib/devxstark/scarb-generator";
import prisma from "@/lib/db";
import { getOrCreateUser } from "@/app/api/transactions/helper";
import path from "path";
import { promises as fs } from "fs";

// Helper function to save both source and Scarb files
async function saveContractWithScarb(
  sourceCode: string,
  contractName: string = "lib"
): Promise<{ sourcePath: string; scarbPath: string }> {
  const contractsDir = path.join(process.cwd(), "..", "contracts");
  const srcDir = path.join(contractsDir, "src");

  try {
    // Ensure directories exist
    await fs.mkdir(srcDir, { recursive: true });

    // Save the Cairo source code
    const sourceFilePath = path.join(srcDir, `${contractName}.cairo`);
    await fs.writeFile(sourceFilePath, sourceCode, { encoding: 'utf8', flag: 'w' });

    // Generate and save Scarb.toml
    const scarbToml = await scarbGenerator.generateScarbToml(sourceCode, contractName);
    const scarbFilePath = path.join(contractsDir, "Scarb.toml");
    await fs.writeFile(scarbFilePath, scarbToml, { encoding: 'utf8', flag: 'w' });

    // Verify files were written correctly
    const writtenSource = await fs.readFile(sourceFilePath, 'utf8');
    const writtenScarb = await fs.readFile(scarbFilePath, 'utf8');
    
    if (writtenSource !== sourceCode) {
      throw new Error('Source file content verification failed');
    }

    return {
      sourcePath: sourceFilePath,
      scarbPath: scarbFilePath
    };
  } catch (error) {
    console.error("Error saving contract files:", error);
    throw new Error(
      `Failed to save contract files: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout for the request
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const { nodes, edges, flowSummary, userId, blockchain } = await req.json();
    
    // Validate input
    if (
      !Array.isArray(nodes) ||
      !Array.isArray(edges) ||
      !Array.isArray(flowSummary)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid input format. Expected arrays for nodes and edges, and string for flowSummary.",
          received: {
            nodes: typeof nodes,
            edges: typeof edges,
            flowSummary: typeof flowSummary,
          },
        },
        { status: 400 }
      );
    }

    const flowSummaryJSON = {
      nodes,
      edges,
      summary: flowSummary,
    };

    // Create a more robust body string with proper error handling
    const bodyOfTheCall = Object.entries(flowSummaryJSON)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.join(", ")}]`;
        }
        return `${key}: ${value}`;
      })
      .join(", ");

    const generators = {
      blockchain1: new CairoContractGenerator(),
      blockchain4: new DojoContractGenerator(),
    };
    const generator = generators[blockchain as "blockchain1" | "blockchain4"];

    if (!generator) {
      return NextResponse.json(
        { error: "Invalid blockchain type" },
        { status: 400 }
      );
    }

    // Create a response object that supports streaming
    const response = new NextResponse(
      new ReadableStream({
        async start(controller) {
          let accumulatedContent = "";
          let isControllerClosed = false;

          // Helper function to safely enqueue data
          const safeEnqueue = (data: string) => {
            if (!isControllerClosed) {
              try {
                controller.enqueue(new TextEncoder().encode(data));
              } catch (error) {
                console.error("Error enqueueing data:", error);
                isControllerClosed = true;
              }
            }
          };

          // Helper function to safely close controller
          const safeClose = () => {
            if (!isControllerClosed) {
              try {
                controller.close();
                isControllerClosed = true;
              } catch (error) {
                console.error("Error closing controller:", error);
              }
            }
          };

          // Helper function to extract code from content
          const extractCodeFromContent = (content: string): string => {
            // This function is no longer needed as the DeepSeekClient now cleans the code properly
            return content.trim();
          };

          try {
            // Generate the contract with streaming
            const result = await generator.generateContract(bodyOfTheCall, {
              onProgress: (chunk) => {
                accumulatedContent += chunk;
                // Send Cairo code chunks directly without JSON wrapping
                safeEnqueue(chunk);
              },
            });
            
            if (!result.success || !result.sourceCode) {
              throw new Error(result.error || "Failed to generate source code.");
            }

            // Use the cleaned source code from the generator
            let finalCode = result.sourceCode;

            if (!finalCode || finalCode.length < 50) {
              throw new Error("Generated code is empty or too short");
            }

            // Generate Scarb.toml for the contract
            let scarbToml = "";
            try {
              scarbToml = await scarbGenerator.generateScarbToml(finalCode, "lib");
              console.log("Generated Scarb.toml successfully");
            } catch (scarbError) {
              console.error("Error generating Scarb.toml:", scarbError);
              // Use a basic fallback if generation fails
              scarbToml = `[package]
name = "generated_contract"
version = "0.1.0"
edition = "2024_07"
cairo_version = "2.8.0"

[dependencies]
starknet = "2.8.0"

[[target.starknet-contract]]
sierra = true
casm = true

[cairo]
sierra-replace-ids = true`;
            }

            // Save files
            const { sourcePath, scarbPath } = await saveContractWithScarb(finalCode, "lib");
            console.log(`Contract saved to: ${sourcePath}`);
            console.log(`Scarb.toml saved to: ${scarbPath}`);
            
            // Save to database
            await getOrCreateUser(userId);
            await prisma.generatedContract.create({
              data: {
                name: "Generated Contract",
                sourceCode: finalCode,
                scarbConfig: scarbToml,
                userId,
              },
            });

            // Send final response marker - use a special delimiter to separate streaming content from final JSON
            safeEnqueue("\n---FINAL_RESPONSE---\n");
            
            // Create a response object that includes both source code and Scarb.toml
            const responseData = {
              sourceCode: finalCode,
              scarbToml: scarbToml,
              success: true
            };

            // Send the final response as JSON
            safeEnqueue(JSON.stringify(responseData));

          } catch (error) {
            console.error('Generation error:', error);
            
            // Send error response marker
            safeEnqueue("\n---ERROR_RESPONSE---\n");
            
            const errorResponse = {
              success: false,
              error: error instanceof Error ? error.message : "An unexpected error occurred"
            };
            safeEnqueue(JSON.stringify(errorResponse));
          } finally {
            safeClose();
            clearTimeout(timeoutId);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Transfer-Encoding": "chunked",
        },
      }
    );

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}