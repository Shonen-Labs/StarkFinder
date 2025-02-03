import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { START, END, MessagesAnnotation, MemorySaver, StateGraph } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import prisma from '@/lib/db';
// import { ExtendedError } from 'starknet';
import { Prisma } from "@prisma/client";
interface ExtendedError extends Error {
  code?: string;
}


const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key is missing");
}

// Define interfaces for message types
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
}

type ChatIdType = string | { configurable?: { additional_args?: { chatId?: string } } };

// Helper function to convert ChatMessage to LangChain BaseMessage
function convertToLangChainMessage(message: ChatMessage): BaseMessage {
  switch (message.role) {
    case "user":
      return new HumanMessage(message.content);
    case "assistant":
      return new AIMessage(message.content);
    case "system":
      return new SystemMessage(message.content);
    default:
      return new HumanMessage(message.content);
  }
}

const systemPrompt = `You are a helpful AI assistant specialized in providing detailed, accurate information.
Your responses should be clear, informative, and engaging.
When appropriate, provide examples or additional context to help users better understand the topic.
The provided chat history includes a summary of the earlier conversation.`;

const systemMessage = SystemMessagePromptTemplate.fromTemplate(systemPrompt);
const userMessage = HumanMessagePromptTemplate.fromTemplate("{user_query}");
const chatPromptTemplate = ChatPromptTemplate.fromMessages([systemMessage, userMessage]);

const agent = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.5,
  openAIApiKey: OPENAI_API_KEY,
  streaming: true,
});

async function getOrCreateUser(address: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { id: address },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: address,
          email: null,
          name: null,
        },
      });
    }

    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

async function storeMessage({
  content,
  chatId,
  userId,
}: {
  content: ChatMessage[];
  chatId: string;
  userId: string;
}) {
  try {
    const message = await prisma.message.create({
      data: {
        content: content as unknown as Prisma.InputJsonValue[],
        chatId,
        userId,
      },
    });
    return message;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}

async function createOrGetChat(userId: string) {
  try {
    await getOrCreateUser(userId);
    
    const chat = await prisma.chat.create({
      data: {
        userId,
      },
    });
    return chat;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

async function getChatHistory(chatId: ChatIdType): Promise<BaseMessage[]> {
  try {
    const actualChatId =
      typeof chatId === 'object' && chatId.configurable?.additional_args?.chatId
        ? chatId.configurable.additional_args.chatId
        : (typeof chatId === 'string' ? chatId : null);

    if (!actualChatId || typeof actualChatId !== 'string') {
      console.warn('Invalid chat ID provided:', chatId);
      return [];
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: actualChatId,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const formattedHistory: BaseMessage[] = messages.flatMap((msg) =>
      msg.content
        .map((c) => {
          if (
            typeof c === 'object' &&
            c !== null &&
            'role' in c &&
            'content' in c &&
            typeof (c as Record<string, unknown>).role === 'string' &&
            typeof (c as Record<string, unknown>).content === 'string'
          ) {
            return convertToLangChainMessage(c as unknown as ChatMessage);
          }
          return null;
        })
        .filter((c): c is BaseMessage => c !== null)
    );
    

    return formattedHistory;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

const initialCallModel = async (state: typeof MessagesAnnotation.State): Promise<{ messages: unknown[] }> => {
  const messages = [await systemMessage.format({}), ...state.messages];
  const response = await agent.invoke(messages);
  return { messages: [response] };
};

const callModel = async (state: typeof MessagesAnnotation.State, chatId?: ChatIdType): Promise<{ messages: unknown[] }> => {
  if (!chatId) {
    return await initialCallModel(state);
  }
  
  const actualChatId =
    typeof chatId === 'object'
      ? chatId.configurable?.additional_args?.chatId || chatId
      : chatId;
  const chatHistory = await getChatHistory(actualChatId);
  const currentMessage = state.messages[state.messages.length - 1];

  if (chatHistory.length > 0) {
    const summaryPrompt = new HumanMessage(`
    Distill the following chat history into a single summary message. 
    Include as many specific details as you can.
    Include all relevant context from the previous conversation.
    `);

    const summary = await agent.invoke([
      ...chatHistory,
      summaryPrompt,
    ]);

    const response = await agent.invoke([
      await systemMessage.format({}),
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

interface QueryOpenAIParams {
  userQuery: string;
  chatId?: string;
  streamCallback?: (chunk: string) => Promise<void>;
}

async function queryOpenAI({ userQuery, chatId, streamCallback }: QueryOpenAIParams): Promise<string> {
  try {
    if (streamCallback) {
      const messages = [
        await systemMessage.format({}),
        new HumanMessage(userQuery),
      ];
      
      let fullResponse = '';
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
          await chatPromptTemplate.format({
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
    
    if (!response.messages || response.messages.length === 0) {
      throw new Error("No response received from the model");
    }
    
    const lastMessage = response.messages[response.messages.length - 1];
    return typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
  } catch (error: unknown) {
    console.error("OpenAI Error:", error);
    return "Sorry, I am unable to process your request at the moment.";
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, address, messages, chatId, stream = false } = (await request.json()) as PostRequestBody;
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

    if (stream) {
      const encoder = new TextEncoder();
      const transformStream = new TransformStream();
      const writer = transformStream.writable.getWriter();

      queryOpenAI({
        userQuery: prompt,
        chatId: currentChatId,
        streamCallback: async (chunk) => {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        },
      })
        .then(async (fullResponse) => {
          if (fullResponse) {
            await storeMessage({
              content: [
                {
                  role: "assistant",
                  content: fullResponse,
                },
              ],
              chatId: currentChatId,
              userId,
            });
          }
          await writer.write(encoder.encode("data: [DONE]\n\n"));
          await writer.close();
        })
        .catch(async (error: unknown) => {
          console.error("Streaming error:", error);
          const errorMessage = {
            error: "Unable to process request",
            details: (error as Error).message,
          };
          await writer.write(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
          await writer.close();
        });

      return new Response(transformStream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const response = await queryOpenAI({
      userQuery: prompt,
      chatId: currentChatId,
    });
    
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