import { NextResponse } from "next/server";

// VULN [Cat 23 - GDPR]: Data export not implemented
// Users cannot export their personal data as required by GDPR Article 20
export async function GET() {
  return NextResponse.json(
    { error: "Data export feature not yet implemented" },
    { status: 501 }
  );
}
