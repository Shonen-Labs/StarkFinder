// client/lib/devxstark/deepseek-client.ts
import { ChatDeepSeek } from "@langchain/community/chat_models/deepseek"; // Assuming LangChain adds DeepSeek support

export const createDeepSeekClient = () => {
    return new ChatDeepSeek({
        modelName: "deepseek-chat",
        temperature: 0.2,
        maxTokens: undefined,
        maxRetries: 3,
        apiKey: process.env.DEEPSEEK_API_KEY,
        // Additional DeepSeek-specific options can go here
    });
};

// Alternative implementation if LangChain doesn't support DeepSeek yet:
export class DeepSeekClient {
    private apiKey: string;
    
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY!;
        if (!this.apiKey) {
            throw new Error("DEEPSEEK_API_KEY is not configured");
        }
    }

    async chat(messages: Array<{ role: string; content: string }>) {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages,
                temperature: 0.2
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}