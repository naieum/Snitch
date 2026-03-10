import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/plugin")({
  component: PluginPage,
  head: () => ({
    meta: [
      { title: "Snitch — Security Audit Plugin for AI Coding Tools" },
      {
        name: "description",
        content:
          "Security scanner that makes your AI prove every finding with real code. 45 categories. Zero false positives. Works with Claude Code, Cursor, Windsurf, Copilot, and 10+ more AI coding tools.",
      },
      { property: "og:title", content: "Snitch — Security Audit Plugin" },
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
          v6
        </p>

        {/* Beat 1: calm, factual */}
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
            marginBottom: "2.5rem",
          }}
        >
          Your AI writes the code. Snitch reads it. Checks for
          hardcoded secrets, broken auth, bad token lifetimes,
          compliance gaps, and 41 other categories of things that
          could go wrong.
        </p>

        {/* Beat 2: the hook — what makes it different */}
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: "2.5rem",
          }}
        >
          Every finding has to come with proof. The file, the line
          number, the actual code. If it can't point to the problem
          in your codebase, it doesn't make the report. No guessing,
          no "this might be an issue," no 500-item lists of things
          that aren't actually wrong.
        </p>

        {/* Pricing */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "1.25rem",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Base
              </p>
              <span style={{ fontSize: "15px", fontWeight: "bold", color: "var(--text-primary)" }}>
                $12.99/mo
              </span>
            </div>
            <ul
              style={{
                fontSize: "12px",
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                margin: 0,
                paddingLeft: "1.25rem",
              }}
            >
              <li>20 core security categories</li>
              <li>2,000 MCP calls/mo</li>
              <li>10 rulesets</li>
              <li>5 projects</li>
            </ul>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "1.25rem",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Pro
              </p>
              <span style={{ fontSize: "15px", fontWeight: "bold", color: "var(--text-primary)" }}>
                $19.99/mo
              </span>
            </div>
            <ul
              style={{
                fontSize: "12px",
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                margin: 0,
                paddingLeft: "1.25rem",
              }}
            >
              <li>35 categories (core + modern stack + performance)</li>
              <li>5,000 MCP calls/mo</li>
              <li>25 rulesets</li>
              <li>10 projects</li>
            </ul>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "1.25rem",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Enterprise
              </p>
              <span style={{ fontSize: "15px", fontWeight: "bold", color: "var(--text-primary)" }}>
                $79.99/mo
              </span>
            </div>
            <ul
              style={{
                fontSize: "12px",
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                margin: 0,
                paddingLeft: "1.25rem",
              }}
            >
              <li>All 45 categories</li>
              <li>Unlimited MCP calls, rulesets, and projects</li>
              <li>5 seats included</li>
            </ul>
          </div>

          <Link
            to="/login"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
              alignSelf: "flex-start",
            }}
            className="btn-secondary"
          >
            Get Started Free
          </Link>
        </div>

        {/* Beat 3: warming up — what it actually catches */}
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: "1rem",
          }}
        >
          It picks up on things you wouldn't think to check. Stripe
          webhooks that aren't verifying signatures. Login tokens
          that never expire. Logout buttons that clear the cookie
          but leave the session valid. Database passwords in the
          source code. User data with no way to delete it.
        </p>

        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: "2.5rem",
          }}
        >
          45 categories in total. Everything from SQL injection to
          HIPAA compliance to whether your npm packages have known
          vulnerabilities. It figures out your stack from{" "}
          <code style={{ color: "var(--text-primary)" }}>package.json</code>{" "}
          and only runs the checks that apply.
        </p>

        {/* Beat 4: building — the real stakes */}
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: "2.5rem",
          }}
        >
          This matters more now than it used to. When you wrote every
          line yourself, you had a feel for where the risks were. Now
          your AI writes most of it, and it's good code, but it
          learned from tutorials that hardcode{" "}
          <code style={{ color: "var(--text-primary)" }}>expiresIn: '1h'</code>{" "}
          and never think about it again. It copies auth patterns
          that worked in a demo but don't hold up in production.
          Nobody's being careless. The code just hasn't been read
          by something that knows what to worry about.
        </p>

        {/* Beat 5: the landing — confidence */}
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.7,
            color: "var(--text-primary)",
            marginBottom: "3rem",
            fontWeight: "bold",
          }}
        >
          Your AI builds it. Snitch reviews it. You ship it knowing
          what's in there.
        </p>

        {/* Platform list */}
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
            Claude Code, Gemini CLI, Codex CLI, Copilot CLI, Cursor, Windsurf,
            Cline, Kilo Code, Roo Code, Zed, GitHub Copilot (VS Code), Aider,
            Continue.dev, OpenCode, Antigravity
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
          <Link
            to="/dashboard"
            style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Dashboard
          </Link>
          <a
            href="https://snitch.live/pair"
            style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Pair Device
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
          snitch.live
        </p>
      </div>
    </div>
  );
}
