/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { CairoContractGenerator } from "@/lib/devxstark/contract-generator1";
import prisma from "@/lib/db";
import { getOrCreateUser } from "@/app/api/transactions/helper";
import { DojoContractGenerator } from "@/lib/devxstark/dojo-contract-generator";
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const signal = controller.signal;

  // Increase timeout to 120 seconds to prevent 504 errors
  const timeoutId = setTimeout(() => controller.abort(), 120000);

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

    // Clear lib.cairo before generation to fix pre-generated contract issue
    await clearLibCairo();

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
        { error: "Invalid blockchain type specified" },
        { status: 400 }
      );
    }

    // Create a response object that supports streaming with Server-Sent Events
    const response = new NextResponse(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let accumulatedContent = "";
          let hasStarted = false;

          // Send initial status
          const sendMessage = (data: any) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          // Helper function to extract code from content
          const extractCodeFromContent = (content: string): string => {
            // Look for ALL Cairo/Rust code blocks
            const cairoCodeBlockRegex = /```(?:cairo|rust)?\s*([\s\S]*?)```/g;
            const matches = [...content.matchAll(cairoCodeBlockRegex)];
            
            if (matches && matches.length > 0) {
              // Get the LAST code block (most recent/final)
              const lastMatch = matches[matches.length - 1];
              const code = lastMatch[1]?.trim() || '';
              
              // Ensure it contains a proper Cairo contract
              if (code.includes('mod contract') || code.includes('#[starknet::contract]')) {
                return code;
              }
            }
            
            // If no proper code blocks found, look for mod contract pattern directly
            const modContractRegex = /mod contract\s*\{[\s\S]*?\n\}/g;
            const contractMatches = [...content.matchAll(modContractRegex)];
            
            if (contractMatches && contractMatches.length > 0) {
              return contractMatches[contractMatches.length - 1][0].trim();
            }
            
            return '';
          };

          try {
            sendMessage({ 
              status: 'starting', 
              message: 'Initializing contract generation...' 
            });

            sendMessage({ 
              status: 'cleared', 
              message: 'Cleared existing contract content' 
            });

            sendMessage({ 
              status: 'generating', 
              message: 'Generating contract from blocks...' 
            });

            // Generate the contract with progress tracking
            const result = await generator.generateContract(bodyOfTheCall, {
              onProgress: (chunk) => {
                accumulatedContent += chunk;
                
                // Send streaming progress updates
                if (!hasStarted && chunk.trim()) {
                  hasStarted = true;
                  sendMessage({ 
                    status: 'streaming', 
                    message: 'Receiving contract code...',
                    content: chunk
                  });
                } else if (hasStarted) {
                  sendMessage({ 
                    status: 'streaming', 
                    content: chunk,
                    message: 'Generating contract...'
                  });
                }
              },
            });

            if (!result.success) {
              throw new Error(result.error || "Failed to generate source code.");
            }

            // Extract final clean code
            let finalCode = result.sourceCode || "";
            
            // If the result doesn't look like proper code, try extracting from accumulated content
            if (!finalCode.includes('mod contract') && !finalCode.includes('#[starknet::contract]')) {
              const extractedFinalCode = extractCodeFromContent(accumulatedContent);
              if (extractedFinalCode) {
                finalCode = extractedFinalCode;
              }
            }

            // Additional fallback - if still no proper code, use accumulated content directly
            if (!finalCode || finalCode.length < 50) {
              const cleanedContent = accumulatedContent.replace(/```(?:cairo|rust)?\n?/g, '').trim();
              if (cleanedContent.length > 50) {
                finalCode = cleanedContent;
              }
            }

            if (!finalCode || finalCode.length < 50) {
              throw new Error("Generated code is empty or too short");
            }

            sendMessage({ 
              status: 'saving', 
              message: 'Saving contract to file...' 
            });

            // Save the contract source code to lib.cairo
            const savedPath = await generator.saveContract(finalCode, "lib");
            
            // Also save to a timestamped file for history
            await saveContractWithTimestamp(finalCode, blockchain as string);

            sendMessage({ 
              status: 'database', 
              message: 'Saving to database...' 
            });

            // Save to database
            await getOrCreateUser(userId);
            await prisma.generatedContract.create({
              data: {
                name: "Generated Contract",
                sourceCode: finalCode,
                userId,
              },
            });

            // Send the final complete contract
            sendMessage({ 
              status: 'completed', 
              message: 'Contract generation completed successfully!',
              contract: finalCode,
              savedPath: savedPath
            });

          } catch (error) {
            console.error('Generation error:', error);
            sendMessage({ 
              status: 'error', 
              message: error instanceof Error ? error.message : "An unexpected error occurred",
              error: true
            });
          } finally {
            controller.close();
            clearTimeout(timeoutId);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
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

async function clearLibCairo(): Promise<void> {
  try {
    const libCairoPath = path.join(process.cwd(), "../contracts/src/lib.cairo");
    
    // Write empty content to clear the file
    const emptyContent = "// This file is automatically cleared and populated during contract generation\n// Generated contracts will appear here\n";
    await fs.writeFile(libCairoPath, emptyContent, 'utf-8');
    
    console.log('Successfully cleared lib.cairo');
  } catch (error) {
    console.error('Error clearing lib.cairo:', error);
    // If file doesn't exist, create directory structure and file
    try {
      const libCairoPath = path.join(process.cwd(), "../contracts/src/lib.cairo");
      const dir = path.dirname(libCairoPath);
      await fs.mkdir(dir, { recursive: true });
      
      const emptyContent = "// This file is automatically cleared and populated during contract generation\n// Generated contracts will appear here\n";
      await fs.writeFile(libCairoPath, emptyContent, 'utf-8');
    } catch (createError) {
      console.error('Error creating lib.cairo:', createError);
    }
  }
}

async function saveContractWithTimestamp(contractCode: string, blockchain: string): Promise<string> {
  try {
    // Create generated contracts directory if it doesn't exist
    const generatedDir = path.join(process.cwd(), "../contracts/generated");
    await fs.mkdir(generatedDir, { recursive: true });
    
    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${blockchain}_contract_${timestamp}.cairo`;
    const filePath = path.join(generatedDir, filename);
    
    // Save contract with metadata header
    const contractWithMetadata = `// Generated on: ${new Date().toISOString()}
// Blockchain: ${blockchain}
// Auto-generated by StarkFinder DevX

${contractCode}`;
    
    await fs.writeFile(filePath, contractWithMetadata, 'utf-8');
    console.log(`Contract saved to: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('Error saving timestamped contract:', error);
    return '';
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Contract generation API is running',
    timestamp: new Date().toISOString()
  });
}