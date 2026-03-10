import { createFileRoute } from "@tanstack/react-router";
import { useClientSession } from "~/hooks/use-client-session";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: session } = useClientSession();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerateToken() {
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: "MCP Token" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { token: string };
        setNewToken(data.token);
      }
    } finally {
      setGeneratingToken(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE", credentials: "include" });
      if (res.ok) {
        window.location.href = "/";
      }
    } finally {
      setDeleting(false);
    }
  }

  const mcpConfig = newToken
    ? `{
  "mcpServers": {
    "snitchmcp": {
      "type": "url",
      "url": "https://mcp.snitch.live/sse",
      "headers": {
        "Authorization": "Bearer ${newToken}"
      }
    }
  }
}`
    : null;

  return (
    <div>
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        Settings
      </h1>
      <p
        className="mt-1 mb-8"
        style={{ color: "var(--text-secondary)" }}
      >
        Account and configuration.
      </p>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="surface rounded-lg p-6">
          <h2
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Profile
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Name</span>
              <span style={{ color: "var(--text-primary)" }}>
                {session?.user?.name ?? "--"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Email</span>
              <span style={{ color: "var(--text-primary)" }}>
                {session?.user?.email ?? "--"}
              </span>
            </div>
          </div>
        </div>

        {/* MCP Server Setup */}
        <div className="surface rounded-lg p-6">
          <h2
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            MCP Server
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Connect your AI tools to the Snitch MCP server for security rules,
            pattern checking, and semantic search across 45 audit categories.
          </p>

          {/* Step 1: Generate token */}
          <div className="mt-5">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              1. Generate a token
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              This token authenticates your MCP connection. It is shown once — copy it now.
            </p>
            {newToken ? (
              <div className="mt-3">
                <div
                  className="flex items-center gap-2 rounded p-3"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  <code
                    className="flex-1 text-xs break-all"
                    style={{ color: "var(--success-text)" }}
                  >
                    {newToken}
                  </code>
                  <button
                    onClick={() => handleCopy(newToken)}
                    className="shrink-0 rounded px-2 py-1 text-xs transition-colors"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--warning-text)" }}
                >
                  Save this token — you won't be able to see it again.
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerateToken}
                disabled={generatingToken}
                className="btn-primary mt-3 rounded-lg px-4 py-2 text-sm font-medium"
              >
                {generatingToken ? "Generating..." : "Generate Token"}
              </button>
            )}
          </div>

          {/* Step 2: Add to Claude Code */}
          <div className="mt-5">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              2. Add to your AI tool
            </p>

            {/* Claude Code */}
            <p
              className="mt-3 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Claude Code
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Add this to{" "}
              <code
                className="rounded px-1 py-0.5 text-xs"
                style={{ backgroundColor: "var(--bg-input)" }}
              >
                ~/.claude/settings.json
              </code>
              :
            </p>
            <div className="relative mt-2">
              <pre
                className="rounded p-3 text-xs overflow-x-auto"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-secondary)",
                }}
              >
                {mcpConfig ??
                  `{
  "mcpServers": {
    "snitchmcp": {
      "type": "url",
      "url": "https://mcp.snitch.live/sse",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}`}
              </pre>
              {mcpConfig && (
                <button
                  onClick={() => handleCopy(mcpConfig)}
                  className="absolute top-2 right-2 rounded px-2 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: "var(--bg-raised)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            {/* Cursor / Windsurf / Other */}
            <p
              className="mt-4 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Cursor / Windsurf / Other MCP Clients
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Use the SSE endpoint with your token:
            </p>
            <div className="mt-2">
              <pre
                className="rounded p-3 text-xs overflow-x-auto"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-secondary)",
                }}
              >
{`Server URL: https://mcp.snitch.live/sse
Header:     Authorization: Bearer ${newToken ?? "YOUR_TOKEN"}`}
              </pre>
            </div>
          </div>

          {/* Step 3: Verify */}
          <div className="mt-5">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              3. Verify
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Ask your AI tool to list MCP tools. You should see{" "}
              <code
                className="rounded px-1 py-0.5 text-xs"
                style={{ backgroundColor: "var(--bg-input)" }}
              >
                get-rules
              </code>
              ,{" "}
              <code
                className="rounded px-1 py-0.5 text-xs"
                style={{ backgroundColor: "var(--bg-input)" }}
              >
                search-rules
              </code>
              , and{" "}
              <code
                className="rounded px-1 py-0.5 text-xs"
                style={{ backgroundColor: "var(--bg-input)" }}
              >
                check-pattern
              </code>
              .
            </p>
          </div>
        </div>

        {/* Skill (manual install) */}
        <div className="surface rounded-lg p-6">
          <h2
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Skill File
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            The Snitch skill is a set of markdown files that teach your AI tool
            how to run security audits. Install it as custom instructions for
            tools that don't support MCP.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Claude Code
              </span>
              <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                Place the skill files in{" "}
                <code
                  className="rounded px-1 py-0.5 text-xs"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  ~/.claude/commands/snitch/
                </code>
              </p>
            </div>
            <div>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Cursor
              </span>
              <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                Place the skill files in{" "}
                <code
                  className="rounded px-1 py-0.5 text-xs"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  .cursor/rules/snitch/
                </code>{" "}
                in your project root.
              </p>
            </div>
            <div>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Windsurf
              </span>
              <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                Place the skill files in{" "}
                <code
                  className="rounded px-1 py-0.5 text-xs"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  .windsurf/rules/snitch/
                </code>{" "}
                in your project root.
              </p>
            </div>
            <div>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Gemini CLI
              </span>
              <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                Place the skill files in{" "}
                <code
                  className="rounded px-1 py-0.5 text-xs"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  ~/.gemini/extensions/snitch/
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="rounded-lg border p-6"
          style={{
            borderColor: "var(--danger-border)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <h2
            className="font-semibold"
            style={{ color: "var(--danger-text)" }}
          >
            Danger Zone
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          {showDeleteConfirm ? (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="btn-danger rounded-lg px-4 py-2 text-sm font-medium"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 rounded-lg border px-4 py-2 text-sm transition-colors"
              style={{
                borderColor: "var(--danger-border)",
                color: "var(--danger-text)",
              }}
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
