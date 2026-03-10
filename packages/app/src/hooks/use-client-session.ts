import { useState, useEffect } from "react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface SessionData {
  user: SessionUser;
  session: { id: string; expiresAt: string };
}

/**
 * Client-only session hook. Returns null during SSR to avoid
 * self-request deadlock in Cloudflare Workers.
 */
export function useClientSession() {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/get-session", { credentials: "include" })
      .then((r) => r.json())
      .then((d: any) => {
        if (!cancelled) {
          setData(d && d.user ? (d as SessionData) : null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}
