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
          compliance gaps, and 34 other categories of things that
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

        {/* Install */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
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
            marginBottom: "1.25rem",
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

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "1rem 1.25rem",
            marginBottom: "2.5rem",
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
            Then run it
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
          39 categories in total. Everything from SQL injection to
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
