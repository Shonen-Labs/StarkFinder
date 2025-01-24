import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatHistoryManager {
  async getOrCreateChat(telegramChatId: string) {
    try {
      let chat = await prisma.chat.findFirst({
        where: { chatId: telegramChatId }
      });

      if (!chat) {
        chat = await prisma.chat.create({
          data: { chatId: telegramChatId }
        });
      }

      return chat;
    } catch (error) {
      console.error('Error in getOrCreateChat:', error);
      throw error;
    }
  }

  async storeMessage(telegramChatId: string, content: any[], role: 'user' | 'assistant') {
    try {
      const chat = await this.getOrCreateChat(telegramChatId);
      
      const message = await prisma.message.create({
        data: {
          chatId: chat.id,
          role,
          content
        }
      });
      
      return message;
    } catch (error) {
      console.error('Error storing message:', error);
      throw error;
    }
  }

  async getChatHistory(telegramChatId: string) {
    try {
      const chat = await this.getOrCreateChat(telegramChatId);
      
      const messages = await prisma.message.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' }
      });

    return messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  async deleteAllChatMessages(telegramChatId: string){
    const chat = await this.getOrCreateChat(telegramChatId);

    try {
      await prisma.chat.deleteMany({
        where: { chatId: chat.id}
      })
    } catch (error) {
      console.error('Error deleting chat messaged:', error);
    }
  }
}