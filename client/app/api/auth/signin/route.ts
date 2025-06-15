import { signIn } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
