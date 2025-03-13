/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse, type NextRequest } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { transactionProcessor } from "@/lib/transaction";
import { BrianResponse, BrianTransactionData } from "@/lib/transaction/types";
import { TRANSACTION_INTENT_PROMPT, transactionIntentPromptTemplate, ASK_OPENAI_AGENT_PROMPT, INVESTMENT_RECOMMENDATION_PROMPT, investmentRecommendationPromptTemplate } from "@/prompts/prompts";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { START, END, MessagesAnnotation, MemorySaver, StateGraph } from "@langchain/langgraph";
import { StringOutputParser } from "@langchain/core/output_parsers";
import prisma from "@/lib/db";
import { TxType } from "@prisma/client";
import { UserPreferences, InvestmentRecommendation, Pool } from "./types";
import { BRIAN_API_KEY, BRIAN_API_URL, BRIAN_TRANSACTION_API_URL, BRIAN_DEFAULT_RESPONSE, createOrGetChat, fetchTokenData, fetchYieldData, getOrCreateUser, OPENAI_API_KEY, storeMessage } from "./helper";
import axios from "axios";

// Initialize OpenAI models
const agent = new ChatOpenAI({
	modelName: "gpt-4o",
	temperature: 0.5,
	openAIApiKey: OPENAI_API_KEY,
	streaming: true,
});

const transactionLLM = new ChatOpenAI({
	model: "gpt-4",
	apiKey: OPENAI_API_KEY,
});

const systemPrompt = ASK_OPENAI_AGENT_PROMPT + "\nThe provided chat history includes a summary of the earlier conversation.";
const systemMessage = SystemMessagePromptTemplate.fromTemplate(systemPrompt);
const userMessage = HumanMessagePromptTemplate.fromTemplate("{user_query}");
const askAgentPromptTemplate = ChatPromptTemplate.fromMessages([systemMessage, userMessage]);

async function getChatHistory(chatId: string | { configurable?: { additional_args?: { chatId?: string } } }) {
	try {
		const actualChatId = typeof chatId === "object" && chatId.configurable?.additional_args?.chatId ? chatId.configurable.additional_args.chatId : chatId;

		if (!actualChatId || typeof actualChatId !== "string") {
			console.warn("Invalid chat ID provided:", chatId);
			return [];
		}

		const messages = await prisma.message.findMany({
			where: {
				chatId: actualChatId,
			},
			orderBy: {
				id: "asc",
			},
		});

		const formattedHistory = messages.flatMap((msg: any) => {
			const content = msg.content as any[];
			return content.map((c) => ({
				role: c.role,
				content: c.content,
			}));
		});

		return formattedHistory;
	} catch (error) {
		console.error("Error fetching chat history:", error);
		return [];
	}
}

async function storeTransaction(userId: string, type: string, metadata: any) {
	try {
		const transaction = await prisma.transaction.create({
			data: {
				userId,
				type: type.toUpperCase() as TxType,
				metadata,
			},
		});
		return transaction;
	} catch (error) {
		console.error("Error storing transaction:", error);
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

// LangChain workflow for Q&A
const initialCallModel = async (state: typeof MessagesAnnotation.State) => {
	const messages = [await systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }), ...state.messages];
	const response = await agent.invoke(messages);
	return { messages: response };
};

const callModel = async (state: typeof MessagesAnnotation.State, chatId?: any) => {
	if (!chatId) {
		return await initialCallModel(state);
	}

	const actualChatId = chatId?.configurable?.additional_args?.chatId || chatId;
	const chatHistory = await getChatHistory(actualChatId);
	const currentMessage = state.messages[state.messages.length - 1];

	if (chatHistory.length > 0) {
		const summaryPrompt = `
    Distill the following chat history into a single summary message. 
    Include as many specific details as you can.
    IMPORTANT NOTE: Include all information related to user's nature about trading and what kind of trader he/she is. 
    `;

		const summary = await agent.invoke([...chatHistory, { role: "user", content: summaryPrompt }]);

		const response = await agent.invoke([await systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }), summary, currentMessage]);

		return {
			messages: [summary, currentMessage, response],
		};
	} else {
		return await initialCallModel(state);
	}
};

const workflow = new StateGraph(MessagesAnnotation).addNode("model", callModel).addEdge(START, "model").addEdge("model", END);

const app = workflow.compile({ checkpointer: new MemorySaver() });

