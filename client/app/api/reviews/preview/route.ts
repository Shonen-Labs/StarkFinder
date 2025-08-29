import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required and must be a string" },
        { status: 400 }
      );
    }

    // Simulate safety check logic
    // In a real implementation, this would call an external safety API
    const safetyCheck = {
      isToxic: content.toLowerCase().includes("hate") || content.toLowerCase().includes("stupid"),
      hasPII: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content) ||
              /\b\d{3}-\d{2}-\d{4}\b/.test(content), // Email or SSN patterns
      toxicityScore: content.toLowerCase().includes("hate") ? 0.8 : 0.1,
      piiDetected: [] as string[],
      warnings: [] as string[],
    };

    // Check for PII patterns
    const emailMatches = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    const ssnMatches = content.match(/\b\d{3}-\d{2}-\d{4}\b/g);

    if (emailMatches) {
      safetyCheck.piiDetected.push("Email addresses");
    }
    if (ssnMatches) {
      safetyCheck.piiDetected.push("Social Security Numbers");
    }

    // Add warnings for potentially problematic content
    if (content.length < 10) {
      safetyCheck.warnings.push("Review seems too short. Consider adding more details.");
    }

    if (content.length > 4000) {
      safetyCheck.warnings.push("Review is quite long. Consider being more concise.");
    }

    // Simulate rate limiting (randomly)
    if (Math.random() < 0.1) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Simulate employment verification requirement (randomly)
    if (Math.random() < 0.05) {
      return NextResponse.json(
        { error: "Employment verification required" },
        { status: 403 }
      );
    }

    return NextResponse.json(safetyCheck);
  } catch (error) {
    console.error("Safety check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
