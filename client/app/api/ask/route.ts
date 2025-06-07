import { NextRequest, NextResponse } from "next/server";

interface OpenAIData {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface DeepSeekData {
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
    const { message, preferredProvider = "deepseek" } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Try the preferred provider first
    if (preferredProvider === "deepseek" && process.env.DEEPSEEK_API_KEY) {
      try {
        const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: message }],
          }),
        });

        if (deepseekResponse.ok) {
          const data: DeepSeekData = await deepseekResponse.json();
          const reply = data.choices?.[0]?.message?.content;
          
          if (reply) {
            return NextResponse.json({ 
              response: reply,
              provider: "deepseek" 
            });
          }
          console.error("DeepSeek response format unexpected");
        }
      } catch (deepseekError) {
        console.error("DeepSeek API error:", deepseekError);
      }
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
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
            return NextResponse.json({ 
              response: reply,
              provider: "openai" 
            });
          }
          console.error("OpenAI response format unexpected");
        }
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
      }
    }

    // Final fallback to BrianAI
    if (process.env.BRIAN_API_KEY) {
      try {
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
            return NextResponse.json({ 
              response: data.reply,
              provider: "brian" 
            });
          }
          console.error("BrianAI response format unexpected");
        }
      } catch (brianError) {
        console.error("BrianAI API error:", brianError);
      }
    }

    // If all APIs fail
    return NextResponse.json(
      { error: "All available APIs failed to provide valid responses" },
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