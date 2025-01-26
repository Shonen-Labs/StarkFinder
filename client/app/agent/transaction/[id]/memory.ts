import { BaseMemory, type InputValues, type OutputValues } from "langchain/memory"
import { PrismaClient } from "@prisma/client"
import { ChatOpenAI } from "@langchain/openai"
import { ConversationChain } from "langchain/chains"

const prisma = new PrismaClient()

export class TransactionMemory extends BaseMemory {
  get memoryKeys(): string[] {
    return ["chat_history", "recent_transactions"]
  }
  userId: string
  chatId: string
  chain: ConversationChain

  constructor(userId: string, chatId: string) {
    super()
    this.userId = userId
    this.chatId = chatId

    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    this.chain = new ConversationChain({ llm: model })
  }

  async loadMemoryVariables(_: InputValues): Promise<{ [key: string]: string }> {
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

    const formattedHistory = chatHistory.map((msg) => `${msg.role}: ${JSON.stringify(msg.content)}`).join("\n")

    const formattedTransactions = recentTransactions
      .map((tx) => `Transaction: ${tx.type} - Status: ${tx.status} - Details: ${JSON.stringify(tx.metadata)}`)
      .join("\n")

    return {
      chat_history: formattedHistory,
      recent_transactions: formattedTransactions,
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

  async chat(input: string): Promise<string> {
    const context = await this.loadMemoryVariables({})
    const result = await this.chain.call({
      input: `${context.chat_history}\n\nUser: ${input}\n\nRecent Transactions:\n${context.recent_transactions}\n\nAssistant:`,
    })
    await this.saveContext({ input }, { response: result.response })
    return result.response
  }
}

