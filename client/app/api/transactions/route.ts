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
import prisma from "@/lib/db";
import { TxType } from "@prisma/client";
import { ASK_OPENAI_AGENT_PROMPT } from "@/prompts/prompts";
import axios from "axios";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { START, END, MessagesAnnotation, MemorySaver, StateGraph } from "@langchain/langgraph";

const agent = new ChatOpenAI({
  model: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
});

const BRIAN_API_KEY = process.env.BRIAN_API_KEY || "";
const BRIAN_API_URL = "https://api.brianknows.org/api/v0/agent/knowledge";
const BRIAN_DEFAULT_RESPONSE = "🤖 Sorry, I don't know how to answer. The AskBrian feature allows you to ask for information on a custom-built knowledge base of resources. Contact the Brian team if you want to add new resources!";

// Add new prompt templates for Q&A
const systemPrompt = ASK_OPENAI_AGENT_PROMPT +
  `\nThe provided chat history includes a summary of the earlier conversation.`;
const systemMessage = SystemMessagePromptTemplate.fromTemplate(systemPrompt);
const userMessage = HumanMessagePromptTemplate.fromTemplate("{user_query}");
const askAgentPromptTemplate = ChatPromptTemplate.fromMessages([
  systemMessage,
  userMessage,
]);

async function getChatHistory(chatId: string | { configurable?: { additional_args?: { chatId?: string } } }) {
  try {
    const actualChatId = typeof chatId === 'object' && chatId.configurable?.additional_args?.chatId
      ? chatId.configurable.additional_args.chatId
      : chatId;

    if (!actualChatId || typeof actualChatId !== 'string') {
      console.warn('Invalid chat ID provided:', chatId);
      return [];
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: actualChatId
      },
      orderBy: {
        id: 'asc'
      }
    });

    const formattedHistory = messages.flatMap((msg: any) => {
      const content = msg.content as any[];
      return content.map(c => ({
        role: c.role,
        content: c.content
      }));
    });

    return formattedHistory;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

// Add LangGraph workflow setup
const initialCallModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = [
    await systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }),
    ...state.messages,
  ];
  const response = await agent.invoke(messages);
  return { messages: response };
};

const callModel = async (state: typeof MessagesAnnotation.State, chatId?: any) => {
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

    const summary = await agent.invoke([
      ...chatHistory,
      { role: "user", content: summaryPrompt },
    ]);

    const response = await agent.invoke([
      await systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }),
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

async function queryOpenAI({
  userQuery,
  brianaiResponse,
  chatId,
  streamCallback
}: {
  userQuery: string,
  brianaiResponse: string,
  chatId?: string,
  streamCallback?: (chunk: string) => Promise<void>
}): Promise<string> {
  try {
    if (streamCallback) {
      const messages = [
        await systemMessage.format({ brianai_answer: brianaiResponse }),
        { role: "user", content: userQuery }
      ];

      let fullResponse = '';
      await agent.invoke(messages, {
        callbacks: [{
          handleLLMNewToken: async (token: string) => {
            fullResponse += token;
            await streamCallback(token);
          },
        }],
      });
      return fullResponse;
    }

    const response = await app.invoke(
      {
        messages: [
          await askAgentPromptTemplate.format({
            brianai_answer: brianaiResponse,
            user_query: userQuery,
          }),
        ],
      },
      {
        configurable: {
          thread_id: chatId || "1",
          additional_args: { chatId }
        },
      },
    );
    return response.messages[response.messages.length - 1].content as string;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Sorry, I am unable to process your request at the moment.";
  }
}
// Modify queryBrianAI to support streaming
async function queryBrianAI(
  prompt: string,
  chatId?: string,
  streamCallback?: (chunk: string) => Promise<void>
): Promise<string> {
  try {
    const response = await axios.post(
      BRIAN_API_URL,
      {
        prompt,
        kb: "starknet_kb",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-brian-api-key": BRIAN_API_KEY,
        },
      }
    );

    const brianaiAnswer = response.data.result.answer;

    const openaiAnswer = await queryOpenAI({
      brianaiResponse: brianaiAnswer,
      userQuery: prompt,
      chatId,
      streamCallback
    });

    return openaiAnswer;
  } catch (error) {
    console.error("Brian AI Error:", error);
    return "Sorry, I am unable to process your request at the moment.";
  }
}

async function getTransactionIntentFromOpenAI(
  prompt: string,
  address: string,
  chainId: string,
  messages: any[]
): Promise<BrianResponse | null> {
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
    const response = await agent.pipe(jsonOutputParser).invoke(formattedPrompt);
    const intentData = JSON.parse(response);

    if (!intentData.isTransactionIntent) {
      return null
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
    return null;
  }
}

async function getOrCreateTransactionChat(userId: string) {
  try {
    const chat = await prisma.chat.create({
      data: {
        userId,
        type: "TRANSACTION",
      },
    })
    return chat
  } catch (error) {
    console.error("Error creating transaction chat:", error)
    throw error
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
    })
    return transaction
  } catch (error) {
    console.error("Error storing transaction:", error)
    throw error
  }
}

async function storeMessage({
  content,
  chatId,
  userId,
}: {
  content: any[]
  chatId: string
  userId: string
}) {
  try {
    const message = await prisma.message.create({
      data: {
        content,
        chatId,
        userId,
      },
    })
    return message
  } catch (error) {
    console.error("Error storing message:", error)
    throw error
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
    })

    if (!user) {
      user = await prisma.user.create({
        data: { address },
      })
    }

    const chat = await getOrCreateTransactionChat(user.id)

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
      })

      if (!transactionIntent) {
        const brianAnswer = await queryBrianAI(prompt);

        await storeMessage({
          content: [{ role: "assistant", content: brianAnswer }],
          chatId: chat.id,
          userId: user.id,
        });

        return NextResponse.json({
          result: [{
            data: {
              type: "question",
              answer: brianAnswer
            },
            conversationHistory: messages
          }]
        });
      }

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

      const transaction = await storeTransaction(user.id, transactionIntent.action, {
        ...processedTx,
        chainId,
        originalIntent: transactionIntent,
      })

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
      })

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