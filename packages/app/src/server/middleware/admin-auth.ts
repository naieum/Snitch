import { env } from "cloudflare:workers";

interface AccessJwtPayload {
  email: string;
  aud: string[];
  iss: string;
  sub: string;
  iat: number;
  exp: number;
}

export async function validateAdminAccess(
  request: Request
): Promise<{ email: string } | null> {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) return null;

  // Decode JWT payload (we trust CF Access has validated the signature)
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1])) as AccessJwtPayload;

    // Check expiration
    if (payload.exp < Date.now() / 1000) return null;

    // Check email against admin list
    const adminEmails = ((env as any).ADMIN_EMAILS as string || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(payload.email.toLowerCase())) return null;

    return { email: payload.email };
  } catch {
    return null;
  }
}
