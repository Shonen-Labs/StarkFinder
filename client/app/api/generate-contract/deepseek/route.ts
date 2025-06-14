import { DeepSeekContractGenerator } from "@/lib/devxstark/contract-generator1";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { requeriments } = await req.json();

        if (!requeriments) {
            return NextResponse.json({ error: "Missing contract requeriments" }, { status: 400 });
        }

        const generator = new DeepSeekContractGenerator();
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                await generator.generateContract(requeriments, {
                    onProgress(chunk) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({chunk})}\n\n`));
                    },
                });
                controller.close();
            }
        });
        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error("Error generating contract: ", err);
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}