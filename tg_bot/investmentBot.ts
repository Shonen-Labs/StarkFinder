import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import { agent } from "./bot";
dotenv.config();

export interface UserPreferences {
  riskTolerance: "low" | "medium" | "high";
  preferredAssets: string[];
  preferredChains: string[];
  investmentHorizon: "short" | "medium" | "long";
  minTVL?: number;
  targetAPY?: number;
  timestamp?: string;
}

interface Pool {
  name: string;
  apy: number;
  tvl: number;
  chain: string;
  assets: string[];
  riskLevel: "low" | "medium" | "high";
  impermanentLoss: number;
  protocol: string;
}

export class InvestmentAdvisor {
  private static instance: InvestmentAdvisor;
  private readonly chatModel: ChatOpenAI;
  private pools: Pool[] = [];
  private readonly userPreferencesDir: string;
  private readonly chatHistoryDir: string;

  constructor() {
    this.chatModel = agent;
    this.userPreferencesDir = path.join(__dirname, "data", "user_preferences");
    this.chatHistoryDir = path.join(__dirname, "data", "chat_history");
    this.loadPoolData();
    this.ensureUserPreferencesDirExists();
    this.ensureChatHistoryDirExists();
  }

  private ensureUserPreferencesDirExists(): void {
    if (!existsSync(this.userPreferencesDir)) {
      mkdirSync(this.userPreferencesDir, { recursive: true });
    }
  }

  private ensureChatHistoryDirExists(): void {
    if (!existsSync(this.chatHistoryDir)) {
      mkdirSync(this.chatHistoryDir, { recursive: true });
    }
  }

  public static getInstance(): InvestmentAdvisor {
    if (!InvestmentAdvisor.instance) {
      InvestmentAdvisor.instance = new InvestmentAdvisor();
    }
    return InvestmentAdvisor.instance;
  }

  private async detectIntent(message: string): Promise<{
    intent: "set_preferences" | "get_recommendations" | "other";
    confidence: number;
  }> {
    const response = await this.chatModel.invoke([
      new SystemMessage(`You are a DeFi investment assistant. Analyze the message and determine if the user is:
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
      new HumanMessage(message),
    ]);

    const cleanJson = response.content
      .toString()
      .replace(/```json\s*|\s*```/g, "");
    return JSON.parse(cleanJson);
  }

  private async extractPreferences(message: string): Promise<UserPreferences> {
    const response = await this.chatModel.invoke([
      new SystemMessage(`Extract investment preferences from the message. If a preference isn't specified, make a reasonable assumption based on the user's risk tolerance. Return JSON with format:
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
      new HumanMessage(message),
    ]);

    const cleanJson = response.content
      .toString()
      .replace(/```json\s*|\s*```/g, "");
    return JSON.parse(cleanJson);
  }

  private getUserPreferencesWithHistory(userId: string): UserPreferences {
    const explicitPreferences = this.getUserPreferences(userId);
    const chatHistory = this.getChatHistory(userId);

    const sortedHistory = chatHistory
      .filter((entry) => entry.preferences)
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });

    const mostRecentPreferences = sortedHistory[0]?.preferences;

    const defaultPreferences: UserPreferences = {
      riskTolerance: "medium",
      preferredAssets: [],
      preferredChains: [],
      investmentHorizon: "medium",
      timestamp: new Date().toISOString(),
    };

