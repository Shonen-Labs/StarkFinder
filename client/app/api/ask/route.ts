/* eslint-disable @typescript-eslint/no-explicit-any */
// api/ask/route.ts
import { NextResponse } from "next/server";
import {
  ASK_OPENAI_AGENT_PROMPT,
  INVESTMENT_RECOMMENDATION_PROMPT,
} from "@/prompts/prompts";
import axios from "axios";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import {
  START,
  END,
  MessagesAnnotation,
  MemorySaver,
  StateGraph,
} from "@langchain/langgraph";
// import { RemoveMessage } from "@langchain/core/messages";
import prisma from "@/lib/db";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { investmentRecommendationPromptTemplate } from "@/prompts/prompts";


import { UserPreferences, InvestmentRecommendation } from "./types";
import { BRIAN_API_KEY, BRIAN_API_URL, BRIAN_DEFAULT_RESPONSE, createOrGetChat, fetchTokenData, fetchYieldData, getOrCreateUser, OPENAI_API_KEY, storeMessage } from "./heper";

const systemPrompt =
  ASK_OPENAI_AGENT_PROMPT +
  `\nThe provided chat history includes a summary of the earlier conversation.`;

const systemMessage = SystemMessagePromptTemplate.fromTemplate([systemPrompt]);

const userMessage = HumanMessagePromptTemplate.fromTemplate(["{user_query}"]);

const askAgentPromptTemplate = ChatPromptTemplate.fromMessages([
  systemMessage,
  userMessage,
]);

if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key is missing");
}

const agent = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.5,
  openAIApiKey: OPENAI_API_KEY,
  streaming: true,
});
const prompt = askAgentPromptTemplate;
// const chain = prompt.pipe(agent);
async function getChatHistory(
  chatId: string | { configurable?: { additional_args?: { chatId?: string } } }
) {
  try {
    const actualChatId =
      typeof chatId === "object" && chatId.configurable?.additional_args?.chatId
        ? chatId.configurable.additional_args.chatId
        : chatId;

    if (!actualChatId || typeof actualChatId !== "string") {
      console.warn("Invalid chat ID provided:", chatId);
      return [];
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: actualChatId,
      },
      orderBy: {
        id: "asc",
      },
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

const initialCallModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = [
    await systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }),
    ...state.messages,
  ];
  const response = await agent.invoke(messages);
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
  streamCallback,
}: {
  userQuery: string;
  brianaiResponse: string;
  chatId?: string;
  streamCallback?: (chunk: string) => Promise<void>;
}): Promise<string> {
  try {
    if (streamCallback) {
      const messages = [
        await systemMessage.format({ brianai_answer: brianaiResponse }),
        { role: "user", content: userQuery },
      ];

      let fullResponse = "";
      await agent.invoke(messages, {
        callbacks: [
          {
            handleLLMNewToken: async (token: string) => {
              fullResponse += token;
              await streamCallback(token);
            },
          },
        ],
      });
      return fullResponse;
    }

    const response = await app.invoke(
      {
        messages: [
          await prompt.format({
            brianai_answer: brianaiResponse,
            user_query: userQuery,
          }),
        ],
      },
      {
        configurable: {
          thread_id: chatId || "1",
          additional_args: { chatId },
        },
      }
    );
    return response.messages[response.messages.length - 1].content as string;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Sorry, I am unable to process your request at the moment.";
  }
}

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
      streamCallback,
    });

    return openaiAnswer;
  } catch (error) {
    console.error("Brian AI Error:", error);
    if (streamCallback) {
      throw error;
    }
    return "Sorry, I am unable to process your request at the moment.";
  }
}

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
    const response = await agent.pipe(jsonOutputParser).invoke(formattedPrompt);
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

export async function POST(request: Request) {
  try {
    const {
      prompt,
      address,
      messages,
      chatId,
      stream = false,
      userPreferences,
    } = await request.json();

    const userId = address || "0x0";
    await getOrCreateUser(userId);

    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await createOrGetChat(userId);
      currentChatId = newChat.id;
    }

    const uniqueMessages = messages
      .filter((msg: any) => msg.sender === "user")
      .reduce((acc: any[], curr: any) => {
        if (!acc.some((msg) => msg.content === curr.content)) {
          acc.push({
            role: "user",
            content: curr.content,
          });
        }
        return acc;
      }, []);

    await storeMessage({
      content: uniqueMessages,
      chatId: currentChatId,
      userId,
    });

    if (
      prompt.toLowerCase().includes("recommend") ||
      prompt.toLowerCase().includes("invest")
    ) {
      const tokens = await fetchTokenData();
      const yields = await fetchYieldData();

      const recommendations = await generateInvestmentRecommendations(
        userPreferences,
        tokens,
        yields,
        uniqueMessages
      );

      // Store the recommendations in the chat history
      await storeMessage({
        content: [
          {
            role: "assistant",
            content: recommendations.data.description,
            recommendationData: {
              ...recommendations,
              timestamp: new Date().toISOString(),
              userId,
              chatId: currentChatId,
            },
          },
        ],
        chatId: currentChatId,
        userId,
      });

      const response = {
        content: recommendations.data.description,
        recommendations,
        chatId: currentChatId,
      };

      if (stream) {
        // Handle streaming response
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        // Stream the response

        await writer.write(
          encoder.encode(`data: ${JSON.stringify(response)}\n\n`)
        );
        await writer.close();

        return new Response(stream.readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
      return NextResponse.json(response);
    }

    // Non-streaming response
    const response = await queryBrianAI(prompt, currentChatId);
    if (!response) {
      throw new Error("Unexpected API response format");
    }

    await storeMessage({
      content: [
        {
          role: "assistant",
          content: response,
        },
      ],
      chatId: currentChatId,
      userId,
    });

    return NextResponse.json({
      answer: response,
      chatId: currentChatId,
    });
  } catch (error: any) {
    console.error("Error:", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "User authentication required",
          details: "Please ensure you are logged in.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Unable to process request", details: error.message },
      { status: 500 }
    );
  }
}
