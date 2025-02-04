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
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import prisma from '@/lib/db';
import { StringOutputParser } from "@langchain/core/output_parsers";
import { investmentRecommendationPromptTemplate } from "@/prompts/prompts";
import { UserPreferences, InvestmentRecommendation } from "./types";
import {
  BRIAN_API_KEY,
  BRIAN_API_URL,
  createOrGetChat,
  fetchTokenData,
  fetchYieldData,
  getOrCreateUser,
  OPENAI_API_KEY,
  storeMessage
} from "./heper";

interface ExtendedError extends Error {
  code?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestMessage {
  sender: "user" | "assistant";
  content: string;
}

interface PostRequestBody {
  prompt: string;
  address: string;
  messages: ChatRequestMessage[];
  chatId?: string;
  stream?: boolean;
  userPreferences?: UserPreferences;
}

type ChatIdType = string | { configurable?: { additional_args?: { chatId?: string } } };

const systemPrompt = ASK_OPENAI_AGENT_PROMPT +
  `\nThe provided chat history includes a summary of the earlier conversation.`;

const systemMessage = SystemMessagePromptTemplate.fromTemplate(systemPrompt);
const userMessage = HumanMessagePromptTemplate.fromTemplate("{user_query}");
const chatPromptTemplate = ChatPromptTemplate.fromMessages([systemMessage, userMessage]);

if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key is missing");
}

const agent = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.5,
  openAIApiKey: OPENAI_API_KEY,
  streaming: true,
});

// Helper functions (getOrCreateUser, storeMessage, createOrGetChat remain the same as in main branch)

async function getChatHistory(chatId: ChatIdType): Promise<BaseMessage[]> {
  try {
    const actualChatId =
      typeof chatId === 'object' && chatId.configurable?.additional_args?.chatId
        ? chatId.configurable.additional_args.chatId
        : (typeof chatId === 'string' ? chatId : null);

    if (!actualChatId || typeof actualChatId !== "string") {
      console.warn("Invalid chat ID provided:", chatId);
      return [];
    }

    const messages = await prisma.message.findMany({
      where: { chatId: actualChatId },
      orderBy: { id: 'asc' },
    });

    const formattedHistory: BaseMessage[] = messages.flatMap((msg) =>
      msg.content
        .map((c) => {
          if (
            typeof c === 'object' &&
            'role' in c &&
            'content' in c &&
            typeof c.role === 'string' &&
            typeof c.content === 'string'
          ) {
            switch (c.role) {
              case "user": return new HumanMessage(c.content);
              case "assistant": return new AIMessage(c.content);
              case "system": return new SystemMessage(c.content);
              default: return new HumanMessage(c.content);
            }
          }
          return null;
        })
        .filter((c): c is BaseMessage => c !== null)
    );

    return formattedHistory;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}

// StateGraph workflow and callModel functions remain the same as in main branch

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

    const formattedPrompt = await investmentRecommendationPromptTemplate.format({
      INVESTMENT_RECOMMENDATION_PROMPT,
      userPreferences: JSON.stringify(userPreferences),
      tokens: JSON.stringify(tokens),
      yields: JSON.stringify(yields),
      conversationHistory,
    });

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
        riskTolerance: recommendationData.extractedParams.riskTolerance ||
          userPreferences.riskTolerance,
        investmentHorizon: recommendationData.extractedParams.investmentHorizon ||
          userPreferences.investmentHorizon,
        preferredAssets: recommendationData.extractedParams.preferredAssets ||
          userPreferences.preferredAssets,
        preferredChains: recommendationData.extractedParams.preferredChains ||
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
    const { prompt, address, messages, chatId, stream = false, userPreferences } =
      await request.json() as PostRequestBody;

    const userId = address || "0x0";
    await getOrCreateUser(userId);

    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await createOrGetChat(userId);
      currentChatId = newChat.id;
    }

    const uniqueMessages: ChatMessage[] = messages
      .filter((msg: ChatRequestMessage) => msg.sender === "user")
      .reduce((acc: ChatMessage[], curr: ChatRequestMessage) => {
        if (!acc.some(msg => msg.content === curr.content)) {
          acc.push({ role: "user", content: curr.content });
        }
        return acc;
      }, []);

    await storeMessage({
      content: uniqueMessages,
      chatId: currentChatId,
      userId,
    });

    if (prompt.toLowerCase().includes("recommend") || prompt.toLowerCase().includes("invest")) {
      const tokens = await fetchTokenData();
      const yields = await fetchYieldData();

      const recommendations = await generateInvestmentRecommendations(
        userPreferences || {} as UserPreferences,
        tokens,
        yields,
        uniqueMessages
      );

      await storeMessage({
        content: [{
          role: "assistant",
          content: recommendations.data.description,
          recommendationData: {
            ...recommendations,
            timestamp: new Date().toISOString(),
            userId,
            chatId: currentChatId,
          },
        }],
        chatId: currentChatId,
        userId,
      });

      const response = {
        content: recommendations.data.description,
        recommendations,
        chatId: currentChatId,
      };

      if (stream) {
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        await writer.write(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
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

    // Original OpenAI handling
    const response = await queryOpenAI({
      userQuery: prompt,
      chatId: currentChatId,
      streamCallback: stream ? async (chunk) => {
        // Streaming handling here
      } : undefined,
    });

    await storeMessage({
      content: [{ role: "assistant", content: response }],
      chatId: currentChatId,
      userId,
    });

    return NextResponse.json({ answer: response, chatId: currentChatId });

  } catch (error: unknown) {
    const err = error as ExtendedError;
    console.error("Error:", err);

    if (err.code === "P2003") {
      return NextResponse.json(
        { error: "User authentication required", details: "Please ensure you are logged in." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Unable to process request", details: err.message },
      { status: 500 }
    );
  }
}