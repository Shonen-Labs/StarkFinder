import 'dotenv/config';
interface DeepSeekMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface DeepSeekResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

interface DeepSeekClientOptions {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    maxRetries?: number;
    baseURL?: string;
}

export class DeepSeekClient {
    private apiKey: string;
    private model: string;
    private temperature: number;
    private maxTokens?: number;
    private maxRetries: number;
    private baseURL: string;

    constructor(options: DeepSeekClientOptions = {}) {
        this.apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
        this.model = options.model || 'deepseek-reasoner';
        this.temperature = options.temperature ?? 0.2;
        this.maxTokens = options.maxTokens;
        this.maxRetries = options.maxRetries ?? 3;
        this.baseURL = options.baseURL || 'https://api.deepseek.com';

        if (!this.apiKey) {
            throw new Error('DEEPSEEK_API_KEY is not configured. Please set it in environment variables or pass it as an option.');
        }
    }

    async chat(messages: DeepSeekMessage[]): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.makeRequest(messages);
                return response.choices[0]?.message?.content || '';
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === this.maxRetries) {
                    break;
                }

                // Wait before retrying (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw new Error(`DeepSeek API failed after ${this.maxRetries + 1} attempts. Last error: ${lastError?.message}`);
    }

    async chatStream(messages: DeepSeekMessage[]): Promise<ReadableStream<string>> {
        const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                if (!reader) {
                    controller.close();
                    return;
                }

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            controller.close();
                            break;
                        }

                        // Add new chunk to buffer
                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;

                        // Process complete lines (SSE format)
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // Keep incomplete line in buffer

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            
                            // Skip empty lines and comments
                            if (!trimmedLine || trimmedLine.startsWith(':')) {
                                continue;
                            }

                            if (trimmedLine.startsWith('data: ')) {
                                const data = trimmedLine.slice(6);
                                
                                if (data === '[DONE]') {
                                    continue;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(content);
                                    }
                                } catch (error) {
                                    // Log parse errors but continue processing
                                    console.warn('Error parsing JSON from DeepSeek stream:', {
                                        data: data.substring(0, 100) + (data.length > 100 ? '...' : ''),
                                        error: error instanceof Error ? error.message : 'Unknown error'
                                    });
                                    // Don't throw here, just continue with the next chunk
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Stream processing error:', error);
                    controller.error(error);
                } finally {
                    reader.releaseLock();
                }
            },
        });

        return stream;
    }

    private async makeRequest(messages: DeepSeekMessage[]): Promise<DeepSeekResponse> {
        const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
    }

    // Utility method for simple completions
    async complete(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: DeepSeekMessage[] = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        
        messages.push({ role: 'user', content: prompt });
        
        return await this.chat(messages);
    }
}

// Factory function for easy instantiation
export const createDeepSeekClient = (options?: DeepSeekClientOptions): DeepSeekClient => {
    return new DeepSeekClient(options);
};

// Default instance with environment variables
export const deepseek = createDeepSeekClient();

// Export as default for easier importing
export default DeepSeekClient;