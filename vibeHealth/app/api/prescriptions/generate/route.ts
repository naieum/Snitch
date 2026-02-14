import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VULN [Cat 10]: Command injection via unsanitized filename
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prescriptionId, filename } = body;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { patient: true },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // VULN [Cat 10]: User-supplied filename concatenated into shell command
    const { exec } = await import("child_process");
    const outputPath = `/tmp/${filename || "prescription"}.pdf`;

    exec(
      `echo "${prescription.medication} - ${prescription.dosage}" > ${outputPath}`,
      (error) => {
        if (error) {
          console.error("PDF generation failed:", error);
        }
      }
    );

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { filename: outputPath },
    });

    return NextResponse.json({
      message: "Prescription generated",
      path: outputPath,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
