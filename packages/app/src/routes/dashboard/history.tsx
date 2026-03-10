import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface ScanFinding {
  category: string;
  severity: string;
  file: string;
  line: number;
  description: string;
}

interface ScanRecord {
  id: string;
  projectName: string;
  scanType: string;
  source: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalFindings: number;
  findings: ScanFinding[];
  createdAt: string;
}

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

export const Route = createFileRoute("/dashboard/history")({
  component: HistoryDashboard,
});

function HistoryDashboard() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  useEffect(() => {
    fetch("/api/scans", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((result) => {
        if (result) setScans(result as ScanRecord[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredScans = scans.filter((scan) => {
    if (severityFilter === "all") return true;
    if (severityFilter === "critical") return scan.criticalCount > 0;
    if (severityFilter === "high") return scan.highCount > 0 || scan.criticalCount > 0;
    if (severityFilter === "medium")
      return scan.mediumCount > 0 || scan.highCount > 0 || scan.criticalCount > 0;
    return scan.totalFindings > 0;
  });

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading scan history...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Scan History
      </h1>
      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
        Past security scans and their findings.
      </p>

      {/* Severity filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map((level) => (
          <button
            key={level}
            onClick={() => setSeverityFilter(level)}
            className="rounded px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: severityFilter === level ? "var(--accent)" : "var(--surface)",
              color: severityFilter === level ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {/* Scan list */}
      <div className="mt-6 space-y-3">
        {filteredScans.map((scan) => (
          <div key={scan.id} className="surface rounded-lg">
            <button
              onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
              className="w-full p-4 text-left"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {scan.projectName}
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: "var(--surface)",
                      color: "var(--text-tertiary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {scan.scanType}
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: "var(--surface)",
                      color: "var(--text-tertiary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {scan.source}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(scan.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Severity counts */}
              <div className="mt-2 flex gap-3">
                {scan.criticalCount > 0 && (
                  <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>
                    {scan.criticalCount} Critical
                  </span>
                )}
                {scan.highCount > 0 && (
                  <span className="text-xs font-medium" style={{ color: "var(--warning)" }}>
                    {scan.highCount} High
                  </span>
                )}
                {scan.mediumCount > 0 && (
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {scan.mediumCount} Medium
                  </span>
                )}
                {scan.lowCount > 0 && (
                  <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                    {scan.lowCount} Low
                  </span>
                )}
                {scan.totalFindings === 0 && (
                  <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
                    No findings
                  </span>
                )}
              </div>
            </button>

            {/* Expanded findings */}
            {expandedId === scan.id && scan.findings.length > 0 && (
              <div
                className="border-t px-4 pb-4 pt-3"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                  Findings
                </p>
                <div className="space-y-2">
                  {scan.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="rounded p-3 text-xs"
                      style={{
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium"
                          style={{
                            color:
                              finding.severity === "critical"
                                ? "var(--danger)"
                                : finding.severity === "high"
                                  ? "var(--warning)"
                                  : "var(--text-secondary)",
                          }}
                        >
                          [{finding.severity.toUpperCase()}]
                        </span>
                        <span style={{ color: "var(--text-primary)" }}>{finding.category}</span>
                      </div>
                      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                        {finding.file}:{finding.line} &mdash; {finding.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expandedId === scan.id && scan.findings.length === 0 && (
              <div
                className="border-t px-4 pb-4 pt-3 text-center"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  No detailed findings stored for this scan.
                </p>
              </div>
            )}
          </div>
        ))}

        {filteredScans.length === 0 && (
          <div className="surface rounded-lg p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {scans.length === 0
                ? "No scans recorded yet. Run a security audit to see results here."
                : "No scans match the selected filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
