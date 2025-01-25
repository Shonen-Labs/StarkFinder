import { BaseMemory, type InputValues, type OutputValues } from "langchain/memory"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export class TransactionMemory extends BaseMemory {
  userId: string
  chatId: string

  constructor(userId: string, chatId: string) {
    super()
    this.userId = userId
    this.chatId = chatId
  }

  // This method loads the user's chat history and recent transaction data
  async loadMemoryVariables(): Promise<{ [key: string]: string }> {
    const chatHistory = await prisma.message.findMany({
      where: { chatId: this.chatId },
      orderBy: { timestamp: "asc" },
      take: 10,
      select: { content: true, role: true },
    })

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { type: true, status: true, metadata: true },
    })

    const formattedHistory = chatHistory
      .map((msg) => `${msg.role}: ${JSON.stringify(msg.content)}`)
      .join("\n")

    const formattedTransactions = recentTransactions
      .map(
        (tx) =>
          `Transaction: ${tx.type} - Status: ${tx.status} - Details: ${JSON.stringify(tx.metadata)}`
      )
      .join("\n")

    return {
      chat_history: formattedHistory,
      recent_transactions: formattedTransactions,
      suggested_transactions: recentTransactions.map((tx) => tx.type).join(", "),
    }
  }

  async saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void> {
    const input = inputValues.input as string
    const output = outputValues.response as string

    await prisma.message.create({
      data: {
        content: { text: input },
        role: "USER",
        userId: this.userId,
        chatId: this.chatId,
      },
    })

    await prisma.message.create({
      data: {
        content: { text: output },
        role: "ASSISTANT",
        userId: this.userId,
        chatId: this.chatId,
      },
    })
  }

  async clear(): Promise<void> {
    await prisma.message.deleteMany({
      where: { chatId: this.chatId },
    })
  }

  // Implementing the memoryKeys abstract method from BaseMemory
  memoryKeys(): string[] {
    return ["chat_history", "recent_transactions", "suggested_transactions"]
  }
}
