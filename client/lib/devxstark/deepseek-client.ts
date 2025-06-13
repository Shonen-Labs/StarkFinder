/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatCompletionMessageParam } from "openai/resources/index";
// client/lib/devxstark/deepseek-client.ts
type Message = ChatCompletionMessageParam;

interface DeepSeekInterface {
	chat(messages: Message[], stream?: boolean): Promise<any>;
}

export class DeepSeekClient implements DeepSeekInterface {
	private apiKey: string;
	private useOpenAI: boolean;

	constructor() {
		this.apiKey = process.env.DEEPSEEK_API_KEY!;
		if (!this.apiKey) throw new Error("Deepseek is not configured");

		this.useOpenAI = true;
	}

	async chat(messages: Message[], stream = false): Promise<any> {
		if (this.useOpenAI && stream) {
			const OpenAI = (await import("openai")).default;
			const openai = new OpenAI({
				baseURL: "https://api.deepseek.com",
				apiKey: this.apiKey
			});
			return openai.chat.completions.create({
				model: "deepseek-chat",
				messages,
				stream: true,
			});
		}
		const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-type": "application/json",
				"Authorization": `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: "deepseek-chat",
				messages,
				temperature: 0.2
			})
		});

		if (!response.ok) throw new Error(`Deepseek api error: ${response.statusText}`);
		const data = await response.json();
		return data.choices[0].message.content;
	}
}