    return {
      ...defaultPreferences,
      ...explicitPreferences,
      ...mostRecentPreferences,
    };
  }

  async processMessage(userId: string, message: string): Promise<string> {
    try {
      const { intent } = await this.detectIntent(message);

      if (
        intent === "set_preferences" ||
        message.toLowerCase().includes("looking for")
      ) {
        const preferences = await this.extractPreferences(message);
        preferences.timestamp = new Date().toISOString();
        const userPreferencesPath = path.join(
          this.userPreferencesDir,
          `${userId}.json`
        );
        writeFileSync(
          userPreferencesPath,
          JSON.stringify(preferences, null, 2)
        );

        this.storeChatHistory(userId, message, intent, preferences);

        const response = await this.getRecommendations(userId);
        this.storeChatHistory(userId, response);
        return response;
      }

      if (intent === "get_recommendations") {
        const preferences = this.getUserPreferences(userId);
        if (!preferences) {
          const response =
            "Could you tell me what kind of investments you're looking for? For example, what assets and risk level you prefer?";
          this.storeChatHistory(userId, response);
          return response;
        }

        this.storeChatHistory(userId, message, intent);

        const response = await this.getRecommendations(userId);
        this.storeChatHistory(userId, response);
        return response;
      }

      const response =
        "I can help you find investment opportunities. Just tell me what kind of investments you're looking for, including your preferred assets and risk tolerance.";
      this.storeChatHistory(userId, response);
      return response;
    } catch (error) {
      console.error("Error processing message:", error);
      const errorResponse =
        "I encountered an error while processing your request. Please try again.";
      this.storeChatHistory(userId, errorResponse);
      return errorResponse;
    }
  }

  private loadPoolData(): void {
    try {
      const filePath = path.join(__dirname, "data", "tokens.json");
      console.log("Loading pool data from:", filePath);

      const rawData = readFileSync(filePath, "utf-8");
      const parsedData = JSON.parse(rawData);

      if (!Array.isArray(parsedData)) {
        console.error("Loaded pool data is not an array");
        this.pools = [];
        return;
      }

      this.pools = parsedData.filter((pool): pool is Pool => {
        return (
          typeof pool === "object" &&
          pool !== null &&
          typeof pool.name === "string" &&
          typeof pool.apy === "number" &&
          typeof pool.tvl === "number" &&
          typeof pool.chain === "string" &&
          Array.isArray(pool.assets) &&
          typeof pool.riskLevel === "string" &&
          typeof pool.impermanentLoss === "number" &&
          typeof pool.protocol === "string"
        );
      });

      console.log(`Successfully loaded ${this.pools.length} pools`);
    } catch (error) {
      console.error("Error loading pool data:", error);
      this.pools = [];
    }
  }

  private calculateRiskScore(pool: Pool, preferences: UserPreferences): number {
    let score = 0;
    if (pool.apy > 50) score += 3;
    else if (pool.apy > 20) score += 2;
    else score += 1;
    if (pool.tvl > 1000000) score -= 1;
    if (pool.tvl > 10000000) score -= 1;

    if (
      preferences.preferredAssets.some((asset) => pool.assets.includes(asset))
    ) {
      score -= 1;
    }
    score += Math.floor(pool.impermanentLoss / 10);

    return score;
  }

  private filterPoolsByPreferences(preferences: UserPreferences): Pool[] {
    return this.pools.filter((pool) => {
      const chainMatch = preferences.preferredChains.includes(pool.chain);
      const tvlMatch = !preferences.minTVL || pool.tvl >= preferences.minTVL;
      const apyMatch =
        !preferences.targetAPY || pool.apy >= preferences.targetAPY;

      const riskScore = this.calculateRiskScore(pool, preferences);
      const riskMatch =
        (preferences.riskTolerance === "low" && riskScore <= 2) ||
        (preferences.riskTolerance === "medium" && riskScore <= 4) ||
        preferences.riskTolerance === "high";

      return chainMatch && tvlMatch && apyMatch && riskMatch;
    });
  }

  public getUserPreferences(userId: string): UserPreferences | undefined {
    const userPreferencesPath = path.join(
      this.userPreferencesDir,
      `${userId}.json`
    );
    if (existsSync(userPreferencesPath)) {
      const rawData = readFileSync(userPreferencesPath, "utf-8");
      return JSON.parse(rawData);
    }
    return undefined;
  }

  private getChatHistory(userId: string): {
    message: string;
    intent?: string;
    preferences?: UserPreferences;
    timestamp: string;
  }[] {
    const chatHistoryPath = path.join(this.chatHistoryDir, `${userId}.json`);
    if (existsSync(chatHistoryPath)) {
      const rawData = readFileSync(chatHistoryPath, "utf-8");
      return JSON.parse(rawData);
    }
    return [];
  }

  private storeChatHistory(
    userId: string,
    message: string,
    intent?: string,
    preferences?: UserPreferences
  ): void {
    const chatHistoryPath = path.join(this.chatHistoryDir, `${userId}.json`);
    const chatHistory = this.getChatHistory(userId);

    chatHistory.push({
      message,
      intent,
      preferences,
      timestamp: new Date().toISOString(),
    });

    writeFileSync(chatHistoryPath, JSON.stringify(chatHistory, null, 2));
  }

  async getRecommendations(userId: string): Promise<string> {
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
      const response = await this.chatModel.invoke([
        new SystemMessage(`Create a concise summary of the best investment opportunities based on the user's preferences and chat history. Format:
          🎯 Top Recommendations:
          
          1. [Pool Name] ([Protocol])
             • APY: X%
             • Risk Level: [Low/Medium/High]
             • Assets: [Assets]
             • TVL: $[Amount]
             
          [Add 2-3 more recommendations]
          
          💡 These options match your preferences for [summarize preferences]`),
        new HumanMessage(
          JSON.stringify({
            preferences,
            chatHistory,
            recommendations: filteredPools.slice(0, 3),
          })
        ),
      ]);
      return response.content as string;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return "Sorry, I had trouble generating recommendations. Please try again.";
    }
  }
}
