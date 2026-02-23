import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/plugin")({
  component: PluginPage,
  head: () => ({
    meta: [
      { title: "Snitch — Security Audit Plugin for AI Coding Tools" },
      {
        name: "description",
        content:
          "Open source security scanner that makes your AI prove every finding with real code. 39 categories. Zero false positives. Works with Claude Code, Gemini CLI, Codex, Cursor, and more.",
      },
      { property: "og:title", content: "Snitch v2 — Security Audit Plugin" },
      {
        property: "og:description",
        content:
          "Your AI wrote the code. Snitch makes sure it's not leaking passwords.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://snitch.live/plugin" },
    ],
  }),
});

function PluginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ maxWidth: "540px", width: "100%" }}>
        {/* Logo */}
        <pre
          style={{
            fontSize: "11px",
            lineHeight: 1.2,
            color: "var(--text-tertiary)",
            marginBottom: "0.25rem",
            letterSpacing: "0.02em",
          }}
        >
{`   _____ _   ____________________  __
  / ___// | / /  _/_  __/ ____/ / / /
  \\__ \\/  |/ // /  / / / /   / /_/ /
 ___/ / /|  // /  / / / /___/ __  /
/____/_/ |_/___/ /_/  \\____/_/ /_/`}
        </pre>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-tertiary)",
            marginBottom: "3rem",
            paddingLeft: "33px",
            letterSpacing: "0.15em",
          }}
        >
          v2
        </p>

        {/* What it is */}
        <h1
          style={{
            fontSize: "15px",
            fontWeight: "bold",
            marginBottom: "1rem",
            color: "var(--text-primary)",
          }}
        >
          Security audit plugin for AI coding tools.
        </h1>

        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: "2rem",
          }}
        >
          Your AI wrote the code. Snitch reads it and finds the
          security problems — hardcoded secrets, broken auth, missing
          rate limits, bad token lifetimes, compliance gaps, and 34
          other categories. Every finding includes the file, the line,
          and the actual code. If it can't prove it, it doesn't report it.
        </p>

        {/* Install */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Install — Claude Code
          </p>
          <code
            style={{
              display: "block",
              fontSize: "13px",
              color: "var(--text-primary)",
              lineHeight: 1.7,
            }}
          >
            /plugin marketplace add naieum/Snitch
            <br />
            /plugin install snitch@naieum-Snitch
          </code>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Install — Gemini CLI
          </p>
          <code
            style={{
              display: "block",
              fontSize: "13px",
              color: "var(--text-primary)",
              lineHeight: 1.7,
            }}
          >
            gemini extensions install https://github.com/naieum/Snitch.git
          </code>
        </div>

        {/* Run */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Run
          </p>
          <code
            style={{
              fontSize: "13px",
              color: "var(--text-primary)",
            }}
          >
            /snitch
          </code>
        </div>

        {/* What it checks */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            39 categories
          </p>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
            }}
          >
            SQL injection, XSS, hardcoded secrets, auth issues, SSRF,
            rate limiting, CORS, crypto, dangerous patterns, cloud
            security, data leaks, Stripe, auth providers, AI APIs,
            email, database, Redis, SMS, token lifetimes, HIPAA, SOC 2,
            PCI-DSS, GDPR, memory leaks, N+1 queries, performance,
            dependencies, authorization, file uploads, input
            validation, CI/CD, security headers, unused packages, FIPS,
            governance certs, disaster recovery, monitoring, and data
            lifecycle.
          </p>
        </div>

        {/* Works with */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Works with
          </p>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
            }}
          >
            Claude Code, Gemini CLI, Codex CLI, OpenCode, Antigravity, Cursor
          </p>
        </div>

        {/* Links */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            fontSize: "13px",
          }}
        >
          <a
            href="https://github.com/naieum/Snitch"
            style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            GitHub
          </a>
          <a
            href="https://github.com/naieum/Snitch/blob/main/LICENSE"
            style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            MIT License
          </a>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-tertiary)",
            marginTop: "4rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          Open source. Free forever.
        </p>
      </div>
    </div>
  );
}
