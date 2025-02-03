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
exports.InvestmentAdvisor = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const messages_1 = require("@langchain/core/messages");
const dotenv_1 = __importDefault(require("dotenv"));
const bot_1 = require("./bot");
dotenv_1.default.config();
class InvestmentAdvisor {
    constructor() {
        this.pools = [];
        this.chatModel = bot_1.agent;
        this.userPreferencesDir = path_1.default.join(__dirname, "data", "user_preferences");
        this.chatHistoryDir = path_1.default.join(__dirname, "data", "chat_history");
        this.loadPoolData();
        this.ensureUserPreferencesDirExists();
        this.ensureChatHistoryDirExists();
    }
    ensureUserPreferencesDirExists() {
        if (!(0, fs_1.existsSync)(this.userPreferencesDir)) {
            (0, fs_1.mkdirSync)(this.userPreferencesDir, { recursive: true });
        }
    }
    ensureChatHistoryDirExists() {
        if (!(0, fs_1.existsSync)(this.chatHistoryDir)) {
            (0, fs_1.mkdirSync)(this.chatHistoryDir, { recursive: true });
        }
    }
    static getInstance() {
        if (!InvestmentAdvisor.instance) {
            InvestmentAdvisor.instance = new InvestmentAdvisor();
        }
        return InvestmentAdvisor.instance;
    }
    detectIntent(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.chatModel.invoke([
                new messages_1.SystemMessage(`You are a DeFi investment assistant. Analyze the message and determine if the user is:
        1. Setting investment preferences mentioning risk levels, assets, chains, or investment criteria
        2. Requesting recommendations asking about available pools or opportunities
        3. Something else
        
        Return JSON with format:
        {
          "intent": "set_preferences|get_recommendations|other",
          "confidence": number between 0 and 1
        }
        
        Example messages that indicate setting preferences:
        - "I am looking for low-risk investments in ETH and USDC"
        - "I want to invest in Ethereum with minimal risk"
        - "Show me safe options for BTC pools"
        `),
                new messages_1.HumanMessage(message),
            ]);
            const cleanJson = response.content
                .toString()
                .replace(/```json\s*|\s*```/g, "");
            return JSON.parse(cleanJson);
        });
    }
    extractPreferences(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.chatModel.invoke([
                new messages_1.SystemMessage(`Extract investment preferences from the message. If a preference isn't specified, make a reasonable assumption based on the user's risk tolerance. Return JSON with format:
        {
          "riskTolerance": "low|medium|high",
          "preferredAssets": ["asset1", "asset2"],
          "preferredChains": ["chain1", "chain2"],
          "investmentHorizon": "short|medium|long",
          "minTVL": number,
          "targetAPY": number
        }
        
        Rules:
        - If user mentions "safe" or "low-risk", set riskTolerance to "low"
        - If TVL isn't specified, set minTVL to 1000000 for low risk
        - If horizon isn't specified, assume "long" for low risk
        - Set reasonable targetAPY based on risk tolerance
        `),
                new messages_1.HumanMessage(message),
            ]);
            const cleanJson = response.content
                .toString()
                .replace(/```json\s*|\s*```/g, "");
            return JSON.parse(cleanJson);
        });
    }
    getUserPreferencesWithHistory(userId) {
        var _a;
        const explicitPreferences = this.getUserPreferences(userId);
        const chatHistory = this.getChatHistory(userId);
        const sortedHistory = chatHistory
            .filter((entry) => entry.preferences)
            .sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return dateB.getTime() - dateA.getTime();
        });
        const mostRecentPreferences = (_a = sortedHistory[0]) === null || _a === void 0 ? void 0 : _a.preferences;
        const defaultPreferences = {
            riskTolerance: "medium",
            preferredAssets: [],
            preferredChains: [],
            investmentHorizon: "medium",
            timestamp: new Date().toISOString(),
        };
        return Object.assign(Object.assign(Object.assign({}, defaultPreferences), explicitPreferences), mostRecentPreferences);
    }
    processMessage(userId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { intent } = yield this.detectIntent(message);
                if (intent === "set_preferences" ||
                    message.toLowerCase().includes("looking for")) {
                    const preferences = yield this.extractPreferences(message);
                    preferences.timestamp = new Date().toISOString();
                    const userPreferencesPath = path_1.default.join(this.userPreferencesDir, `${userId}.json`);
                    (0, fs_1.writeFileSync)(userPreferencesPath, JSON.stringify(preferences, null, 2));
                    this.storeChatHistory(userId, message, intent, preferences);
                    const response = yield this.getRecommendations(userId);
                    this.storeChatHistory(userId, response);
                    return response;
                }
                if (intent === "get_recommendations") {
                    const preferences = this.getUserPreferences(userId);
                    if (!preferences) {
                        const response = "Could you tell me what kind of investments you're looking for? For example, what assets and risk level you prefer?";
                        this.storeChatHistory(userId, response);
                        return response;
                    }
                    this.storeChatHistory(userId, message, intent);
                    const response = yield this.getRecommendations(userId);
                    this.storeChatHistory(userId, response);
                    return response;
                }
                const response = "I can help you find investment opportunities. Just tell me what kind of investments you're looking for, including your preferred assets and risk tolerance.";
                this.storeChatHistory(userId, response);
                return response;
            }
            catch (error) {
                console.error("Error processing message:", error);
                const errorResponse = "I encountered an error while processing your request. Please try again.";
                this.storeChatHistory(userId, errorResponse);
                return errorResponse;
            }
        });
    }
    loadPoolData() {
        try {
            const filePath = path_1.default.join(__dirname, "data", "tokens.json");
            console.log("Loading pool data from:", filePath);
            const rawData = (0, fs_1.readFileSync)(filePath, "utf-8");
            const parsedData = JSON.parse(rawData);
            if (!Array.isArray(parsedData)) {
                console.error("Loaded pool data is not an array");
                this.pools = [];
                return;
            }
            this.pools = parsedData.filter((pool) => {
                return (typeof pool === "object" &&
                    pool !== null &&
                    typeof pool.name === "string" &&
                    typeof pool.apy === "number" &&
                    typeof pool.tvl === "number" &&
                    typeof pool.chain === "string" &&
                    Array.isArray(pool.assets) &&
                    typeof pool.riskLevel === "string" &&
                    typeof pool.impermanentLoss === "number" &&
                    typeof pool.protocol === "string");
            });
            console.log(`Successfully loaded ${this.pools.length} pools`);
        }
        catch (error) {
            console.error("Error loading pool data:", error);
            this.pools = [];
        }
    }
    calculateRiskScore(pool, preferences) {
        let score = 0;
        if (pool.apy > 50)
            score += 3;
        else if (pool.apy > 20)
            score += 2;
        else
            score += 1;
        if (pool.tvl > 1000000)
            score -= 1;
        if (pool.tvl > 10000000)
            score -= 1;
        if (preferences.preferredAssets.some((asset) => pool.assets.includes(asset))) {
            score -= 1;
        }
        score += Math.floor(pool.impermanentLoss / 10);
        return score;
    }
    filterPoolsByPreferences(preferences) {
        return this.pools.filter((pool) => {
            const chainMatch = preferences.preferredChains.includes(pool.chain);
            const tvlMatch = !preferences.minTVL || pool.tvl >= preferences.minTVL;
            const apyMatch = !preferences.targetAPY || pool.apy >= preferences.targetAPY;
            const riskScore = this.calculateRiskScore(pool, preferences);
            const riskMatch = (preferences.riskTolerance === "low" && riskScore <= 2) ||
                (preferences.riskTolerance === "medium" && riskScore <= 4) ||
                preferences.riskTolerance === "high";
            return chainMatch && tvlMatch && apyMatch && riskMatch;
        });
    }
    getUserPreferences(userId) {
        const userPreferencesPath = path_1.default.join(this.userPreferencesDir, `${userId}.json`);
        if ((0, fs_1.existsSync)(userPreferencesPath)) {
            const rawData = (0, fs_1.readFileSync)(userPreferencesPath, "utf-8");
            return JSON.parse(rawData);
        }
        return undefined;
    }
    getChatHistory(userId) {
        const chatHistoryPath = path_1.default.join(this.chatHistoryDir, `${userId}.json`);
        if ((0, fs_1.existsSync)(chatHistoryPath)) {
            const rawData = (0, fs_1.readFileSync)(chatHistoryPath, "utf-8");
            return JSON.parse(rawData);
        }
        return [];
    }
    storeChatHistory(userId, message, intent, preferences) {
        const chatHistoryPath = path_1.default.join(this.chatHistoryDir, `${userId}.json`);
        const chatHistory = this.getChatHistory(userId);
        chatHistory.push({
            message,
            intent,
            preferences,
            timestamp: new Date().toISOString(),
        });
        (0, fs_1.writeFileSync)(chatHistoryPath, JSON.stringify(chatHistory, null, 2));
    }
    getRecommendations(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const preferences = this.getUserPreferencesWithHistory(userId);
            if (!preferences) {
                return "Please tell me what kind of investments you're looking for first.";
            }
            try {
                if (this.pools.length === 0) {
                    return "No pool data available. Please try again later.";
                }
                const filteredPools = this.filterPoolsByPreferences(preferences);
                if (filteredPools.length === 0) {
                    return "I couldn't find any pools matching your criteria. Would you like to see options with slightly different parameters?";
                }
                const chatHistory = this.getChatHistory(userId);
                const response = yield this.chatModel.invoke([
                    new messages_1.SystemMessage(`Create a concise summary of the best investment opportunities based on the user's preferences and chat history. Format:
          🎯 Top Recommendations:
          
          1. [Pool Name] ([Protocol])
             • APY: X%
             • Risk Level: [Low/Medium/High]
             • Assets: [Assets]
             • TVL: $[Amount]
             
          [Add 2-3 more recommendations]
          
          💡 These options match your preferences for [summarize preferences]`),
                    new messages_1.HumanMessage(JSON.stringify({
                        preferences,
                        chatHistory,
                        recommendations: filteredPools.slice(0, 3),
                    })),
                ]);
                return response.content;
            }
            catch (error) {
                console.error("Error generating recommendations:", error);
                return "Sorry, I had trouble generating recommendations. Please try again.";
            }
        });
    }
}
exports.InvestmentAdvisor = InvestmentAdvisor;
