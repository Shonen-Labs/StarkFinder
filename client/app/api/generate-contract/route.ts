/* eslint-disable @typescript-eslint/no-unused-vars */
import { CairoContractGenerator } from '@/lib/devxstark/contract-generator1';
import { User } from '@/models/User'; // Import the user schema
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // For generating unique contract IDs

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout for the request
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60000); // 60 seconds timeout

  try {
    const { userId, nodes, edges, flowSummary } = await req.json();

    // Validate input
    if (
      typeof userId !== 'string' ||
      !Array.isArray(nodes) ||
      !Array.isArray(edges) ||
      typeof flowSummary !== 'string'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid input format. Expected userId as string, arrays for nodes and edges, and a string for flowSummary.',
        },
        { status: 400 }
      );
    }

    const flowSummaryJSON = {
      nodes,
      edges,
      summary: flowSummary,
    };

    const bodyOfTheCall = JSON.stringify(flowSummaryJSON);

    const generator = new CairoContractGenerator();

    // Create a response stream
    const response = new NextResponse(
      new ReadableStream({
        async start(controller) {
          try {
            // Generate the contract
            const result = await generator.generateContract(bodyOfTheCall, {
              onProgress: (chunk) => {
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({ type: 'progress', data: chunk }) + '\n'
                  )
                );
              },
            });

            if (!result.sourceCode) {
              throw new Error('Failed to generate source code.');
            }

            // Save the generated contract in the database
            const contractId = uuidv4(); // Generate a unique contract ID
            const newContract = {
              contractId,
              sourceCode: result.sourceCode,
              deployed: false, // Default: Not deployed
              createdAt: new Date(),
            };

            // Update the user document
            const user = await User.findById(userId);
            if (!user) {
              throw new Error('User not found.');
            }

            user.contracts.push(newContract);
            await user.save();

            // Send completion message
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: 'complete',
                  success: true,
                  message: 'Contract generated and saved successfully.',
                  contract: newContract,
                }) + '\n'
              )
            );
          } catch (error) {
            // Send error message
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: 'error',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'An unexpected error occurred',
                }) + '\n'
              )
            );
          } finally {
            controller.close();
            clearTimeout(timeoutId); // Ensure timeout is cleared
          }
        },
        cancel() {
          console.error('Stream canceled');
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );

    return response;
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on error

    console.error('API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
