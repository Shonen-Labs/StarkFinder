/* eslint-disable @typescript-eslint/no-unused-vars */
import { CairoContractGenerator } from '@/lib/devxstark/contract-generator1';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout for the request
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const { nodes, edges, flowSummary, userId } = await req.json();

    // Validate input
    if (
      !Array.isArray(nodes) ||
      !Array.isArray(edges) ||
      typeof flowSummary !== 'string' ||
      typeof userId !== 'string'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid input format. Expected arrays for nodes and edges, string for flowSummary, and string for userId.',
          received: {
            nodes: typeof nodes,
            edges: typeof edges,
            flowSummary: typeof flowSummary,
            userId: typeof userId,
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
          return `${key}: [${value.join(', ')}]`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');

    const generator = new CairoContractGenerator();

    // Create a response object that supports streaming
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

            // Save the contract source code
            const savedPath = await generator.saveContract(result.sourceCode, 'lib');

            const contractRecord = await prisma.deployedContract.create({
              data: {
                userId: userId,
                sourceCode: result.sourceCode,
                path: savedPath,
                createdAt: new Date(),
                status: 'generated',
                metadata: {
                  summary: flowSummaryJSON,
                },
                schema: { nodes, edges, flowSummary },
                generatedId: null, 
              },
            });

            // Send final success message
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: 'complete',
                  success: true,
                  message: 'Contract generated and saved successfully',
                  path: savedPath,
                  contractId: contractRecord.id,
                }) + '\n'
              )
            );
          } catch (error) {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: 'error',
                  error:
                    error instanceof Error ? error.message : 'An unexpected error occurred',
                }) + '\n'
              )
            );
          } finally {
            controller.close();
            clearTimeout(timeoutId);
          }
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
    clearTimeout(timeoutId);

    console.error('API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
