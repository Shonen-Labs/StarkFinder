/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { CairoContractGenerator } from "@/lib/devxstark/contract-generator1";
import prisma from "@/lib/db";
import { getOrCreateUser } from "@/app/api/transactions/helper";
import { DojoContractGenerator } from "@/lib/devxstark/dojo-contract-generator";

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

    // Create a response object that supports streaming
    const response = new NextResponse(
      new ReadableStream({
        async start(controller) {
          let accumulatedContent = "";

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
            // Generate the contract - accumulate content silently
            const result = await generator.generateContract(bodyOfTheCall, {
              onProgress: (chunk) => {
                accumulatedContent += chunk;
              },
            });

            if (!result.success || !result.sourceCode) {
              throw new Error(result.error || "Failed to generate source code.");
            }

            // Extract final clean code
            let finalCode = result.sourceCode;
            
            // If the result doesn't look like proper code, try extracting from accumulated content
            if (!finalCode.includes('mod contract') && !finalCode.includes('#[starknet::contract]')) {
              const extractedFinalCode = extractCodeFromContent(accumulatedContent);
              if (extractedFinalCode) {
                finalCode = extractedFinalCode;
              }
            }

            if (!finalCode || finalCode.length < 50) {
              throw new Error("Generated code is empty or too short");
            }

            // Save the contract source code
            const savedPath = await generator.saveContract(finalCode, "lib");
            
            await getOrCreateUser(userId);
            await prisma.generatedContract.create({
              data: {
                name: "Generated Contract",
                sourceCode: finalCode,
                userId,
              },
            });

            // Send ONLY the final clean code
            controller.enqueue(new TextEncoder().encode(finalCode));

          } catch (error) {
            console.error('Generation error:', error);
            controller.enqueue(
              new TextEncoder().encode(`// Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`)
            );
          } finally {
            controller.close();
            clearTimeout(timeoutId);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
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