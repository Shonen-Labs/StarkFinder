/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/db";
import axios from "axios";
import { Pool } from "./types";

export const BRIAN_API_KEY = process.env.BRIAN_API_KEY || "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const BRIAN_API_URL =
  "https://api.brianknows.org/api/v0/agent/knowledge";
export const BRIAN_DEFAULT_RESPONSE =
  "🤖 Sorry, I don't know how to answer. The AskBrian feature allows you to ask for information on a custom-built knowledge base of resources. Contact the Brian team if you want to add new resources!";
export const YIELD_API_URL = "https://yields.llama.fi/pools";
export const TOKEN_API_URL = "https://starknet.api.avnu.fi/v1/starknet/tokens";

export async function fetchTokenData() {
  try {
    const response = await axios.get(TOKEN_API_URL, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.data?.content) {
      throw new Error("Invalid token data response");
    }

    return response.data.content;
  } catch (error) {
    console.error("Error fetching token data:", error);
    return [];
  }
}

export async function fetchYieldData(): Promise<Pool[]> {
  try {
    const response = await axios.get(YIELD_API_URL, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.data?.data) {
      throw new Error("Invalid yield data response");
    }

    const allPools = response.data.data;
    const starknetPools = allPools
      .filter((pool: any) => pool.chain?.toLowerCase() === "starknet")
      .map((pool: any) => ({
        name: pool.pool,
        apy: parseFloat(pool.apy) || 0,
        tvl: parseFloat(pool.tvlUsd) || 0,
        riskLevel: determineRiskLevel(pool.apy, pool.tvlUsd),
        impermanentLoss: determineImpermanentLossRisk(pool.pool),
        chain: "starknet",
        protocol: pool.project,
      }));

    return starknetPools.sort((a: Pool, b: Pool) => b.tvl - a.tvl);
  } catch (error) {
    console.error("Error fetching yield data:", error);
    return [];
  }
}

export async function getOrCreateUser(address: string) {
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
    console.error("Error in getOrCreateUser:", error);
    throw error;
  }
}



export async function createOrGetChat(userId: string) {
  try {
    await getOrCreateUser(userId);
    return await prisma.chat.create({
      data: { userId },
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

function determineRiskLevel(apy: number, tvl: number): string {
  if (!apy || !tvl) return "unknown";

  const tvlMillions = tvl / 1000000;

  if (apy > 100) {
    return tvlMillions > 10 ? "medium-high" : "high";
  } else if (apy > 50) {
    return tvlMillions > 20 ? "medium" : "medium-high";
  } else if (apy > 20) {
    return tvlMillions > 50 ? "low-medium" : "medium";
  } else {
    return tvlMillions > 100 ? "low" : "low-medium";
  }
}

function determineImpermanentLossRisk(poolName: string): string {
  const poolNameLower = poolName.toLowerCase();

  // Check if it's a stablecoin pool
  if (
    poolNameLower.includes("usdc") ||
    poolNameLower.includes("usdt") ||
    poolNameLower.includes("dai")
  ) {
    return "Very Low";
  }

  // Check if it's a volatile pair
  if (poolNameLower.includes("eth") || poolNameLower.includes("btc")) {
    return "Medium";
  }

  // Default for unknown compositions
  return "Variable";
}