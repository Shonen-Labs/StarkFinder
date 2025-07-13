import { NextRequest, NextResponse } from "next/server";
import { contractCacheService } from "@/lib/services/contractCacheService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));    
    const deployedOnly = searchParams.get("deployedOnly") === "true";
    const undeployedOnly = searchParams.get("undeployedOnly") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch contracts from Redis cache
    const result = await contractCacheService.getUserContracts(userId, {
      page,
      limit,
      deployedOnly,
      undeployedOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching cached contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch cached contracts" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get("contractId");
    const userId = searchParams.get("userId");

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: "contractId and userId parameters are required" },
        { status: 400 }
      );
    }

    // Delete contract from Redis cache
    const result = await contractCacheService.deleteContract(userId, contractId);

    if (!result.success) {
      if (result.error === 'Contract not found') {
        return NextResponse.json(
          { error: "Contract not found or you don't have permission to delete it" },
          { status: 404 }
        );
      }
      
      if (result.error?.includes('Cannot delete deployed contracts')) {
        return NextResponse.json(
          { 
            error: "Cannot delete deployed contracts",
            details: result.error
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: result.error || "Failed to delete contract" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Contract deleted successfully",
      deletedContract: {
        id: contractId,
      },
    });
  } catch (error) {
    console.error("Error deleting cached contract:", error);
    return NextResponse.json(
      { error: "Failed to delete cached contract" },
      { status: 500 }
    );
  }
} 