import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { patient: true, doctor: true },
    });
    return NextResponse.json({ appointments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// VULN [Cat 5]: SSRF - fetches arbitrary URL from user input
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, doctorId, date, notes, callbackUrl } = body;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        notes,
        callbackUrl,
      },
    });

    // VULN [Cat 5]: Server-side request forgery - fetching user-supplied URL
    if (callbackUrl) {
      try {
        await fetch(callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: appointment.id,
            status: "created",
          }),
        });
      } catch {
        console.warn("Callback URL fetch failed");
      }
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: unknown) {
    // VULN [Cat 12]: Full stack trace returned in error response
    return NextResponse.json(
      {
        error: "Failed to create appointment",
        stack: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
