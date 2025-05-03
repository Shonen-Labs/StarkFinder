import { NextRequest, NextResponse } from 'next/server';
import { createDeepSeekClient, MessageRole } from '@/lib/deepseek';
import { Anthropic } from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
	try {
		const { sourceCode, provider } = await req.json();

		const defaultProvider = provider || process.env.DEFAULT_LLM_PROVIDER;

		if (!sourceCode || !defaultProvider) {
			return NextResponse.json(
				{ error: 'sourceCode and provider are required' },
				{ status: 400 }
			);
		}

		if (defaultProvider === 'deepseek') {
			return handleDeepSeekStream(sourceCode);
		} else if (defaultProvider === 'anthropic') {
			return handleClaudeStream(sourceCode);
		} else {
			return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
		}
	} catch (error) {
		console.error('API Error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Unexpected error' },
			{ status: 500 }
		);
	}
}

async function handleDeepSeekStream(sourceCode: string) {
	const deepseekClient = createDeepSeekClient();

	const stream = new ReadableStream({
		async start(controller) {
			try {
				let fullResponse = '';

				const messages = [
					{
						role: 'user' as MessageRole,
						content: `Carefully audit the following Starknet smart contract and provide a STRICTLY FORMATTED JSON response:\n\n${sourceCode}`,
					},
				];

				const deepseekStream = await deepseekClient.streamCompletion(
					messages,
					getStarknetSystemPrompt()
				);

				deepseekStream.on('data', (chunk: Buffer) => {
					const text = chunk.toString();
					const lines = text.split('\n').filter((line) => line.trim() !== '');

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const data = line.substring(6);
							if (data === '[DONE]') continue;

							try {
								const jsonData = JSON.parse(data);
								const deltaText = jsonData.choices?.[0]?.delta?.content;
								if (deltaText) {
									fullResponse += deltaText;
									controller.enqueue(
										`data: ${JSON.stringify({ chunk: deltaText })}\n\n`
									);
								}
							} catch (e) {
								console.error('Failed to parse JSON chunk:', e);
							}
						}
					}
				});

				deepseekStream.on('end', () => {
					console.log('DeepSeek stream ended');
					console.log(fullResponse);
					try {
						const jsonContent = extractJSON(fullResponse);
						JSON.parse(jsonContent);
						console.log('Successfully validated final JSON');
					} catch (e) {
						console.error('Final JSON parse failed:', e);
						controller.enqueue(
							`event: error\ndata: ${JSON.stringify({
								error:
									'Invalid JSON in response: ' +
									(e instanceof Error ? e.message : String(e)),
							})}\n\n`
						);
					}
					controller.close();
				});

				deepseekStream.on('error', (err) => {
					console.error('Stream error:', err);
					controller.enqueue(
						`event: error\ndata: ${JSON.stringify({
							error: err || 'Unexpected error',
						})}\n\n`
					);
					controller.close();
				});
			} catch (error) {
				console.error('Stream initialization failed:', error);
				controller.enqueue(
					`event: error\ndata: ${JSON.stringify({
						error:
							error instanceof Error
								? error.message
								: 'Stream initialization failed',
					})}\n\n`
				);
				controller.close();
			}
		},
	});

	return new NextResponse(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
}

async function handleClaudeStream(sourceCode: string) {
	const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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
				if (
					messageStream.type === 'content_block_delta' &&
					'text' in messageStream.delta
				) {
					const deltaText = messageStream.delta.text || '';
					fullResponse += deltaText;
					controller.enqueue(
						`data: ${JSON.stringify({ chunk: deltaText })}\n\n`
					);
				}
			}
			controller.close();

			console.log(fullResponse);
			try {
				const jsonContent = extractJSON(fullResponse);
				JSON.parse(jsonContent);
				console.log('Successfully validated Claude final JSON');
			} catch (e) {
				console.error('Claude JSON parse failed:', e);
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
}

function extractJSON(text: string) {
	const codeBlockMatch = text.match(/```json\n([\s\S]*?)```/);
	if (codeBlockMatch) {
		const jsonText = codeBlockMatch[1].trim();
		try {
			JSON.parse(jsonText);
			return jsonText;
		} catch (e) {
			console.error('JSON parse failed:', e);
			return repairJSON(jsonText);
		}
	}

	const bracketMatch = text.match(/\{[\s\S]*\}/);
	if (bracketMatch) {
		const jsonText = bracketMatch[0].trim();
		try {
			JSON.parse(jsonText);
			return jsonText;
		} catch (e) {
			console.error('JSON parse failed:', e);
			return repairJSON(jsonText);
		}
	}

	const cleanedText = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
	try {
		JSON.parse(cleanedText);
		return cleanedText;
	} catch (e) {
		console.error('JSON parse failed:', e);
		return repairJSON(cleanedText);
	}
}

function repairJSON(text: string) {
	console.warn('Attempting to repair JSON...');
	return text;
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
