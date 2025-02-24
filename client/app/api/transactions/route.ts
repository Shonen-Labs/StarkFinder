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
  INVESTMENT_RECOMMENDATION_PROMPT,
  transactionIntentPromptTemplate,
  investmentRecommendationPromptTemplate,
} from "@/prompts/prompts";

import { 
  START,
  END,
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

// LangGraph workflow setup
const initialCallModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = [
    await systemMessage.format({ brianai_answer: "How can I assist you?" }),
    ...state.messages,
  ];
  const response = await llm.invoke(messages);
  return { messages: response };
};

const callModel = async (
  state: typeof MessagesAnnotation.State,
  chatId?: any
) => {
  if (!chatId) {
    return await initialCallModel(state);
  }
  const actualChatId = chatId?.configurable?.additional_args?.chatId || chatId;
  const chatHistory = await getChatHistory(actualChatId);
  const currentMessage = state.messages[state.messages.length - 1];

  if (chatHistory.length > 0) {
    const summaryPrompt = `
    Distill the following chat history into a single summary message. 
    Include as many specific details as you can.
    IMPORTANT NOTE: Include all information related to user's nature about trading and what kind of trader he/she is. 
    `;
    const summary = await llm.invoke([
      ...chatHistory,
      { role: "user", content: summaryPrompt },
    ]);

    const response = await llm.invoke([
      await systemMessage.format({ brianai_answer: "How can I assist you?" }),
      summary,
      currentMessage,
    ]);

    return {
      messages: [summary, currentMessage, response],
    };
  } else {
    return await initialCallModel(state);
  }
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);
const app = workflow.compile({ checkpointer: new MemorySaver() });

// Fetch chat history
async function getChatHistory(chatId: string) {
  try {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { id: "asc" },
    });

    const formattedHistory = messages.flatMap((msg: any) => {
      const content = msg.content as any[];
      return content.map((c) => ({
        role: c.role,
        content: c.content,
      }));
    });

    return formattedHistory;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}

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

// Investment Recommendation Logic
async function generateInvestmentRecommendations(
  userPreferences: UserPreferences,
  tokens: any[],
  yields: any[],
  messages: any[] = []
): Promise<InvestmentRecommendation> {
  try {
    const conversationHistory = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const formattedPrompt = await investmentRecommendationPromptTemplate.format(
      {
        INVESTMENT_RECOMMENDATION_PROMPT,
        userPreferences: JSON.stringify(userPreferences),
        tokens: JSON.stringify(tokens),
        yields: JSON.stringify(yields),
        conversationHistory,
      }
    );

    const jsonOutputParser = new StringOutputParser();
    const response = await llm.pipe(jsonOutputParser).invoke(formattedPrompt);
    const recommendationData = JSON.parse(response);

    if (!recommendationData.data?.pools || !recommendationData.data?.strategy) {
      throw new Error("Invalid recommendation format");
    }

    return {
      solver: recommendationData.solver || "OpenAI-Investment-Advisor",
      type: "recommendation",
      extractedParams: {
        riskTolerance:
          recommendationData.extractedParams.riskTolerance ||
          userPreferences.riskTolerance,
        investmentHorizon:
          recommendationData.extractedParams.investmentHorizon ||
          userPreferences.investmentHorizon,
        preferredAssets:
          recommendationData.extractedParams.preferredAssets ||
          userPreferences.preferredAssets,
        preferredChains:
          recommendationData.extractedParams.preferredChains ||
          userPreferences.preferredChains,
      },
      data: recommendationData.data,
    };
  } catch (error) {
    console.error("Error generating investment recommendations:", error);
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

    // Determine if the prompt is transaction-related
    const isTransactionPrompt =
      prompt.toLowerCase().includes("swap") ||
      prompt.toLowerCase().includes("transfer") ||
      prompt.toLowerCase().includes("bridge") ||
      prompt.toLowerCase().includes("deposit") ||
      prompt.toLowerCase().includes("withdraw");

    // Use getOrCreateTransactionChat for transaction prompts, otherwise use createOrGetChat
    const chat = isTransactionPrompt
      ? await getOrCreateTransactionChat(userId)
      : await createOrGetChat(userId);

    // Store the user's message
    await storeMessage({
      content: [{ role: "user", content: prompt }],
      chatId: chat.id,
      userId,
    });

    if (isTransactionPrompt) {
      // Handle transaction-related prompts
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
    } else if (prompt.toLowerCase().includes("recommend") || prompt.toLowerCase().includes("invest")) 
      {
        // Handle investment recommendations
        const tokens = await fetchTokenData();
        const yields = await fetchYieldData();

        if (!userPreferences) {
          throw new Error("User preferences are required for investment recommendations");
        }

        const recommendations = await generateInvestmentRecommendations(
          userPreferences,
          tokens,
          yields,
          messages
        );

        await storeMessage({
          content: [
            {
              role: "assistant",
              content: recommendations.data.description,
              recommendationData: recommendations,
            },
          ],
          chatId: chat.id,
          userId,
        });

        return NextResponse.json({
          result: [
            {
              data: {
                description: recommendations.data.description,
                recommendations,
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
    const chat = await prisma.chat.upsert({
      where: { userId_type: { userId, type: "TRANSACTION" } },
      update: {}, // No updates needed if the chat already exists
      create: {
        userId,
        type: "TRANSACTION",
      },
    });
    return chat;
  } catch (error) {
    console.error("Error creating or fetching transaction chat:", error);
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
    const { prompt, address, messages = [], chainId = process.env.DEFAULT_CHAIN_ID || "4012", userPreferences } = body;

    if (!prompt || !address) {
      return NextResponse.json(
        { error: "Missing required parameters (prompt or address)" },
        { status: 400 }
      );
    }

    return await handleMessage({
      prompt,
      address,
      chainId,
      messages,
      userPreferences,
    });
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
