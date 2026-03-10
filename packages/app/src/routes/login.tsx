import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useClientSession } from "~/hooks/use-client-session";
import { signIn } from "~/server/lib/auth-client";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { data: session } = useClientSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint =
        mode === "signup"
          ? "/api/auth/sign-up/email"
          : "/api/auth/sign-in/email";

      const body =
        mode === "signup"
          ? { email, password, name }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? `${mode === "signup" ? "Sign up" : "Sign in"} failed`);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: "github" | "google") {
    await signIn.social({ provider, callbackURL: "/dashboard" });
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1
          className="mb-8 text-center text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => handleSocial("github")}
            className="btn-secondary flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            GitHub
          </button>
          <button
            onClick={() => handleSocial("google")}
            className="btn-secondary flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Google
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div
            className="h-px flex-1"
            style={{ backgroundColor: "var(--border)" }}
          />
          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            OR
          </span>
          <div
            className="h-px flex-1"
            style={{ backgroundColor: "var(--border)" }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full rounded-lg px-4 py-2.5 text-sm"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full rounded-lg px-4 py-2.5 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full rounded-lg px-4 py-2.5 text-sm"
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="link"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="link"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
