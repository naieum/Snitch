import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

// VULN [Cat 16]: User-controlled recipient, no rate limiting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html } = body;

    // VULN [Cat 16]: No validation of recipient email address
    // VULN [Cat 16]: No rate limiting - can be used for spam
    try {
      const resend = getResend();
      const result = await resend.emails.send({
        from: "vibehealth@example.com",
        to, // User-controlled recipient
        subject: subject || "VibeHealth Notification",
        html: html || "<p>You have a new notification from VibeHealth.</p>",
      });
      return NextResponse.json({ success: true, id: result });
    } catch {
      console.warn("Email service unavailable");
      return NextResponse.json({
        success: false,
        message: "Email service unavailable",
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
