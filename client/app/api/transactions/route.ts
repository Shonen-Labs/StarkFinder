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
  ASK_OPENAI_AGENT_PROMPT,
  TRANSACTION_INTENT_PROMPT,
  transactionIntentPromptTemplate,
  investmentRecommendationPromptTemplate,
} from "@/prompts/prompts";
import { 
  MessagesAnnotation, 
  StateGraph, 
  MemorySaver 
} from "@langchain/langgraph";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate, 
  HumanMessagePromptTemplate 
} from "@langchain/core/prompts";
import { 
  UserPreferences, 
  InvestmentRecommendation  
} from "../ask/types";
import { 
  fetchTokenData, 
  fetchYieldData, 
  getOrCreateUser, 
  createOrGetChat, 
  storeMessage 
} from "../ask/heper";

import { StringOutputParser } from "@langchain/core/output_parsers";
import prisma from "@/lib/db";
import { TxType } from "@prisma/client";

const llm = new ChatOpenAI({
  model: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
  streaming: true,
});

const systemPrompt =
  ASK_OPENAI_AGENT_PROMPT +
  `\nThe provided chat history includes a summary of the earlier conversation.`;

const systemMessage = SystemMessagePromptTemplate.fromTemplate([systemPrompt]);

const userMessage = HumanMessagePromptTemplate.fromTemplate(["{user_query}"]);

const askAgentPromptTemplate = ChatPromptTemplate.fromMessages([
  systemMessage,
  userMessage,
]);
const prompt = askAgentPromptTemplate;
// const chain = prompt.pipe(agent);

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

// Chat and Transaction Handler
async function handleMessage({
  prompt,
  address,
  chainId = "4012",
  messages = [],
  userPreferences,
}: {
  prompt: string;
  address: string;
  chainId?: string;
  messages?: any[];
  userPreferences?: UserPreferences;
}): Promise<NextResponse> {
  try {
    const userId = address || "0x0";
    await getOrCreateUser(userId);

    const chat = await createOrGetChat(userId);

    // Store the user's message
    await storeMessage({
      content: [{ role: "user", content: prompt }],
      chatId: chat.id,
      userId,
    });
    // Check if the prompt is transaction-related
    if (
      prompt.toLowerCase().includes("swap") ||
      prompt.toLowerCase().includes("transfer") ||
      prompt.toLowerCase().includes("bridge") ||
      prompt.toLowerCase().includes("deposit") ||
      prompt.toLowerCase().includes("withdraw")
    ) {
      const transactionIntent = await getTransactionIntentFromOpenAI(
        prompt,
        address,
        chainId,
        messages
      );
      const processedTx = await transactionProcessor.processTransaction(transactionIntent);

      if (["deposit", "withdraw"].includes(transactionIntent.action)) {
        processedTx.receiver = address;
      }
      const transaction = await storeTransaction(
        userId,
        transactionIntent.action,
        {
          ...processedTx,
          chainId,
          originalIntent: transactionIntent,
        }
      );
      await storeMessage({
        content: [
          {
            role: "assistant",
            content: JSON.stringify(processedTx),
            transactionId: transaction.id,
          },
        ],
        chatId: chat.id,
        userId,
      });
      return NextResponse.json({
        result: [
          {
            data: {
              description: processedTx.description,
              transaction: {
                type: processedTx.action,
                data: processedTx,
              },
            },
            conversationHistory: messages,
          },
        ],
      });
    } else {
      // Handle general chat messages
      const response = await llm.invoke([
        await systemMessage.format({ brianai_answer: "How can I assist you?" }),
        { role: "user", content: prompt },
      ]);
      await storeMessage({
        content: [
          {
            role: "assistant",
            content: response.content,
          },
        ],
        chatId: chat.id,
        userId,
      });
      return NextResponse.json({
        answer: response.content,
        chatId: chat.id,
      });
    }
  } catch (error) {
    console.error("Error handling message:", error);
    return NextResponse.json(
      { status: 500 }
    );
  }
}

async function getOrCreateTransactionChat(userId: string) {
  try {
    const chat = await prisma.chat.create({
      data: {
        userId,
        type: "TRANSACTION",
      },
    });
    return chat;
  } catch (error) {
    console.error("Error creating transaction chat:", error);
    throw error;
  }
}

async function storeTransaction(userId: string, type: string, metadata: any) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: type as TxType,
        metadata,
      },
    });
    return transaction;
  } catch (error) {
    console.error("Error storing transaction:", error);
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

    let user = await prisma.user.findFirst({
      where: { address },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { address },
      });
    }

    const chat = await getOrCreateTransactionChat(user.id);

    try {
      const transactionIntent = await getTransactionIntentFromOpenAI(
        prompt,
        address,
        chainId,
        messages
      );

      await storeMessage({
        content: [{ role: "user", content: prompt }],
        chatId: chat.id,
        userId: user.id,
      });

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

      const transaction = await storeTransaction(
        user.id,
        transactionIntent.action,
        {
          ...processedTx,
          chainId,
          originalIntent: transactionIntent,
        }
      );

      await storeMessage({
        content: [
          {
            role: "assistant",
            content: JSON.stringify(processedTx),
            transactionId: transaction.id,
          },
        ],
        chatId: chat.id,
        userId: user.id,
      });

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
