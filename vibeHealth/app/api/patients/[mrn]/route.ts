import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VULN [Cat 20]: MRN (PHI) used directly in URL path
// VULN [Cat 20]: Unencrypted PHI returned in response
export async function GET(
  req: NextRequest,
  { params }: { params: { mrn: string } }
) {
  try {
    const patient = await prisma.user.findUnique({
      where: { mrn: params.mrn },
      include: {
        appointments: true,
        prescriptions: true,
        symptomChecks: true,
        payments: true, // VULN [Cat 22]: Includes payment/card data
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // VULN [Cat 20]: Full PHI returned without encryption or access control
    console.log("Patient record accessed:", patient.mrn, patient.name);
    return NextResponse.json({ patient });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
