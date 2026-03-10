import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface UsageInfo {
  tier: string;
  actions: { action: string; count: number; limit: number }[];
  skillPurchased: boolean;
  skillVersion: string | null;
  downloads: number;
}

export const Route = createFileRoute("/dashboard/usage")({
  component: UsageDashboard,
});

function UsageDashboard() {
  const [data, setData] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((result) => {
        if (result) setData(result as UsageInfo);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading usage data...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Unable to load usage data.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Usage
      </h1>
      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
        Your current usage this billing period.
      </p>

      {/* Tier + Skill badges */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="surface rounded-lg px-4 py-3">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Plan
          </p>
          <p className="mt-0.5 text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
            {data.tier}
          </p>
        </div>
        <div className="surface rounded-lg px-4 py-3">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Snitch Skill
          </p>
          <p
            className="mt-0.5 text-sm font-semibold"
            style={{ color: data.skillPurchased ? "var(--success)" : "var(--text-tertiary)" }}
          >
            {data.skillPurchased ? `v${data.skillVersion}` : "Not owned"}
          </p>
        </div>
      </div>

      {/* Usage bars */}
      <div className="mt-8 space-y-4">
        {data.actions.map((a) => (
          <div key={a.action} className="surface rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>{formatAction(a.action)}</span>
              <span style={{ color: "var(--text-primary)" }}>
                {a.count.toLocaleString()} / {a.limit === -1 ? "unlimited" : a.limit.toLocaleString()}
              </span>
            </div>
            {a.limit !== -1 && (
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (a.count / a.limit) * 100)}%`,
                    backgroundColor:
                      a.count / a.limit > 0.9
                        ? "var(--danger)"
                        : a.count / a.limit > 0.7
                          ? "var(--warning)"
                          : "var(--accent)",
                  }}
                />
              </div>
            )}
          </div>
        ))}
        {data.actions.length === 0 && (
          <div className="surface rounded-lg p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No usage data this period.
            </p>
          </div>
        )}
      </div>

      {/* Upgrade CTA for free users */}
      {data.tier === "free" && (
        <div className="surface mt-8 rounded-lg p-6 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Running low on limits?
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            Upgrade to Base for 2,000 MCP calls/month, or Pro for 5,000.
          </p>
          <a
            href="/dashboard/billing"
            className="btn-primary mt-4 inline-block rounded px-5 py-2 text-xs font-medium"
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    rulesets: "Rulesets",
    rules: "Rules",
    projects: "Projects",
    searches: "Searches",
    mcp_calls: "MCP Calls",
    skill_download: "Skill Downloads",
    skill_purchase: "Skill Purchases",
  };
  return labels[action] ?? action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
