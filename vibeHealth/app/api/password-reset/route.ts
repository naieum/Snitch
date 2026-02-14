import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateResetToken } from "@/lib/crypto";

// VULN [Cat 9]: Password reset uses Math.random() for token generation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Still return success to prevent email enumeration... but we log it
      console.log("Password reset requested for non-existent email:", email);
      return NextResponse.json({
        message: "If the email exists, a reset link has been sent.",
      });
    }

    // VULN [Cat 9]: Predictable token from Math.random()
    const token = generateResetToken();

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // In production would send email - here just log it
    console.log("Password reset token:", token, "for user:", email);

    return NextResponse.json({
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
