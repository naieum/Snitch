import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useClientSession } from "~/hooks/use-client-session";

export const Route = createFileRoute("/pair")({
  component: PairPage,
  head: () => ({
    meta: [
      { title: "Pair Device — Snitch" },
      {
        name: "description",
        content: "Connect your MCP client to your Snitch account",
      },
    ],
  }),
});

function PairPage() {
  const { data: session, loading: sessionLoading } = useClientSession();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handlePair(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/device/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_code: code.trim() }),
      });

      const data = (await res.json()) as { error?: string };

      if (res.ok) {
        setStatus("success");
        setMessage("Your terminal is now connected to Snitch.");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Pairing failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (sessionLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-base)",
          color: "var(--text-tertiary)",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)",
        }}
      >
        <h1 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "1rem" }}>
          Sign in to pair your device
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "2rem" }}>
          You need to be logged in to connect your MCP client.
        </p>
        <a
          href="/login"
          className="btn-primary"
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ maxWidth: "400px", width: "100%" }}>
        <h1 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Pair your device
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Enter the code shown in your terminal to connect your MCP client.
        </p>

        {status === "success" ? (
          <div
            style={{
              border: "1px solid var(--success)",
              borderRadius: "6px",
              padding: "1.5rem",
              backgroundColor: "var(--bg-surface)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "13px", color: "var(--success)", fontWeight: "bold" }}>
              {message}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
              You can close this page and return to your terminal.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePair}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
              maxLength={9}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                fontSize: "20px",
                fontWeight: "bold",
                textAlign: "center",
                letterSpacing: "0.15em",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                outline: "none",
              }}
              autoFocus
            />

            {status === "error" && (
              <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "0.75rem" }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading" || code.length < 9}
              className="btn-primary"
              style={{
                width: "100%",
                marginTop: "1rem",
                padding: "0.625rem",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: status === "loading" ? "wait" : "pointer",
                opacity: status === "loading" || code.length < 9 ? 0.6 : 1,
              }}
            >
              {status === "loading" ? "Pairing..." : "Pair Device"}
            </button>
          </form>
        )}

        <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2rem" }}>
          Signed in as {session.user.email}
        </p>
      </div>
    </div>
  );
}
