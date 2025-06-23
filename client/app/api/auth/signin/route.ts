/* eslint-disable @typescript-eslint/no-explicit-any */

import { signIn } from "@/auth"; // Import from your auth config
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Use Auth.js signIn function
    await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    // signIn with redirect: false returns undefined on success
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Sign in error:", error);
    
    // Handle Auth.js errors
    if (error.type === "CredentialsSignin") {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
