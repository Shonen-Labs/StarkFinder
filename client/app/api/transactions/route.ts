import { NextResponse, type NextRequest } from "next/server";
import { transactionProcessor } from "@/lib/transaction";
import prisma from "@/lib/db";
import type { TxType } from "@prisma/client";
import type { BrianResponse } from "@/lib/transaction/types";
import { BRIAN_TRANSACTION_API_URL } from "../ask/heper";

// Brian AI API client
async function callBrianAI(prompt: string, address: string, chainId: string, messages: any[] = []): Promise<BrianResponse> {
	try {
		// Format conversation history in the way Brian API expects
		const conversationHistory = messages.map((msg) => ({
			sender: msg.role === "user" ? "user" : "brian",
			content: msg.content,
		}));

		// Prepare the request payload
		const payload = {
			prompt,
			address,
			chainId,
			messages: conversationHistory,
		};

		// Call the Brian AI API
		const response = await fetch(BRIAN_TRANSACTION_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-brian-api-key": process.env.NEXT_PUBLIC_BRIAN_API_KEY || "",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(`Brian AI API error: ${errorData.error || response.statusText}`);
		}

		const brianData = await response.json();

		if (!brianData.result || !brianData.result.length) {
			throw new Error("No result returned from Brian AI");
		}

		// Convert Brian API response to our BrianResponse format
		const transactionResult = brianData.result[0];
		// console.log("transactionResult from BRIAN", transactionResult);

		// Map the response to our expected format
		const brianResponse: BrianResponse = {
			solver: transactionResult.solver,
			action: transactionResult.action,
			type: transactionResult.type,
			extractedParams: transactionResult.extractedParams,
			data: transactionResult.data,
		};

		return brianResponse;
	} catch (error) {
		console.error("Error calling Brian AI:", error);
		throw error;
	}
}

async function getOrCreateTransactionChat(userId: string) {
	try {
		const chat = await prisma.chat.create({
			data: {
				userId,
				type: "TRANSACTION",
			},
		});
		return chat;
	} catch (error) {
		console.error("Error creating transaction chat:", error);
		throw error;
	}
}

async function storeTransaction(userId: string, type: string, metadata: any) {
	try {
		const transaction = await prisma.transaction.create({
			data: {
				userId,
				type: type as TxType,
				metadata,
			},
		});
		return transaction;
	} catch (error) {
		console.error("Error storing transaction:", error);
		throw error;
	}
}

async function storeMessage({ content, chatId, userId }: { content: any[]; chatId: string; userId: string }) {
	try {
		const message = await prisma.message.create({
			data: {
				content,
				chatId,
				userId,
			},
		});
		return message;
	} catch (error) {
		console.error("Error storing message:", error);
		throw error;
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, address, messages = [], chainId = "4012" } = body;

		if (!prompt || !address) {
			return NextResponse.json({ error: "Missing required parameters (prompt or address)" }, { status: 400 });
		}

		// Get or create user
		let user = await prisma.user.findFirst({
			where: { address },
		});

		if (!user) {
			user = await prisma.user.create({
				data: { address },
			});
		}

		const chat = await getOrCreateTransactionChat(user.id);

		try {
			// Store user message
			await storeMessage({
				content: [{ role: "user", content: prompt }],
				chatId: chat.id,
				userId: user.id,
			});

			// Get transaction intent from Brian AI
			const transactionIntent = await callBrianAI(prompt, address, chainId, messages);
			console.log("Transaction Intent from Brian AI:", JSON.stringify(transactionIntent, null, 2));

			// Process the transaction using the transaction processor
			const processedTx = await transactionProcessor.processTransaction(transactionIntent);
			console.log("Processed Transaction:", JSON.stringify(processedTx, null, 2));

			// Handle receiver for deposit/withdraw cases
			if (["deposit", "withdraw"].includes(transactionIntent.action)) {
				processedTx.receiver = address;
			}

			// Store the transaction
			const transaction = await storeTransaction(user.id, transactionIntent.action.toUpperCase(), {
				...processedTx,
				chainId,
				originalIntent: transactionIntent,
			});

			// Store assistant message
			await storeMessage({
				content: [
					{
						role: "assistant",
						content: JSON.stringify(processedTx),
						transactionId: transaction.id,
					},
				],
				chatId: chat.id,
				userId: user.id,
			});

			// Return response in the expected format
			return NextResponse.json({
				result: [
					{
						data: {
							description: processedTx.description,
							transaction: {
								type: processedTx.action,
								data: {
									transactions: processedTx.transactions,
									fromToken: processedTx.fromToken,
									toToken: processedTx.toToken,
									fromAmount: processedTx.fromAmount,
									toAmount: processedTx.toAmount,
									receiver: processedTx.receiver,
									gasCostUSD: processedTx.estimatedGas,
									solver: processedTx.solver,
									protocol: processedTx.protocol,
									bridge: processedTx.bridge,
								},
							},
						},
						conversationHistory: messages,
					},
				],
			});
		} catch (error) {
			console.error("Transaction processing error:", error);
			return NextResponse.json(
				{
					error: error instanceof Error ? error.message : "Transaction processing failed",
					details: error instanceof Error ? error.stack : undefined,
				},
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("Request processing error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
