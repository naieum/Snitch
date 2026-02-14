import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";

// VULN [Cat 19]: No phone number validation, no rate limiting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message } = body;

    // VULN [Cat 19]: No phone number format validation
    // VULN [Cat 19]: No webhook signature verification for incoming SMS
    const result = await sendSMS(to, message);

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