// Function to determine if a prompt is transaction-related
async function isTransactionIntent(prompt: string, messages: any[]): Promise<boolean> {
	try {
		// Simple heuristic check for transaction keywords
		const transactionKeywords = ["swap", "transfer", "send", "bridge", "deposit", "withdraw", "trade", "exchange", "transaction", "buy", "sell"];

		// Check if any transaction keyword is in the prompt
		const promptLower = prompt.toLowerCase();
		const hasTransactionKeyword = transactionKeywords.some((keyword) => promptLower.includes(keyword));

		if (hasTransactionKeyword) {
			return true;
		}

		// If no clear keywords, use LLM to determine intent
		const conversationHistory = messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

		const checkPrompt = `
    Based on the following user message and conversation history, determine if the user is trying to perform a transaction-related action (like swapping, transferring, bridging, depositing, or withdrawing assets).
    
    User message: "${prompt}"
    
    Conversation history:
    ${conversationHistory}
    
    Answer only with "true" if this is a transaction intent or "false" if it's just an information query.
    `;

		const response = await agent.invoke([
			{ role: "system", content: "You determine if user messages relate to blockchain transactions." },
			{ role: "user", content: checkPrompt },
		]);

		const answer = typeof response.content === "string" ? response.content.toLowerCase().trim() : "";
		return answer.includes("true");
	} catch (error) {
		console.error("Error determining transaction intent:", error);
		return false;
	}
}

// Function for transaction intent processing
async function getTransactionIntentFromOpenAI(prompt: string, address: string, chainId: string, messages: any[]): Promise<BrianResponse> {
	try {
		const conversationHistory = messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

		const formattedPrompt = await transactionIntentPromptTemplate.format({
			TRANSACTION_INTENT_PROMPT,
			prompt,
			chainId,
			conversationHistory,
		});

		const jsonOutputParser = new StringOutputParser();
		const response = await transactionLLM.pipe(jsonOutputParser).invoke(formattedPrompt);
		const intentData = JSON.parse(response);

		if (!intentData.isTransactionIntent) {
			throw new Error("Not a transaction-related prompt");
		}

		const intentResponse: BrianResponse = {
			solver: intentData.solver || "OpenAI-Intent-Recognizer",
			action: intentData.action,
			type: "write",
			extractedParams: {
				action: intentData.extractedParams.action,
				token1: intentData.extractedParams.token1 || "",
				token2: intentData.extractedParams.token2 || "",
				chain: intentData.extractedParams.chain || "",
				amount: intentData.extractedParams.amount || "",
				protocol: intentData.extractedParams.protocol || "",
				address: address, // should always be connected address
				dest_chain: intentData.extractedParams.dest_chain || "",
				destinationChain: intentData.extractedParams.dest_chain || "",
				destinationAddress: intentData.extractedParams.destinationAddress || (intentData.extractedParams.same_network_type === "true" ? address : ""),
			},
			data: {} as BrianTransactionData,
		};

		const value = 10 ** 18;
		const weiAmount = BigInt(intentData.extractedParams.amount * value);

		switch (intentData.action) {
			case "swap":
			case "transfer":
				intentResponse.data = {
					description: intentData.data?.description || "",
					steps:
						intentData.extractedParams.transaction?.contractAddress || intentData.extractedParams.transaction?.entrypoint || intentData.extractedParams.transaction?.calldata
							? [
									{
										contractAddress: intentData.extractedParams.transaction.contractAddress,
										entrypoint: intentData.extractedParams.transaction.entrypoint,
										calldata: [intentData.extractedParams.destinationAddress || intentData.extractedParams.address, weiAmount.toString(), "0"],
									},
							  ]
							: [],
					fromToken: {
						symbol: intentData.extractedParams.token1 || "",
						address: intentData.extractedParams.address || "",
						decimals: 1,
					},
					toToken: {
						symbol: intentData.extractedParams.token2 || "",
						address: intentData.extractedParams.address || "",
						decimals: 1,
					},
					fromAmount: intentData.extractedParams.amount,
					toAmount: intentData.extractedParams.amount,
					receiver: intentData.extractedParams.address,
					amountToApprove: intentData.data?.amountToApprove,
					gasCostUSD: intentData.data?.gasCostUSD,
				};
				break;
			case "bridge":
				intentResponse.data = {
					description: "",
					steps: [],
					bridge: {
						sourceNetwork: intentData.extractedParams.chain || "",
						destinationNetwork: intentData.extractedParams.dest_chain || "",
						sourceToken: intentData.extractedParams.token1 || "",
						destinationToken: intentData.extractedParams.token2 || "",
						amount: Number.parseFloat(intentData.extractedParams.amount || "0"),
						sourceAddress: address,
						destinationAddress: intentData.extractedParams.destinationAddress || address,
					},
				};
				break;
			case "deposit":
			case "withdraw":
				intentResponse.data = {
					description: "",
					steps: [],
					protocol: intentData.extractedParams.protocol || "",
					fromAmount: intentData.extractedParams.amount,
					toAmount: intentData.extractedParams.amount,
					receiver: intentData.extractedParams.address || "",
				};
				break;
			default:
				throw new Error(`Unsupported action type: ${intentData.action}`);
		}

		return intentResponse;
	} catch (error) {
		console.error("Error fetching transaction intent:", error);
		throw error;
	}
}

