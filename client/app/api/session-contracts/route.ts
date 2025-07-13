import { NextRequest, NextResponse } from "next/server";
import { contractCacheService } from "@/lib/services/contractCacheService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch contracts for this session from Redis cache
    const contracts = await contractCacheService.getSessionContracts(sessionId);

    return NextResponse.json({
      sessionId,
      contracts,
      count: contracts.length,
    });
  } catch (error) {
    console.error("Error fetching session contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch session contracts" },
      { status: 500 }
    );
  }
} 