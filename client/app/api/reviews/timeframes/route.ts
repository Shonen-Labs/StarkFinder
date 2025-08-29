import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In a real implementation, this would fetch from your database
    const timeframes = [
      "Last 24 hours",
      "Last week",
      "Last month",
      "Last 3 months",
      "Last 6 months",
      "Last year",
      "All time",
      "This quarter",
      "This year",
      "Last quarter",
    ];

    return NextResponse.json(timeframes);
  } catch (error) {
    console.error("Error fetching timeframes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
