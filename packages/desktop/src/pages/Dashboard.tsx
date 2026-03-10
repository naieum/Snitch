import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { detectTools, type LicenseInfo, type ToolInfo } from "../lib/tauri";

interface DashboardProps {
  license: LicenseInfo | null;
}

export function Dashboard({ license }: DashboardProps) {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectTools([])
      .then(setTools)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const detectedCount = tools.filter((t) => t.detected).length;
  const loadedCount = tools.filter((t) => t.snitch_loaded).length;

  const statusColor =
    license?.status === "active" ? "var(--success)" : "var(--warning)";
  const statusBg =
    license?.status === "active"
      ? "var(--success-surface)"
      : "var(--warning-surface)";

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Dashboard
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {license?.machine_label || "Unknown machine"}
          </p>
        </div>
        {license && (
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: statusBg, color: statusColor }}
          >
            {license.status} &mdash; {license.tier}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg mb-6" style={{ backgroundColor: "var(--danger-surface)", border: "1px solid var(--danger-border)" }}>
          <p className="text-sm" style={{ color: "var(--danger-text)" }}>Failed to detect tools: {error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Tools Detected", value: loading ? "..." : detectedCount },
          { label: "Snitch Loaded", value: loading ? "..." : loadedCount },
          {
            label: "Activations",
            value: license
              ? `${license.activations_used} / ${license.activations_max}`
              : "\u2014",
          },
        ].map((stat) => (
          <div key={stat.label} className="surface rounded-lg p-4">
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {stat.value}
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2
        className="text-sm font-medium mb-3"
        style={{ color: "var(--text-secondary)" }}
      >
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/tools"
          className="surface rounded-lg p-6 hover:border-[var(--border-hover)] transition-colors cursor-pointer block"
        >
          <div
            className="text-lg mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Manage Tools
          </div>
          <p
            className="text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Load or unload Snitch across your AI coding tools
          </p>
        </Link>
        <Link
          to="/scan"
          className="surface rounded-lg p-6 hover:border-[var(--border-hover)] transition-colors cursor-pointer block"
        >
          <div
            className="text-lg mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Launch Scan
          </div>
          <p
            className="text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Trigger a security audit using an installed tool
          </p>
        </Link>
      </div>

      {/* Account info */}
      {license?.email && (
        <div className="mt-8 surface rounded-lg p-4">
          <div
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Signed in as
          </div>
          <div
            className="text-sm mt-1"
            style={{ color: "var(--text-primary)" }}
          >
            {license.email}
          </div>
        </div>
      )}
    </div>
  );
}
