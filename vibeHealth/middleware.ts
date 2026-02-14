import { NextResponse } from "next/server";

// VULN [Cat 4]: Empty middleware - no authentication enforcement
// All routes including /api/admin/* are accessible without auth
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/admin/:path*"],
};
