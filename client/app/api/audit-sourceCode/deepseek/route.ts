import { DeepSeekClient } from "@/lib/devxstark/deepseek-client";
import { getStarknetSystemPrompt } from "../route";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index";

export async function POST(req: NextRequest) {
    try {
        const { sourceCode } = await req.json();
        const deepseek = new DeepSeekClient();

        const messages: ChatCompletionMessageParam[] = [
            { role: "system", content: getStarknetSystemPrompt() },
            { role: "user", content: "write your code" }
        ];

        const completion = await deepseek.chat(messages, true);
        if (!sourceCode) return NextResponse.json({ error: "Missing sourceCode" }, { status: 400 });
        if (completion && completion[Symbol.asyncIterator]) {

            const stream = new ReadableStream({
                async start(controller) {
                    for await (const chunk of completion) {
                        const text = chunk.choices[0]?.delta?.content || "";
                        controller.enqueue(`data: ${ JSON.stringify({ chunk: text }) }\n\n`);
                    }
                    controller.close();
                },
            });
            return new NextResponse(stream, {
                headers: {
                    "Content-type": "text/event-stream",
                    "Cache-control": "no-cache",
                    Connection: "keep-alive",
                },
            })
        }
        return NextResponse.json({ completion });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}
