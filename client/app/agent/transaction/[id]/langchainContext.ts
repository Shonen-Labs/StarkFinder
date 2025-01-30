// app/agent/transaction/langchainContext.ts
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma with proper SSL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "&sslmode=require"
    }
  }
});

// Secure LangChain initialization
const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  configuration: {
    basePath: "https://api.openai.com/v1" // Enforce official endpoint
  }
});

const memory = new BufferMemory();
const chain = new ConversationChain({ llm: model, memory });

// Fetch user context from Prisma
async function fetchUserContext(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 10, // Fetch the last 10 transactions
  });

  const messages = await prisma.message.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 10, // Fetch the last 10 messages
  });

  return { transactions, messages };
}

// Add user context to LangChain memory
async function addUserContextToMemory(userId: string) {
  const { transactions, messages } = await fetchUserContext(userId);

  // Format transactions and messages into a context string
  const contextString = `
    Past Transactions:
    ${transactions.map((txn) => `- ${txn.details}`).join('\n')}

    Past Messages:
    ${messages.map((msg) => `- ${msg.content}`).join('\n')}
  `;

  // Save context to memory
  await memory.saveContext(
    { input: "User context" },
    { output: contextString }
  );
}

// Get AI response with user context
export async function getAIResponse(userId: string, userInput: string) {
  // Add user context to memory
  await addUserContextToMemory(userId);

  // Get AI response with context
  const response = await chain.call({ input: userInput });
  return response.response;
}

// Suggest transactions based on user history
export async function suggestTransactions(userId: string) {
  const { transactions } = await fetchUserContext(userId);

  if (transactions.length > 0) {
    const suggestions = transactions.map((txn) => `- ${txn.details}`).join('\n');
    return `Based on your history, you might want to repeat these transactions:\n${suggestions}`;
  } else {
    return "You don't have any past transactions to suggest.";
  }
}