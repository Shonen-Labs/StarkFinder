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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agent = void 0;
const grammy_1 = require("grammy");
const prompts_1 = require("./prompts/prompts");
const starknet_1 = require("starknet");
const axios_1 = __importDefault(require("axios"));
const openai_1 = require("@langchain/openai");
const prompts_2 = require("@langchain/core/prompts");
const langgraph_1 = require("@langchain/langgraph");
const messages_1 = require("@langchain/core/messages");
const chatHistory_1 = require("./chatHistory");
const dotenv_1 = __importDefault(require("dotenv"));
const investmentBot_1 = require("./investmentBot");
dotenv_1.default.config();
function getEnvVar(key, isRequired = true) {
    const value = process.env[key];
    if (isRequired && !value) {
        throw new Error(`Environment variable "${key}" is required but not defined.`);
    }
    return value || "";
}
const BOT_TOKEN = getEnvVar("MY_TOKEN");
const OPENAI_API_KEY = getEnvVar("OPENAI_API_KEY");
const BRIAN_API_KEY = getEnvVar("BRIAN_API_KEY");
const BRIAN_DEFAULT_RESPONSE = "🤖 Sorry, I don’t know how to answer. The AskBrian feature allows you to ask for information on a custom-built knowledge base of resources. Contact the Brian team if you want to add new resources!";
const BRIAN_API_URL = {
    knowledge: "https://api.brianknows.org/api/v0/agent/knowledge",
    parameters: "https://api.brianknows.org/api/v0/agent/parameters-extraction",
    transaction: "https://api.brianknows.org/api/v0/agent",
};
const chatHistoryManager = new chatHistory_1.ChatHistoryManager();
const systemPrompt = prompts_1.ASK_OPENAI_AGENT_PROMPT +
    `\nThe provided chat history includes a summary of the earlier conversation.`;