// Function for BrianAI querying
async function queryBrianAI(prompt: string, chatId?: string, streamCallback?: (chunk: string) => Promise<void>): Promise<string> {
	try {
		const response = await axios.post(
			BRIAN_API_URL,
			{
				prompt,
				kb: "starknet_kb",
			},
			{
				headers: {
					"Content-Type": "application/json",
					"x-brian-api-key": BRIAN_API_KEY,
				},
			}
		);

		const brianaiAnswer = response.data.result.answer;
		const openaiAnswer = await queryOpenAI({
			brianaiResponse: brianaiAnswer,
			userQuery: prompt,
			chatId,
			streamCallback,
		});

		return openaiAnswer;
	} catch (error) {
		console.error("Brian AI Error:", error);
		if (streamCallback) {
			throw error;
		}
		return "Sorry, I am unable to process your request at the moment.";
	}
}

// Function for OpenAI querying
async function queryOpenAI({ userQuery, brianaiResponse, chatId, streamCallback }: { userQuery: string; brianaiResponse: string; chatId?: string; streamCallback?: (chunk: string) => Promise<void> }): Promise<string> {
	try {
		if (streamCallback) {
			const messages = [await systemMessage.format({ brianai_answer: brianaiResponse }), { role: "user", content: userQuery }];

			let fullResponse = "";
			await agent.invoke(messages, {
				callbacks: [
					{
						handleLLMNewToken: async (token: string) => {
							fullResponse += token;
							await streamCallback(token);
						},
					},
				],
			});

			return fullResponse;
		}

		const response = await app.invoke(
			{
				messages: [
					await askAgentPromptTemplate.format({
						brianai_answer: brianaiResponse,
						user_query: userQuery,
					}),
				],
			},
			{
				configurable: {
					thread_id: chatId || "1",
					additional_args: { chatId },
				},
			}
		);

		return response.messages[response.messages.length - 1].content as string;
	} catch (error) {
		console.error("OpenAI Error:", error);
		return "Sorry, I am unable to process your request at the moment.";
	}
}

// Function for investment recommendations
async function generateInvestmentRecommendations(userPreferences: UserPreferences, tokens: any[], yields: any[], messages: any[] = []): Promise<InvestmentRecommendation> {
	try {
		const conversationHistory = messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

		const formattedPrompt = await investmentRecommendationPromptTemplate.format({
			INVESTMENT_RECOMMENDATION_PROMPT,
			userPreferences: JSON.stringify(userPreferences),
			tokens: JSON.stringify(tokens),
			yields: JSON.stringify(yields),
			conversationHistory,
		});

		const jsonOutputParser = new StringOutputParser();
		const response = await agent.pipe(jsonOutputParser).invoke(formattedPrompt);
		const recommendationData = JSON.parse(response);

		if (!recommendationData.data?.pools || !recommendationData.data?.strategy) {
			throw new Error("Invalid recommendation format");
		}

		return {
			solver: recommendationData.solver || "OpenAI-Investment-Advisor",
			type: "recommendation",
			extractedParams: {
				riskTolerance: recommendationData.extractedParams.riskTolerance || userPreferences.riskTolerance,
				investmentHorizon: recommendationData.extractedParams.investmentHorizon || userPreferences.investmentHorizon,
				preferredAssets: recommendationData.extractedParams.preferredAssets || userPreferences.preferredAssets,
				preferredChains: recommendationData.extractedParams.preferredChains || userPreferences.preferredChains,
			},
			data: recommendationData.data,
		};
	} catch (error) {
		console.error("Error generating investment recommendations:", error);
		throw error;
	}
}

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
				"x-brian-api-key": process.env.BRIAN_API_KEY || "",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(`Brian AI API error: ${errorData.error || response.statusText}`);
		}

		console.log("response from BRIAN", response);

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

