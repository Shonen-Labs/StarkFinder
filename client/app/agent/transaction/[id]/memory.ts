import { PrismaClient, type Transaction, type Message } from "@prisma/client"
import { ConversationSummaryMemory } from "langchain/memory"
import { ChatOpenAI } from "@langchain/openai"

const prisma = new PrismaClient()

// Helper function to format user context
function formatUserContext(transactions: Transaction[], messages: Message[]): string {
  const transactionHistory = transactions
    .map((t) => `Transaction: ${t.type} (${t.status}) on ${t.createdAt.toISOString()}`)
    .join("\n")

  const chatHistory = messages.map((m) => `Message: ${JSON.stringify(m.content)}`).join("\n")

  return `User Context:\n${transactionHistory}\n\nChat History:\n${chatHistory}`
}

// Create memory with user context
export const createMemoryWithContext = async (userId: string, chatId: string) => {
  try {
    // Fetch recent transactions and messages for user context
    const userTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5, // Limit to recent transactions
    })

    const userMessages = await prisma.message.findMany({
      where: {
        userId,
        chatId,
      },
      orderBy: { createdAt: "desc" },
      take: 10, // Limit to recent messages
    })

    // Format the context string
    const userContext = formatUserContext(userTransactions, userMessages)

    // Initialize memory with the OpenAI model
    const memory = new ConversationSummaryMemory({
      llm: new ChatOpenAI({
        temperature: 0.7,
        modelName: "gpt-4",
      }),
      memoryKey: "chat_history", // Key for memory context
    })

    // Inject user context into memory
    await memory.saveContext({ input: "User's historical context" }, { output: userContext })

    return memory
  } catch (error) {
    console.error("Memory creation error:", error)
    throw error
  }
}

// Generate transaction suggestions based on user history
export const generateTransactionSuggestions = async (userId: string) => {
  try {
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    })

    return recentTransactions.map((tx) => ({
      type: tx.type,
      suggestedAction: `Consider repeating ${tx.type} transaction`,
    }))
  } catch (error) {
    console.error("Error generating transaction suggestions:", error)
    throw error
  }
}

// Initialize user agent with memory and suggestions
export const initUserAgent = async (userId: string, chatId: string) => {
  try {
    const memory = await createMemoryWithContext(userId, chatId) // Create memory
    const suggestions = await generateTransactionSuggestions(userId) // Generate suggestions

    return {
      memory,
      suggestions,
    }
  } catch (error) {
    console.error("Error initializing user agent:", error)
    throw error
  }
}

// Export type for TransactionMemory
export type TransactionMemory = Awaited<ReturnType<typeof createMemoryWithContext>>










// import { PrismaClient } from "@prisma/client";
// import { ConversationSummaryMemory } from "langchain/memory";
// import { ChatOpenAI } from "@langchain/openai";

// const prisma = new PrismaClient();

// function formatUserContext(transactions: any[], messages: any[]) {
//   const transactionHistory = transactions
//     .map(t => `Transaction: ${t.type} (${t.status}) on ${t.createdAt.toISOString()}`)
//     .join('\n');

//   const chatHistory = messages
//     .map(m => `Message: ${JSON.stringify(m.content)}`)
//     .join('\n');

//   return `User Context:\n${transactionHistory}\n\nChat History:\n${chatHistory}`;
// }

// export const createMemoryWithContext = async (userId: string, chatId: string) => {
//   try {
//     // Fetch comprehensive user context
//     const userTransactions = await prisma.transaction.findMany({
//       where: { userId },
//       orderBy: { createdAt: "desc" },
//       take: 5 // Limit to recent transactions
//     });

//     const userMessages = await prisma.message.findMany({
//       where: { 
//         userId, 
//         chatId 
//       },
//       orderBy: { createdAt: "desc" },
//       take: 10 // Limit to recent messages
//     });

//     // Format user context
//     const userContext = formatUserContext(userTransactions, userMessages);

//     // Initialize memory with OpenAI model
//     const memory = new ConversationSummaryMemory({
//       llm: new ChatOpenAI({ 
//         temperature: 0.7,
//         modelName: "gpt-4" 
//       }),
//       memoryKey: "chat_history"
//     });

//     // Inject context into memory
//     await memory.saveContext(
//       { input: "User's historical context" },
//       { output: userContext }
//     );

//     return memory;
//   } catch (error) {
//     console.error("Memory creation error:", error);
//     throw error;
//   }
// };

// export const generateTransactionSuggestions = async (userId: string) => {
//   const recentTransactions = await prisma.transaction.findMany({
//     where: { userId },
//     orderBy: { createdAt: "desc" },
//     take: 3
//   });

//   return recentTransactions.map(tx => ({
//     type: tx.type,
//     suggestedAction: `Consider repeating ${tx.type} transaction`
//   }));
// };

// export const initUserAgent = async (userId: string, chatId: string) => {
//   const memory = await createMemoryWithContext(userId, chatId);
//   const suggestions = await generateTransactionSuggestions(userId);

//   return {
//     memory,
//     suggestions
//   };
// };