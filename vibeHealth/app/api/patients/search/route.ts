import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VULN [Cat 1]: SQL injection via string concatenation in raw query
// VULN [Cat 12]: Full patient objects logged to console
// VULN [Cat 20]: PHI returned without access controls
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  try {
    // VULN [Cat 1]: Direct string concatenation in SQL query
    const patients = await prisma.$queryRawUnsafe(
      `SELECT * FROM User WHERE name LIKE '%${query}%' OR email LIKE '%${query}%' OR mrn LIKE '%${query}%'`
    );

    // VULN [Cat 12/20]: Logging full patient records including PHI
    console.log("Patient search results:", JSON.stringify(patients));

    return NextResponse.json({ patients });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // VULN [Cat 12]: Stack trace in error response
    return NextResponse.json(
      {
        error: "Search failed",
        details: message,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
