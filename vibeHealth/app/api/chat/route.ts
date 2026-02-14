import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  try {
    const messages = await prisma.message.findMany({
      where: userId
        ? {
            OR: [{ senderId: userId }, { receiverId: userId }],
          }
        : {},
      include: { sender: true, receiver: true },
      orderBy: { createdAt: "desc" },
    });

    // VULN [Cat 20]: PHI (message content) logged
    console.log("Messages retrieved:", JSON.stringify(messages));
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, receiverId, content } = body;

    // VULN [Cat 20]: PHI logged
    console.log("New message:", { senderId, receiverId, content });

    const msg = await prisma.message.create({
      data: { senderId, receiverId, content },
    });

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
