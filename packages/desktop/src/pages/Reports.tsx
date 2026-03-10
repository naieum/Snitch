import { useState, useEffect } from "react";

/* ── Types ──────────────────────────────────────────────────────── */

interface Finding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  file: string;
  line: number;
  description: string;
  fix: string;
  fixed: boolean;
}

/* ── Severity Helpers ───────────────────────────────────────────── */

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function severityColor(severity: Finding["severity"]) {
  switch (severity) {
    case "critical":
      return { bg: "var(--danger-surface)", text: "var(--danger-text)", border: "var(--danger-border)" };
    case "high":
      return { bg: "var(--warning-surface)", text: "var(--warning-text)", border: "rgba(234,179,8,0.3)" };
    case "medium":
      return { bg: "var(--info-surface)", text: "var(--info-text)", border: "rgba(59,130,246,0.3)" };
    case "low":
      return { bg: "var(--bg-surface)", text: "var(--text-secondary)", border: "var(--border)" };
  }
}

/* ── Finding Card ──────────────────────────────────────────────── */

function FindingCard({
  finding,
  expanded,
  onToggle,
}: {
  finding: Finding;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = severityColor(finding.severity);

  return (
    <div
      className="finding-card"
      style={{
        borderColor: finding.fixed ? "var(--success)" : colors.border,
        opacity: finding.fixed ? 0.5 : 1,
      }}
    >
      <button className="finding-header" onClick={onToggle}>
        <div className="finding-header-left">
          <span
            className="finding-severity"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {finding.severity}
          </span>
          <span className="finding-category">{finding.category}</span>
          <span
            className="finding-title"
            style={{
              textDecoration: finding.fixed ? "line-through" : "none",
            }}
          >
            {finding.title}
          </span>
        </div>
        <span className="finding-chevron">
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      <div
        className="finding-body"
        style={{
          maxHeight: expanded ? "300px" : "0",
          opacity: expanded ? 1 : 0,
          padding: expanded ? "0.75rem" : "0 0.75rem",
        }}
      >
        <div className="finding-location">
          {finding.file}:{finding.line}
        </div>
        <p className="finding-description">{finding.description}</p>
        <div className="finding-fix-block">
          <span className="finding-fix-label">Fix:</span>
          <span className="finding-fix-text">{finding.fix}</span>
        </div>
        {finding.fixed && (
          <span className="finding-resolved">Resolved</span>
        )}
      </div>
    </div>
  );
}

/* ── Reports Page ──────────────────────────────────────────────── */

interface ReportsProps {
  projectPath: string;
}

export function Reports({ projectPath }: ReportsProps) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasFolder = projectPath !== "." && projectPath.trim() !== "";

  // Load findings from localStorage when project changes
  useEffect(() => {
    if (!hasFolder) {
      setFindings([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`snitch:findings:${projectPath}`);
      if (stored) {
        setFindings(JSON.parse(stored));
      } else {
        setFindings([]);
      }
    } catch {
      setFindings([]);
    }
  }, [projectPath, hasFolder]);

  // Findings grouped by severity
  const sortedFindings = [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
  const criticalCount = findings.filter((f) => f.severity === "critical" && !f.fixed).length;
  const highCount = findings.filter((f) => f.severity === "high" && !f.fixed).length;
  const mediumCount = findings.filter((f) => f.severity === "medium" && !f.fixed).length;
  const lowCount = findings.filter((f) => f.severity === "low" && !f.fixed).length;
  const fixedCount = findings.filter((f) => f.fixed).length;

  if (!hasFolder) {
    return (
      <div className="reports-layout">
        <div className="reports-empty-state">
          <div className="reports-empty-icon">&#9432;</div>
          <div className="reports-empty-title">No project selected</div>
          <div className="reports-empty-subtitle">
            Select a project folder to view scan findings.
          </div>
        </div>
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="reports-layout">
        <div className="reports-empty-state">
          <div className="reports-empty-icon">&#9745;</div>
          <div className="reports-empty-title">No findings yet</div>
          <div className="reports-empty-subtitle">
            Run a scan to generate a security report.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-layout">
      {/* Summary Bar */}
      <div className="findings-summary">
        {criticalCount > 0 && (
          <span className="findings-summary-item" style={{ color: "var(--danger-text)" }}>
            {criticalCount} critical
          </span>
        )}
        {highCount > 0 && (
          <span className="findings-summary-item" style={{ color: "var(--warning-text)" }}>
            {highCount} high
          </span>
        )}
        {mediumCount > 0 && (
          <span className="findings-summary-item" style={{ color: "var(--info-text)" }}>
            {mediumCount} medium
          </span>
        )}
        {lowCount > 0 && (
          <span className="findings-summary-item" style={{ color: "var(--text-secondary)" }}>
            {lowCount} low
          </span>
        )}
        {fixedCount > 0 && (
          <span className="findings-summary-item" style={{ color: "var(--success-text)" }}>
            {fixedCount} fixed
          </span>
        )}
      </div>

      {/* Finding Cards */}
      <div className="findings-list">
        {sortedFindings.map((f) => (
          <FindingCard
            key={f.id}
            finding={f}
            expanded={expandedId === f.id}
            onToggle={() =>
              setExpandedId(expandedId === f.id ? null : f.id)
            }
          />
        ))}
      </div>
    </div>
  );
}
