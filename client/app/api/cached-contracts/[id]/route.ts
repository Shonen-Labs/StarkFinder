import { NextRequest, NextResponse } from "next/server";
import { contractCacheService } from "@/lib/services/contractCacheService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    const contract = await contractCacheService.getContract(userId, contractId);

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("Error fetching cached contract:", error);
    return NextResponse.json(
      { error: "Failed to fetch cached contract" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const { name, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Update contract name in Redis cache
    const success = await contractCacheService.updateContractName(userId, contractId, name);

    if (!success) {
      return NextResponse.json(
        { error: "Contract not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    // Get updated contract
    const updatedContract = await contractCacheService.getContract(userId, contractId);

    return NextResponse.json({
      message: "Contract updated successfully",
      contract: {
        id: updatedContract?.id,
        name: updatedContract?.name,
        createdAt: updatedContract?.createdAt,
        isDeployed: updatedContract?.isDeployed,
      },
    });
  } catch (error) {
    console.error("Error updating cached contract:", error);
    return NextResponse.json(
      { error: "Failed to update cached contract" },
      { status: 500 }
    );
  }
} 