// Main API route handler
export async function POST(request: Request) {
	try {
		const {
			prompt,
			address,
			messages = [],
			chatId,
			stream = false,
			userPreferences,
			chainId = "4012", // Default Starknet chain ID
		} = await request.json();

		if (!prompt || !address) {
			return NextResponse.json({ error: "Missing required parameters (prompt or address)" }, { status: 400 });
		}

		const userId = address || "0x0";
		await getOrCreateUser(userId);

		let currentChatId = chatId;
		if (!currentChatId) {
			const newChat = await createOrGetChat(userId);
			currentChatId = newChat.id;
		}

		// Process messages
		const uniqueMessages = messages
			.filter((msg: any) => msg.sender === "user")
			.reduce((acc: any[], curr: any) => {
				if (!acc.some((msg) => msg.content === curr.content)) {
					acc.push({
						role: "user",
						content: curr.content,
					});
				}
				return acc;
			}, []);

		// Store user message
		await storeMessage({
			content: uniqueMessages,
			chatId: currentChatId,
			userId,
		});

		// Determine if this is a transaction intent or a question
		const isTransaction = await isTransactionIntent(prompt, uniqueMessages);

		// Handle investment recommendations
		if (prompt.toLowerCase().includes("recommend") || prompt.toLowerCase().includes("invest")) {
			const tokens = await fetchTokenData();
			const yields = await fetchYieldData();
			const recommendations = await generateInvestmentRecommendations(userPreferences, tokens, yields, uniqueMessages);

			// Store the recommendations in the chat history
			await storeMessage({
				content: [
					{
						role: "assistant",
						content: recommendations.data.description,
						recommendationData: {
							...recommendations,
							timestamp: new Date().toISOString(),
							userId,
							chatId: currentChatId,
						},
					},
				],
				chatId: currentChatId,
				userId,
			});

			const response = {
				content: recommendations.data.description,
				recommendations,
				chatId: currentChatId,
			};

			if (stream) {
				// Handle streaming response
				const encoder = new TextEncoder();
				const stream = new TransformStream();
				const writer = stream.writable.getWriter();
				// Stream the response
				await writer.write(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
				await writer.close();
				return new Response(stream.readable, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					},
				});
			}

			return NextResponse.json(response);
		}
		// Handle transaction intents
		else if (isTransaction) {
			try {
				// const transactionIntent = await getTransactionIntentFromOpenAI(prompt, address, chainId, uniqueMessages);
				const transactionIntent = await callBrianAI(prompt, address, chainId, messages);

				const processedTx = await transactionProcessor.processTransaction(transactionIntent);

				if (["deposit", "withdraw"].includes(transactionIntent.action)) {
					processedTx.receiver = address;
				}

				const transaction = await storeTransaction(userId, transactionIntent.action, {
					...processedTx,
					chainId,
					originalIntent: transactionIntent,
				});

				await storeMessage({
					content: [
						{
							role: "assistant",
							content: processedTx.description || JSON.stringify(processedTx),
							transactionId: transaction.id,
						},
					],
					chatId: currentChatId,
					userId,
				});

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
							chatId: currentChatId,
						},
					],
				});
			} catch (error: string | any) {
				console.error("Transaction processing error:", error);
				// If transaction processing fails, fall back to BrianAI
				// const response = await queryBrianAI(prompt, currentChatId);

				// await storeMessage({
				// 	content: [
				// 		{
				// 			role: "assistant",
				// 			content: response,
				// 		},
				// 	],
				// 	chatId: currentChatId,
				// 	userId,
				// });

				return NextResponse.json({
					answer: error.message,
					chatId: currentChatId,
				});
			}
		}
		// Handle general questions
		else {
			// Non-streaming response
			const response = await queryBrianAI(prompt, currentChatId);

			if (!response) {
				throw new Error("Unexpected API response format");
			}

			await storeMessage({
				content: [
					{
						role: "assistant",
						content: response,
					},
				],
				chatId: currentChatId,
				userId,
			});

			return NextResponse.json({
				answer: response,
				chatId: currentChatId,
			});
		}
	} catch (error: any) {
		console.error("Error:", error);
		if (error.code === "P2003") {
			return NextResponse.json(
				{
					error: "User authentication required",
					details: "Please ensure you are logged in.",
				},
				{ status: 401 }
			);
		}

		return NextResponse.json({ error: "Unable to process request", details: error.message }, { status: 500 });
	}
}

export async function GET() {
	return NextResponse.json({ message: "API is working" });
  }
