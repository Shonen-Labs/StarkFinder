import { NextRequest, NextResponse } from "next/server";
import { Chat } from "@prisma/client";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { walletAddress } = body;

        if (!walletAddress) {
            return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
        }

        // Fetch user and associated chats
        const user = await prisma.user.findUnique({
            where: { address: walletAddress },
            include: { chats: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Handle case where user exists but has no chats
        const chatIds = user.chats?.map((chat: Chat) => chat.id) || [];

        return NextResponse.json({ chatIds }, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching allowed chats:", error);
        if (error instanceof Error)
            return NextResponse.json({ error: error.message || error || "Internal Server Error" }, { status: 500 });
    }
}
