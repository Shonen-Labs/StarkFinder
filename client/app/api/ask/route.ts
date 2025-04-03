import { NextRequest, NextResponse } from "next/server";

interface OpenAIData {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface BrianData {
  reply?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, model = "openai" } = await req.json();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Try the specified model first
    if (model === "grok") {
      const xaiApiKey = process.env.XAI_API_KEY;
      if (!xaiApiKey) {
        throw new Error("XAI_API_KEY is not configured");
      }

      const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${xaiApiKey}`,
        },
        body: JSON.stringify({
          model: "grok-2-latest",
          messages: [
            {
              role: "system",
              content: "You are a helpful blockchain AI assistant."
            },
            {
              role: "user",
              content: message
            }
          ],
          stream: false,
          temperature: 0
        }),
      });

      if (xaiResponse.ok) {
        const data = await xaiResponse.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return NextResponse.json({ response: reply });
        }
      } else {
        console.error("X.AI (GROK) API call failed:", await xaiResponse.text());
      }
    }

    // Fallback to OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      }),
    });

    if (openaiResponse.ok) {
      const data: OpenAIData = await openaiResponse.json();
      const reply = data.choices?.[0]?.message?.content;
      
      if (reply) {
        return NextResponse.json({ response: reply });
      }
      console.error("OpenAI response format unexpected");
    } else {
      console.error("OpenAI API call failed, falling back to BrianAI");
    }

    // Fallback to BrianAI API call
    const brianResponse = await fetch("https://api.brianai.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BRIAN_API_KEY}`,
      },
      body: JSON.stringify({ message }),
    });

    if (brianResponse.ok) {
      const data: BrianData = await brianResponse.json();
      if (data.reply) {
        return NextResponse.json({ response: data.reply });
      }
      console.error("BrianAI response format unexpected");
    }

    // If all APIs fail
    return NextResponse.json(
      { error: "All APIs failed to provide valid responses" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
