/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { NextRequest, NextResponse } from "next/server";
import { DeploymentOrchestrator } from "@/lib/deployment/deploymentOrchestrator";
import { DatabaseService } from "@/lib/deployment/databaseService";
import { DeploymentRequest } from "@/types/deployment";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let requestBody: DeploymentRequest;
    try {
      requestBody = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const { sourceCode, scarbToml } = requestBody;

    if (!sourceCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: sourceCode",
          details: "Source code is required for deployment",
        },
        { status: 400 }
      );
    }

    if (!scarbToml) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: scarbToml",
          details: "Scarb.toml configuration is required for deployment",
        },
        { status: 400 }
      );
    }

    // Deploy contract using orchestrator
    const result = await DeploymentOrchestrator.deployContract(requestBody);

    if (!result.success) {
      const statusCode = 
        result.error === "Environment configuration error" ? 500 :
        result.error === "Missing required field: constructorArgs" ? 400 :
        result.error === "Compilation failed" ? 500 :
        result.error === "No compiled contracts found" ? 500 :
        result.error === "Contract validation failed" ? 400 :
        result.error === "RPC provider unavailable" ? 503 :
        500;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Unexpected error in deployment route:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error", 
        details: "An unexpected error occurred during deployment" 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: userId } = context.params;

    const contracts = await DatabaseService.getDeployedContracts(userId);

    if (!contracts.length) {
      return NextResponse.json(
        { error: "No deployed contracts found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ userId, contracts });
  } catch (error) {
    console.error("Error fetching deployed contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployed contracts" },
      { status: 500 }
    );
  }
}