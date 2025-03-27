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
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Attempt OpenAI API call
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

    // If both APIs fail
    return NextResponse.json(
      { error: "Both APIs failed to provide valid responses" },
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