const systemMessage = prompts_2.SystemMessagePromptTemplate.fromTemplate([systemPrompt]);
const userMessage = prompts_2.HumanMessagePromptTemplate.fromTemplate(["{user_query}"]);
const askAgentPromptTemplate = prompts_2.ChatPromptTemplate.fromMessages([
    systemMessage,
    userMessage,
]);
exports.agent = new openai_1.ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.5,
    openAIApiKey: OPENAI_API_KEY,
});
const prompt = askAgentPromptTemplate;
const chain = prompt.pipe(exports.agent);
const initialCallModel = (state) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = [
        yield systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }),
        ...state.messages,
    ];
    const response = yield exports.agent.invoke(messages);
    return { messages: response };
});
class ChatWorkflowManager {
    constructor() {
        this.workflows = new Map();
        this.memories = new Map();
    }
    createWorkflow(chatId) {
        // Create new memory instance for this chat
        const memory = new langgraph_1.MemorySaver();
        this.memories.set(chatId, memory);
        // Create chat-specific call model function
        const chatCallModel = (state) => __awaiter(this, void 0, void 0, function* () {
            const messageHistory = state.messages.slice(0, -1);
            if (messageHistory.length >= 3) {
                const lastHumanMessage = state.messages[state.messages.length - 1];
                const summaryPrompt = `
        Distill the above chat messages into a single summary message. 
        Include as many specific details as you can.
        IMPORTANT NOTE: Include all information related to user's nature about trading and what kind of trader he/she is. 
        `;
                const summary = yield exports.agent.invoke([
                    ...messageHistory,
                    { role: "user", content: summaryPrompt },
                ]);
                const deleteMessages = state.messages.map((m) => m.id ? new messages_1.RemoveMessage({ id: m.id }) : null);
                const humanMessage = {
                    role: "user",
                    content: lastHumanMessage.content,
                };
                const response = yield exports.agent.invoke([
                    yield systemMessage.format({
                        brianai_answer: BRIAN_DEFAULT_RESPONSE,
                    }),
                    summary,
                    humanMessage,
                ]);
                return {
                    messages: [summary, humanMessage, response, ...deleteMessages],
                };
            }
            else {
                return yield initialCallModel(state);
            }
        });
        const workflow = new langgraph_1.StateGraph(langgraph_1.MessagesAnnotation)
            .addNode("model", chatCallModel)
            .addEdge(langgraph_1.START, "model")
            .addEdge("model", langgraph_1.END);
        const compiledWorkflow = workflow.compile({ checkpointer: memory });
        this.workflows.set(chatId, compiledWorkflow);
        return compiledWorkflow;
    }
    getWorkflow(chatId) {
        if (!this.workflows.has(chatId)) {
            return this.createWorkflow(chatId);
        }
        return this.workflows.get(chatId);
    }
    clearMemory(chatId) {
        this.workflows.delete(chatId);
        this.memories.delete(chatId);
    }
}
const workflowManager = new ChatWorkflowManager();
class StarknetWallet {
    constructor() {
        this.provider = new starknet_1.RpcProvider({
            nodeUrl: process.env.STARKNET_RPC_URL ||
                "https://free-rpc.nethermind.io/sepolia-juno",
        });
    }
    createWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const argentXaccountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";
            const privateKeyAX = starknet_1.stark.randomAddress();
            const starkKeyPubAX = starknet_1.ec.starkCurve.getStarkKey(privateKeyAX);
            const AXConstructorCallData = starknet_1.CallData.compile({
                owner: starkKeyPubAX,
                guardian: "0x0",
            });
            const AXcontractAddress = starknet_1.hash.calculateContractAddressFromHash(starkKeyPubAX, argentXaccountClassHash, AXConstructorCallData, 0);
            const accountAX = new starknet_1.Account(this.provider, AXcontractAddress, privateKeyAX);
            const deployAccountPayload = {
                classHash: argentXaccountClassHash,
                constructorCalldata: AXConstructorCallData,
                contractAddress: AXcontractAddress,
                addressSalt: starkKeyPubAX,
            };
            const { transaction_hash: AXdAth, contract_address: AXcontractFinalAddress, } = yield accountAX.deployAccount(deployAccountPayload);
            console.log("✅ ArgentX wallet deployed at:", AXcontractFinalAddress);
            return {
                account: accountAX,
                privateKey: privateKeyAX,
                publicKey: starkKeyPubAX,
                contractAddress: AXcontractFinalAddress,
            };
        });
    }
    executeTransaction(account, transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const multicallTx = yield account.execute(transactions);
                yield account.waitForTransaction(multicallTx.transaction_hash);
                return multicallTx.transaction_hash;
            }
            catch (error) {
                console.error("Transaction execution error:", error);
                throw error;
            }
        });
    }
}
class StarknetTransactionHandler {
    constructor() {
        this.provider = new starknet_1.RpcProvider({
            nodeUrl: process.env.STARKNET_RPC_URL ||
                "https://starknet-mainnet.public.blastapi.io",
        });
        this.wallet = new StarknetWallet();
    }
    getTokenBalance(tokenAddress, userAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const erc20Abi = [
                    {
                        name: "balanceOf",
                        type: "function",
                        inputs: [{ name: "account", type: "felt" }],
                        outputs: [{ name: "balance", type: "Uint256" }],
                        stateMutability: "view",
                    },
                ];
                const contract = new starknet_1.Contract(erc20Abi, tokenAddress, this.provider);
                const balance = yield contract.balanceOf(userAddress);
                return balance.toString();
            }
            catch (error) {
                console.error("Error getting token balance:", error);
                throw error;
            }
        });
    }
    processTransaction(brianResponse, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield this.wallet.createWallet();
                const transactions = brianResponse.data.steps.map((step) => ({
                    contractAddress: step.contractAddress,
                    entrypoint: step.entrypoint,
                    calldata: step.calldata,
                }));
                const txHash = yield this.wallet.executeTransaction(account.account, transactions);
                return {
                    success: true,
                    description: brianResponse.data.description,
                    transactions,
                    action: brianResponse.action,
                    solver: brianResponse.solver,
                    fromToken: brianResponse.data.fromToken,
                    toToken: brianResponse.data.toToken,
                    fromAmount: brianResponse.data.fromAmount,
                    toAmount: brianResponse.data.toAmount,
                    receiver: brianResponse.data.receiver,
                    estimatedGas: brianResponse.data.gasCostUSD,
                    transactionHash: txHash,
                };
            }
            catch (error) {
                console.error("Error processing transaction:", error);
                throw error;
            }
        });
    }
}
function formatResponse(response) {
    return __awaiter(this, void 0, void 0, function* () {
        let formattedText = response.replace(/^"|"$/g, "").trim();
        formattedText = formattedText.replace(/(\n*)###\s*/g, "\n\n### ");
        formattedText = formattedText.replace(/### ([\w\s&()-]+)/g, "### **$1**");
        formattedText = formattedText.replace(/\n{3,}/g, "\n\n");
        const keyTerms = ["Layer 2", "zk-rollups", "Cairo", "DeFi", "Web3", "dApps"];
        keyTerms.forEach((term) => {
            const regex = new RegExp(`\\b${term}\\b(?![^<]*>)`, "g");
            formattedText = formattedText.replace(regex, `_${term}_`);
        });
        return formattedText;
    });
}
function queryOpenAI(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userQuery, brianaiResponse, chatId, }) {
        try {
            // Get chat-specific workflow
            const workflow = workflowManager.getWorkflow(chatId);
            const response = yield workflow.invoke({
                messages: [
                    yield prompt.format({
                        brianai_answer: brianaiResponse,
                        user_query: userQuery,
                    }),
                ],
            }, {
                configurable: {
                    thread_id: chatId,
                },
            });
            return response.messages[response.messages.length - 1].content;
        }
        catch (error) {
            console.error("OpenAI Error:", error);
            return "Sorry, I am unable to process your request at the moment.";
        }
    });
}
function queryBrianAI(prompt, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(BRIAN_API_URL.knowledge, {
                prompt,
                kb: "starknet_kb",
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "x-brian-api-key": BRIAN_API_KEY,
                },
            });
            const brianaiAnswer = response.data.result.answer;
            const openaiAnswer = yield queryOpenAI({
                brianaiResponse: brianaiAnswer,
                userQuery: prompt,
                chatId,
            });
            return yield formatResponse(openaiAnswer);
        }
        catch (error) {
            console.error("Brian AI Error:", error);
            return "Sorry, I am unable to process your request at the moment.";
        }
    });
}
function processTransactionRequest(ctx, prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!ctx.session.connectedWallet || !ctx.session.privateKey) {
                const wallet = new StarknetWallet();
                const { account, privateKey, publicKey, contractAddress } = yield wallet.createWallet();
                ctx.session.connectedWallet = account.address;
                ctx.session.privateKey = privateKey;
                yield ctx.reply(`🔑 Wallet Automatically Created for Transaction
Address: \`${contractAddress}\``);
            }
            const response = yield fetch(BRIAN_API_URL.transaction, {
                method: "POST",
                headers: {
                    "X-Brian-Api-Key": BRIAN_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    address: ctx.session.connectedWallet,
                    chainId: "4012",
                }),
            });
            const data = yield response.json();
            if (!response.ok || data.error) {
                return ctx.reply(data.error || "Failed to process transaction request");
            }
            const txPreview = `Transaction Preview:
Type: ${data.result[0].action}
${data.result[0].data.fromToken
                ? `From: ${data.result[0].data.fromAmount} ${data.result[0].data.fromToken.symbol}`
                : ""}
${data.result[0].data.toToken
                ? `To: ${data.result[0].data.toAmount} ${data.result[0].data.toToken.symbol}`
                : ""}
${data.result[0].data.receiver
                ? `Receiver: ${data.result[0].data.receiver}`
                : ""}
Estimated Gas: ${data.result[0].data.gasCostUSD || "Unknown"} USD

Reply with "confirm" to execute this transaction.`;
            ctx.session.pendingTransaction = data.result[0];
            return ctx.reply(txPreview);
        }
        catch (error) {
            console.error("Transaction processing error:", error);
            return ctx.reply("Error processing transaction. Please try again.");
        }
    });
}
// Initialize bot
const bot = new grammy_1.Bot(BOT_TOKEN);
// Initialize session
bot.use((0, grammy_1.session)({
    initial: () => ({
        pendingTransaction: null,
        mode: "none",
        lastActivity: Date.now(),
        groupChat: false,
    }),
}));
// Command handlers
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ctx.reply(`Welcome to StarkFinder! 🚀

I can help you with:
1️⃣ Starknet Information - Just ask any question!
2️⃣ Transaction Processing - Connect wallet and describe what you want to do
3️⃣ Token Balances - Check your token balances

Commands:
/wallet - Create a new wallet
/balance [token_address] - Check token balance
/txn <description> - Create a transaction
/clear - Clear chat memory
/help - Show detailed help

Just type naturally - no need to use commands for every interaction!`);
        console.log(`[SUCCESS] Start message sent to chat ID: ${ctx.chat.id}`);
    }
    catch (error) {
        console.error("Error sending start message:", error);
    }
}));
bot.command("help", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ctx.reply(`🚀 **StarkFinder Help Menu** 🤖\n
Hi there! I'm **StarkFinder**, your friendly assistant for navigating the Starknet ecosystem and performing transactions. Here’s what I can do for you:\n
**Commands:**  
🛠️ /start – Kickstart your journey with StarkFinder and set up your session.  
💼 /wallet – Check your wallet details, balance, and manage your funds with ease.  
🔄 /transaction – Perform actions like swaps, deposits, investments, and transfers directly on Starknet.  
❓ /help – Show this help menu and explore all available commands.\n
** /setpreferences – Set your investment preferences to receive personalized recommendations.
** /recommend – Get investment recommendations based on your preferences.\n
✨ *Tip:* Stay updated on the Starknet ecosystem by asking me anything!  
If you encounter any issues or need assistance, feel free to reach out.\n
🌟 Let's make Starknet simple and accessible together!`);
        console.log(`[SUCCESS] Help message sent to chat ID: ${ctx.chat.id}`);
    }
    catch (error) {
        console.error("Error sending help message:", error);
    }
}));
bot.command("wallet", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wallet = new StarknetWallet();
        const { account, privateKey, publicKey, contractAddress } = yield wallet.createWallet();
        ctx.session.connectedWallet = account.address;
        ctx.session.privateKey = privateKey;
        console.log(`[SUCCESS] Wallet created for chat ID: ${ctx.chat.id}`);
        return ctx.reply(`🚀 New Wallet Created!

*Wallet Details:*
• Address: \`${contractAddress}\`
• Public Key: \`${publicKey}\`

⚠️ *IMPORTANT*:
1. Save your private key securely
2. Do not share your private key with anyone
3. This is a one-time display of your keys

Your wallet is now ready for transactions!`, {
            parse_mode: "Markdown",
        });
    }
    catch (error) {
        console.error("========================================================================================================================================================================================");
        console.error("Wallet creation error here:", error);
        return ctx.reply("Error creating wallet. Please try again.");
    }
}));
bot.command("txn", (ctx) => {
    return ctx.reply(`🚀 Transaction Processing via Mini App 📱
  
  To create and execute transactions, please use our Telegram Mini App: [AppLink](https://t.me/strkfinder1511_bot/strk_1511)
  
  🔗 Open StarkFinder Mini App
  - Tap the button in the chat or visit @starkfinderbot
  - Navigate to the Transactions section
  - Follow the guided transaction flow
  
  Benefits of Mini App:
  ✅ Secure transaction preview
  ✅ Real-time gas estimation
  ✅ Multi-step transaction support
  ✅ User-friendly interface
  
  Need help? Contact our support team!`);
});
//bot.on('message', async (ctx) => {
//  try {
//    const chat = await ctx.api.getChat(ctx.chat.id);
//
//    console.log(`
//Received a message from chat:
//- ID: ${chat.id}
//- Type: ${chat.type}
//- Title: ${chat.title || 'N/A'}
//- Username: ${chat.username || 'N/A'}
//- Description: ${chat.description || 'N/A'}
//    `);
//  } catch (error) {
//    console.error('Error fetching chat details:', error);
//  }
//});
// clear command
bot.command("clear", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield chatHistoryManager.deleteAllChatMessages(ctx.chat.id.toString());
        ctx.session.connectedWallet = undefined;
        ctx.session.privateKey = undefined;
        workflowManager.clearMemory(ctx.chat.id.toString());
    }
    catch (error) {
        console.error("clear command error:", error);
        return ctx.reply("❌ Unable to clear chat memory. Please try again.");
    }
    return ctx.reply(`
      ✅ Wallet data has been cleared.
      ✅ Chat memory has been cleared.
    `);
}));
// Message handler
bot.on("message:text", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chat = yield ctx.api.getChat(ctx.chat.id);
        console.log(`
Received a message from chat:
- ID: ${chat.id}
- Type: ${chat.type}
- Title: ${chat.title || "N/A"}
- Username: ${chat.username || "N/A"}
- Description: ${chat.description || "N/A"}
    `);
    }
    catch (error) {
        console.error("Error fetching chat details:", error);
    }
    try {
        const messageText = ctx.message.text.trim();
        const telegramChatId = ctx.chat.id.toString();
        ctx.session.lastActivity = Date.now();
        yield chatHistoryManager.storeMessage(telegramChatId, [{ role: "user", content: messageText }], "user");
        if (messageText.toLowerCase().includes("swap") ||
            messageText.toLowerCase().includes("transfer") ||
            messageText.toLowerCase().includes("send")) {
            yield processTransactionRequest(ctx, messageText);
            return;
        }
        else {
            const advisor = investmentBot_1.InvestmentAdvisor.getInstance();
            const response = yield advisor.processMessage(telegramChatId, messageText);
            if (response) {
                yield ctx.reply(response, { parse_mode: "Markdown" });
            }
            else {
                const response = yield queryBrianAI(messageText, telegramChatId);
                const formattedResponse = yield formatResponse(response);
                console.log(`[SUCCESS] Replied for chat ID: ${telegramChatId}`);
                return ctx.reply(formattedResponse, { parse_mode: "Markdown" });
            }
        }
    }
    catch (error) {
        console.error("Message handling error:", error);
        return ctx.reply("Sorry, there was an error processing your message.");
    }
}));
bot.catch((err) => {
    console.error("Bot error:", err);
});
bot.start({
    onStart: () => __awaiter(void 0, void 0, void 0, function* () { var _a; return console.log(`\n\n✅Bot started as ${(_a = bot.botInfo) === null || _a === void 0 ? void 0 : _a.username}!`); }),
});
