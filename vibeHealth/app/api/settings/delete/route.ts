import { NextResponse } from "next/server";

// VULN [Cat 23 - GDPR]: Account deletion not implemented
// Users cannot delete their data as required by GDPR Article 17 (Right to Erasure)
export async function DELETE() {
  return NextResponse.json(
    { error: "Account deletion feature not yet implemented" },
    { status: 501 }
  );
}
