import axios from 'axios';

export interface DeepSeekOptions {
	apiKey: string;
	model?: string;
	temperature?: number;
	maxTokens?: number;
	maxRetries?: number;
}

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
	role: MessageRole;
	content: string;
}

export class DeepSeekClient {
	private apiKey: string;
	private model: string;
	private temperature: number;
	private maxTokens?: number;
	private maxRetries: number;
	// private readonly baseUrl = 'https://api.deepseek.com/v1/chat/completions';
	private readonly baseUrl = 'https://api.deepseek.com/chat/completions';

	constructor(options: DeepSeekOptions) {
		this.apiKey = options.apiKey;
		this.model = 'deepseek-chat'; //options.model ?? 'deepseek-coder-v2';
		this.temperature = options.temperature ?? 0.2;
		this.maxTokens = options.maxTokens;
		this.maxRetries = options.maxRetries ?? 3;
	}

	private buildMessages(messages: Message[], systemPrompt?: string): Message[] {
		if (systemPrompt) {
			return [{ role: 'system', content: systemPrompt }, ...messages];
		}
		return messages;
	}

	async generateCompletion(
		messages: Message[],
		systemPrompt?: string
	): Promise<string> {
		let attempt = 0;
		const finalMessages = this.buildMessages(messages, systemPrompt);

		while (attempt <= this.maxRetries) {
			try {
				const payload: Record<string, any> = {
					model: this.model,
					messages: finalMessages,
					temperature: this.temperature,
				};

				if (this.maxTokens) {
					payload.max_tokens = this.maxTokens;
				}

				const response = await axios.post(this.baseUrl, payload, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.apiKey}`,
					},
				});

				return response.data.choices?.[0]?.message?.content ?? '';
			} catch (error) {
				attempt++;
				if (attempt > this.maxRetries) throw error;
				await new Promise((res) =>
					setTimeout(res, 1000 * Math.pow(2, attempt))
				);
			}
		}
		throw new Error('Max retries exceeded');
	}

	async streamCompletion(
		messages: Message[],
		systemPrompt?: string
	): Promise<NodeJS.ReadableStream> {
		const finalMessages = this.buildMessages(messages, systemPrompt);

		const payload: Record<string, any> = {
			model: this.model,
			messages: finalMessages,
			temperature: this.temperature,
			stream: true,
		};

		if (this.maxTokens) {
			payload.max_tokens = this.maxTokens;
		}

		const response = await axios.post(this.baseUrl, payload, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			responseType: 'stream',
		});

		return response.data;
	}
}

export const createDeepSeekClient = (
	options?: Partial<Omit<DeepSeekOptions, 'apiKey'>>
): DeepSeekClient => {
	const apiKey = process.env.DEEPSEEK_API_KEY;
	if (!apiKey) {
		throw new Error('DEEPSEEK_API_KEY environment variable is not set');
	}

	return new DeepSeekClient({
		apiKey,
		model: options?.model ?? 'deepseek-coder-v2',
		temperature: options?.temperature ?? 0.2,
		maxRetries: options?.maxRetries ?? 3,
		maxTokens: options?.maxTokens,
	});
};
