/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { transactionProcessor } from '@/lib/transaction';
import { LayerswapClient } from '@/lib/layerswap/client';
import type { BrianResponse, BrianTransactionData } from '@/lib/transaction/types';

const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent';
const layerswapClient = new LayerswapClient(process.env.LAYERSWAP_API_KEY || '');

async function convertBrianResponseFormat(apiResponse: any): Promise<BrianResponse> {
  const response = apiResponse.result[0];
  
  // Construct base response
  const brianResponse: BrianResponse = {
    solver: response.solver,
    action: response.action,
    type: response.type,
    extractedParams: response.extractedParams,
    data: {} as BrianTransactionData
  };

  // Convert data based on action type
  switch (response.action) {
    case 'swap':
    case 'transfer':
      brianResponse.data = {
        description: response.data?.description || '',
        steps: response.data?.steps?.map((step: any) => ({
          contractAddress: step.contractAddress,
          entrypoint: step.entrypoint,
          calldata: step.calldata
        })) || [],
        fromToken: response.data?.fromToken,
        toToken: response.data?.toToken,
        fromAmount: response.data?.fromAmount,
        toAmount: response.data?.toAmount,
        receiver: response.data?.receiver,
        amountToApprove: response.data?.amountToApprove,
        gasCostUSD: response.data?.gasCostUSD
      };
      break;

    case 'bridge':
      brianResponse.data = {
        description: '',
        steps: [],
        bridge: {
          sourceNetwork: response.extractedParams.chain,
          destinationNetwork: response.extractedParams.dest_chain,
          sourceToken: response.extractedParams.token1,
          destinationToken: response.extractedParams.token2,
          amount: parseFloat(response.extractedParams.amount),
          sourceAddress: response.extractedParams.address || '',
          destinationAddress: response.extractedParams.address || ''
        }
      };
      break;

    case 'deposit':
    case 'withdraw':
      brianResponse.data = {
        description: '',
        steps: [],
        protocol: response.extractedParams.protocol,
        fromAmount: response.extractedParams.amount,
        toAmount: response.extractedParams.amount,
        receiver: response.extractedParams.address || ''
      };
      break;

    default:
      throw new Error(`Unsupported action type: ${response.action}`);
  }

  return brianResponse;
}

async function getBrianTransactionData(prompt: string, address: string, chainId: string, messages: any[]): Promise<BrianResponse> {
  try {
    const response = await fetch(`${BRIAN_API_URL}/transaction`, {
      method: 'POST',
      headers: {
        'X-Brian-Api-Key': process.env.BRIAN_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt, 
        address, 
        chainId: chainId.toString(),
        messages
      }),
    });

    const data = await response.json();
    console.log('Brian API Response:', JSON.stringify(data, null, 2));

    // Special handling for intent recognition errors that still have extracted params
    if (!response.ok && data.error && data.extractedParams) {
      // If we have extracted params, we can still proceed
      if (data.extractedParams[0]) {
        // Convert to expected format
        return {
          solver: "Brian-Starknet",
          action: data.extractedParams[0].action as 'bridge',
          type: "write",
          extractedParams: data.extractedParams[0],
          data: {
            description: '',
            steps: [],
            bridge: {
              sourceNetwork: data.extractedParams[0].chain,
              destinationNetwork: data.extractedParams[0].dest_chain,
              sourceToken: data.extractedParams[0].token1,
              destinationToken: data.extractedParams[0].token2,
              amount: parseFloat(data.extractedParams[0].amount),
              sourceAddress: address,
              destinationAddress: data.extractedParams[0].address
            }
          }
        };
      }
    }

    if (!response.ok) {
      throw new Error(data.error || `API request failed with status ${response.status}`);
    }

    if (!data.result?.[0]) {
      throw new Error('Invalid response format from Brian API');
    }

    const brianResponse = data.result[0] as BrianResponse;

    // Add connected wallet address to params
    if (brianResponse.extractedParams) {
      brianResponse.extractedParams.connectedAddress = address;
    }

    return brianResponse;
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, address, messages = [], chainId = '4012' } = body;

    if (!prompt || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters (prompt or address)' },
        { status: 400 }
      );
    }

    try {
      const brianResponse = await getBrianTransactionData(prompt, address, chainId, messages);
      console.log('Processed Brian Response:', JSON.stringify(brianResponse, null, 2));
      
      // Always pass connected address to handlers
      if (brianResponse.extractedParams) {
        brianResponse.extractedParams.connectedAddress = address;
      }
      
      const processedTx = await transactionProcessor.processTransaction(brianResponse);
      console.log('Processed Transaction:', JSON.stringify(processedTx, null, 2));

      // For deposit and withdraw, always use connected address as receiver
      if (['deposit', 'withdraw'].includes(brianResponse.action)) {
        processedTx.receiver = address;
      }

      return NextResponse.json({
        result: [{
          data: {
            description: processedTx.description,
            transaction: {
              type: processedTx.action,
              data: {
                transactions: processedTx.transactions,
                fromToken: processedTx.fromToken,
                toToken: processedTx.toToken,
                fromAmount: processedTx.fromAmount,
                toAmount: processedTx.toAmount,
                receiver: processedTx.receiver,
                gasCostUSD: processedTx.estimatedGas,
                solver: processedTx.solver,
                protocol: processedTx.protocol,
                bridge: processedTx.bridge
              }
            }
          },
          conversationHistory: messages
        }]
      });
    } catch (error) {
      console.error('Transaction processing error:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Transaction processing failed',
          details: error instanceof Error ? error.stack : undefined
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}