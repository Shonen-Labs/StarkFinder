"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistoryManager = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ChatHistoryManager {
    getOrCreateChat(telegramChatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let chat = yield prisma.chat.findFirst({
                    where: { chatId: telegramChatId }
                });
                if (!chat) {
                    chat = yield prisma.chat.create({
                        data: { chatId: telegramChatId }
                    });
                }
                return chat;
            }
            catch (error) {
                console.error('Error in getOrCreateChat:', error);
                throw error;
            }
        });
    }
    storeMessage(telegramChatId, content, role) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chat = yield this.getOrCreateChat(telegramChatId);
                const message = yield prisma.message.create({
                    data: {
                        chatId: chat.id,
                        role,
                        content
                    }
                });
                return message;
            }
            catch (error) {
                console.error('Error storing message:', error);
                throw error;
            }
        });
    }
    getChatHistory(telegramChatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chat = yield this.getOrCreateChat(telegramChatId);
                const messages = yield prisma.message.findMany({
                    where: { chatId: chat.id },
                    orderBy: { createdAt: 'asc' }
                });
                return messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content
                }));
            }
            catch (error) {
                console.error('Error fetching chat history:', error);
                return [];
            }
        });
    }
    deleteAllChatMessages(telegramChatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const chat = yield this.getOrCreateChat(telegramChatId);
            try {
                yield prisma.chat.deleteMany({
                    where: { chatId: chat.id }
                });
            }
            catch (error) {
                console.error('Error deleting chat messaged:', error);
            }
        });
    }
}
exports.ChatHistoryManager = ChatHistoryManager;
