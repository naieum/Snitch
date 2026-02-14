import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VULN [Cat 13]: No constructEvent signature verification on Stripe webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // VULN [Cat 13]: Webhook payload accepted without signature verification
    // Anyone can send fake webhook events
    const event = body;

    // VULN [Cat 22]: Raw payment data logged
    console.log("Webhook received:", JSON.stringify(event));

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data?.object;

      await prisma.payment.updateMany({
        where: { stripeId: paymentIntent?.id },
        data: { status: "completed" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
