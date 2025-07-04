import { NextRequest, NextResponse } from "next/server";
import { deepseek } from "@/lib/devxstark/deepseek-client";

export async function POST(req: NextRequest) {
  try {
    const { sourceCode } = await req.json();

    if (!sourceCode || typeof sourceCode !== "string") {
      return NextResponse.json(
        { error: "`sourceCode` is required in the request body." },
        { status: 400 }
      );
    }

    const response = await deepseek.chatStream([
      {
        role: "system",
        content: getStarknetSystemPrompt(),
      },
      {
        role: "user",
        content: `Carefully audit this Starknet smart contract \n\n${sourceCode}.\n\nProvide a STRICTLY FORMATTED JSON response using this Format: ${outputFormat}`,
      },
    ]);

    return new NextResponse(response, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

function getStarknetSystemPrompt() {
  return `You are a Starknet Smart Contract security expert. Your task is to audit a smart contract focusing on the following security aspects:

1. Contract Anatomy
- Validate method visibility and access controls
- Check for proper use of decorators
- Ensure appropriate function modifiers

2. State Management
- Verify state mutation safety
- Check for potential reentrancy vulnerabilities
- Validate state update patterns

3. Access Control
- Review authorization mechanisms
- Check for proper role-based access control
- Validate ownership and admin privileges

4. External Calls
- Analyze cross-contract interactions
- Check for potential manipulation in external calls
- Verify gas limits and error handling

5. Asset Management
- Review token transfer mechanisms
- Check for potential overflow/underflow
- Validate balance tracking and updates

6. Cryptographic Operations
- Review signature verification
- Check for randomness generation
- Validate cryptographic primitive usage

7. Economic Vulnerabilities
- Check for potential front-running
- Analyze economic attack surfaces
- Verify economic incentive alignment

Output Format:
{
    contract_name: string,
    audit_date: string,
    security_score: number, // 0-100
    original_contract_code: string,
    corrected_contract_code: string,
    vulnerabilities: [
        {
            category: string,
            severity: 'Low'|'Medium'|'High',
            description: string,
            recommended_fix: string
        }
    ],
    recommended_fixes: string[]
}

IMPORTANT: 
- Provide the FULL corrected contract code, not just code snippets
- Include concrete, implementable code fixes for each vulnerability
- Explain all changes made in the corrected code`;
}

const outputFormat = `
{
    contract_name: string,
    audit_date: string,
    security_score: number, // 0-100
    original_contract_code: string,
    corrected_contract_code: string,
    vulnerabilities: [
        {
            category: string,
            severity: 'Low'|'Medium'|'High',
            description: string,
            recommended_fix: string
        }
    ],
    recommended_fixes: string[]
}
`;
