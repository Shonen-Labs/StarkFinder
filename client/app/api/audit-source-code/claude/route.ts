import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
	try {
		// Parse request body
		const { sourceCode } = await req.json();
		const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

		const stream = await claude.messages.create({
			model: 'claude-3-opus-20240229',
			system: getStarknetSystemPrompt(),
			max_tokens: 4096,
			messages: [
				{
					role: 'user',
					content: `Carefully audit the following Starknet smart contract and provide a STRICTLY FORMATTED JSON response:\n\n${sourceCode}`,
				},
			],
			stream: true,
		});

		const response = new ReadableStream({
			async start(controller) {
				let fullResponse = '';
				for await (const messageStream of stream) {
					if (messageStream.type === 'content_block_delta') {
						const deltaText = messageStream.delta.type; // Adjust if incorrect
						fullResponse += deltaText;
						controller.enqueue(
							`data: ${JSON.stringify({ chunk: deltaText })}\n\n`
						);
					}
				}
				controller.close();

				// Log full response and extract JSON
				console.log(fullResponse);
				const jsonContent = extractJSON(fullResponse);
				try {
					JSON.parse(jsonContent); // Verify JSON structure
				} catch (parseError) {
					console.error('JSON Parsing Error:', parseError);
					throw new Error('Invalid JSON response received.');
				}
			},
		});

		return new NextResponse(response, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		});
	} catch (error) {
		console.error('API Error:', error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred',
			},
			{ status: 500 }
		);
	}
}

function extractJSON(text: string) {
	const codeBlockMatch = text.match(/```json\n([\s\S]*?)```/);
	if (codeBlockMatch) return codeBlockMatch[1].trim();
	const bracketMatch = text.match(/\{[\s\S]*\}/);
	if (bracketMatch) return bracketMatch[0].trim();
	const cleanedText = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
	return cleanedText;
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
