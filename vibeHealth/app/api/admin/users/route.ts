import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VULN [Cat 4]: No authentication or authorization check
// VULN [Cat 21]: No audit logging for admin actions
export async function GET() {
  try {
    // VULN [Cat 20]: Returns all user data including PHI
    const users = await prisma.user.findMany({
      include: {
        appointments: true,
        prescriptions: true,
        payments: true,
        symptomChecks: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // VULN [Cat 4]: No auth check - anyone can delete users
    // VULN [Cat 21]: No audit log of deletion
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
