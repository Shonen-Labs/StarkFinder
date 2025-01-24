/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse, NextRequest } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { transactionProcessor } from "@/lib/transaction";

import type {
  BrianResponse,
  BrianTransactionData,
} from "@/lib/transaction/types";
import {
  TRANSACTION_INTENT_PROMPT,
  transactionIntentPromptTemplate,
} from "@/prompts/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const llm = new ChatOpenAI({
  model: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
});

async function getTransactionIntentFromOpenAI(
  prompt: string,
  address: string,
  chainId: string,
  messages: any[]
): Promise<BrianResponse> {
  try {
    const conversationHistory = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const formattedPrompt = await transactionIntentPromptTemplate.format({
      TRANSACTION_INTENT_PROMPT,
      prompt,
      chainId,
      conversationHistory,
    });

    const jsonOutputParser = new StringOutputParser();
    const response = await llm.pipe(jsonOutputParser).invoke(formattedPrompt);
    const intentData = JSON.parse(response);

    if (!intentData.isTransactionIntent) {
      throw new Error("Not a transaction-related prompt");
    }

    const intentResponse: BrianResponse = {
      solver: intentData.solver || "OpenAI-Intent-Recognizer",
      action: intentData.action,
      type: "write",
      extractedParams: {
        action: intentData.extractedParams.action,
        token1: intentData.extractedParams.token1 || "",
        token2: intentData.extractedParams.token2 || "",
        chain: intentData.extractedParams.chain || "",
        amount: intentData.extractedParams.amount || "",
        protocol: intentData.extractedParams.protocol || "",
        address: intentData.extractedParams.address || address,
        dest_chain: intentData.extractedParams.dest_chain || "",
        destinationChain: intentData.extractedParams.dest_chain || "",
        destinationAddress:
          intentData.extractedParams.destinationAddress || address,
      },
      data: {} as BrianTransactionData,
    };

    const value = 10 ** 18;
    const weiAmount = BigInt(intentData.extractedParams.amount * value);

    switch (intentData.action) {
      case "swap":
      case "transfer":
        intentResponse.data = {
          description: intentData.data?.description || "",
          steps:
            intentData.extractedParams.transaction?.contractAddress ||
            intentData.extractedParams.transaction?.entrypoint ||
            intentData.extractedParams.transaction?.calldata
              ? [
                  {
                    contractAddress:
                      intentData.extractedParams.transaction.contractAddress,
                    entrypoint:
                      intentData.extractedParams.transaction.entrypoint,
                    calldata: [
                      intentData.extractedParams.destinationAddress ||
                        intentData.extractedParams.address,
                      weiAmount.toString(),
                      "0",
                    ],
                  },
                ]
              : [],
          fromToken: {
            symbol: intentData.extractedParams.token1 || "",
            address: intentData.extractedParams.address || "",
            decimals: 1,
          },
          toToken: {
            symbol: intentData.extractedParams.token2 || "",
            address: intentData.extractedParams.address || "",
            decimals: 1,
          },
          fromAmount: intentData.extractedParams.amount,
          toAmount: intentData.extractedParams.amount,
          receiver: intentData.extractedParams.address,
          amountToApprove: intentData.data?.amountToApprove,
          gasCostUSD: intentData.data?.gasCostUSD,
        };
        break;

      case "bridge":
        intentResponse.data = {
          description: "",
          steps: [],
          bridge: {
            sourceNetwork: intentData.extractedParams.chain || "",
            destinationNetwork: intentData.extractedParams.dest_chain || "",
            sourceToken: intentData.extractedParams.token1 || "",
            destinationToken: intentData.extractedParams.token2 || "",
            amount: parseFloat(intentData.extractedParams.amount || "0"),
            sourceAddress: address,
            destinationAddress:
              intentData.extractedParams.destinationAddress || address,
          },
        };
        break;

      case "deposit":
      case "withdraw":
        intentResponse.data = {
          description: "",
          steps: [],
          protocol: intentData.extractedParams.protocol || "",
          fromAmount: intentData.extractedParams.amount,
          toAmount: intentData.extractedParams.amount,
          receiver: intentData.extractedParams.address || "",
        };
        break;

      default:
        throw new Error(`Unsupported action type: ${intentData.action}`);
    }

    return intentResponse;
  } catch (error) {
    console.error("Error fetching transaction intent:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, address, messages = [], chainId = "4012" } = body;

    if (!prompt || !address) {
      return NextResponse.json(
        { error: "Missing required parameters (prompt or address)" },
        { status: 400 }
      );
    }

    try {
      const transactionIntent = await getTransactionIntentFromOpenAI(
        prompt,
        address,
        chainId,
        messages
      );
      console.log(
        "Processed Transaction Intent from OPENAI:",
        JSON.stringify(transactionIntent, null, 2)
      );

      const processedTx = await transactionProcessor.processTransaction(
        transactionIntent
      );
      console.log(
        "Processed Transaction:",
        JSON.stringify(processedTx, null, 2)
      );

      if (["deposit", "withdraw"].includes(transactionIntent.action)) {
        processedTx.receiver = address;
      }

      return NextResponse.json({
        result: [
          {
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
                  bridge: processedTx.bridge,
                },
              },
            },
            conversationHistory: messages,
          },
        ],
      });
    } catch (error) {
      console.error("Transaction processing error:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Transaction processing failed",
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
