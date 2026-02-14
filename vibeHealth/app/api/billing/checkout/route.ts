import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// VULN [Cat 22]: Accepts raw card data server-side instead of using Stripe Elements
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, amount, cardNumber, cvv, cardExpiry, description } = body;

    // VULN [Cat 22]: Storing full PAN and CVV in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: Math.round(amount * 100),
        cardNumber, // VULN: Full card number stored
        cvv, // VULN: CVV stored (never allowed by PCI-DSS)
        cardExpiry,
        description,
        status: "pending",
      },
    });

    // VULN [Cat 22]: Card data logged
    console.log("Payment created:", {
      paymentId: payment.id,
      cardNumber,
      amount,
    });

    // Try to process with Stripe
    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        description,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripeId: paymentIntent.id, status: "completed" },
      });

      return NextResponse.json({
        payment: { id: payment.id, status: "completed" },
      });
    } catch {
      // Stripe unavailable - still return success since we stored the payment
      return NextResponse.json({
        payment: { id: payment.id, status: "pending" },
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
