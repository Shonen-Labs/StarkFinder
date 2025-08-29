import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In a real implementation, this would fetch from your database
    const tags = [
      "frontend",
      "backend",
      "blockchain",
      "ai",
      "defi",
      "security",
      "performance",
      "documentation",
      "testing",
      "deployment",
      "ui/ux",
      "mobile",
      "web3",
      "smart-contracts",
      "database",
      "api",
      "devops",
      "machine-learning",
      "data-science",
      "cloud",
    ];

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
