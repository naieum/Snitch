import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import prisma from "@/lib/prisma";

// VULN [Cat 15]: No rate limiting, no max_tokens limit, prompt injection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, symptoms } = body;

    let aiResponse =
      "AI service unavailable - please consult your doctor directly.";

    try {
      const openai = getOpenAI();
      // VULN [Cat 15]: User input injected directly into prompt without sanitization
      // VULN [Cat 15]: No max_tokens limit - potential cost attack
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a medical symptom analyzer. Provide preliminary assessments.",
          },
          {
            role: "user",
            content: `Patient reports the following symptoms: ${symptoms}`,
          },
        ],
        // No max_tokens set
      });
      aiResponse = completion.choices[0]?.message?.content || aiResponse;
    } catch {
      console.warn("OpenAI unavailable - returning fallback response");
    }

    if (userId) {
      await prisma.symptomCheck.create({
        data: { userId, symptoms, aiResponse },
      });
    }

    return NextResponse.json({ assessment: aiResponse });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
