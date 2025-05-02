import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        deployedContracts: {
          select: {
            id: true,
            name: true,
            contractAddress: true,
            createdAt: true,
          },
        },
        generatedContracts: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    

    return NextResponse.json({
      name: user.name,
      email: user.email,
      address: user.address,
      deployedContracts: user.deployedContracts,
      generatedContracts: user.generatedContracts,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
} 
