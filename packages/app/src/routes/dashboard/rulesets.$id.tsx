import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface Rule {
  id: string;
  rulesetId: string | null;
  title: string;
  description: string | null;
  severity: string | null;
  language: string | null;
  framework: string | null;
  filePattern: string | null;
  pattern: string | null;
  goodExample: string | null;
  badExample: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RulesetDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isPublic: number | null;
  ownerId: string | null;
}

export const Route = createFileRoute("/dashboard/rulesets/$id")({
  component: RulesetDetailPage,
});

const emptyRule = {
  title: "",
  description: "",
  severity: "warning",
  language: "",
  framework: "",
  filePattern: "",
  pattern: "",
  goodExample: "",
  badExample: "",
};

function RulesetDetailPage() {
  const { id } = useParams({ from: "/dashboard/rulesets/$id" });
  const [ruleset, setRuleset] = useState<RulesetDetail | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyRule);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/rulesets/${id}`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/rulesets/${id}/rules`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([rulesetData, rulesData]: [any, any]) => {
        setRuleset(rulesetData as RulesetDetail | null);
        setRules(Array.isArray(rulesData) ? (rulesData as Rule[]) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const isSystem = ruleset && !ruleset.ownerId;

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading ruleset...
      </div>
    );
  }

  if (!ruleset) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Ruleset not found.
      </div>
    );
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/rulesets/${ruleset!.id}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = (await res.json()) as Rule;
        setRules((prev) => [...prev, data]);
        setForm(emptyRule);
        setShowAdd(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!confirm("Delete this rule?")) return;
    const res = await fetch(`/api/rules/${ruleId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    }
  }

  async function handleToggleVisibility() {
    await fetch(`/api/rulesets/${ruleset!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isPublic: ruleset!.isPublic ? 0 : 1 }),
    });
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-1">
        <Link
          to="/dashboard/rulesets"
          className="text-sm transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          &larr; Back to rulesets
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {ruleset.name}
            </h1>
            {isSystem && (
              <span
                className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--info-surface)",
                  color: "var(--info-text)",
                }}
              >
                System
              </span>
            )}
          </div>
          {ruleset.description && (
            <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
              {ruleset.description}
            </p>
          )}
          <div
            className="mt-2 flex items-center gap-3 text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            {ruleset.category && (
              <span className="badge rounded px-2 py-0.5">
                {ruleset.category}
              </span>
            )}
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={
                ruleset.isPublic
                  ? {
                      backgroundColor: "var(--success-surface)",
                      color: "var(--success-text)",
                    }
                  : {
                      backgroundColor: "var(--bg-raised)",
                      color: "var(--text-secondary)",
                    }
              }
            >
              {ruleset.isPublic ? "Public" : "Private"}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>
              {rules.length} rule{rules.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {!isSystem && (
          <div className="flex gap-2">
            <button
              onClick={handleToggleVisibility}
              className="btn-secondary rounded-lg px-3 py-1.5 text-sm"
            >
              Make {ruleset.isPublic ? "Private" : "Public"}
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="btn-primary rounded-lg px-4 py-1.5 text-sm font-medium"
            >
              Add Rule
            </button>
          </div>
        )}
      </div>

      {isSystem && (
        <div
          className="mt-4 rounded-lg border p-4 text-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
          }}
        >
          These are built-in security rules included with every Snitch account. They are automatically available via the MCP server when you run scans. You can create your own rulesets to add custom rules.
        </div>
      )}

      {showAdd && !isSystem && (
        <form
          onSubmit={handleAddRule}
          className="surface mt-6 rounded-lg p-6 space-y-4"
        >
          <h3
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            New Rule
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="input-field rounded-lg px-3 py-2 text-sm"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="text"
              placeholder="Language (e.g. typescript)"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="input-field rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Framework (e.g. react)"
              value={form.framework}
              onChange={(e) => setForm({ ...form, framework: e.target.value })}
              className="input-field rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="File pattern (e.g. **/*.ts)"
              value={form.filePattern}
              onChange={(e) =>
                setForm({ ...form, filePattern: e.target.value })
              }
              className="input-field rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Pattern (regex)"
              value={form.pattern}
              onChange={(e) => setForm({ ...form, pattern: e.target.value })}
              className="input-field rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={2}
            className="input-field w-full rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <textarea
              placeholder="Good example (code)"
              value={form.goodExample}
              onChange={(e) =>
                setForm({ ...form, goodExample: e.target.value })
              }
              rows={3}
              className="input-field rounded-lg px-3 py-2 text-sm font-mono"
            />
            <textarea
              placeholder="Bad example (code)"
              value={form.badExample}
              onChange={(e) =>
                setForm({ ...form, badExample: e.target.value })
              }
              rows={3}
              className="input-field rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="btn-secondary rounded-lg px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
            >
              {saving ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </form>
      )}

      {/* Rules table */}
      <div
        className="mt-6 overflow-hidden rounded-lg border"
        style={{ borderColor: "var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Title
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Severity
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Language
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Framework
              </th>
              {!isSystem && (
                <th
                  className="px-4 py-3 text-right font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: "var(--border)" }}
          >
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {rule.title}
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={rule.severity ?? "medium"} />
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {rule.language ?? "any"}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {rule.framework ?? "any"}
                </td>
                {!isSystem && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="transition-colors"
                      style={{ color: "var(--danger-text)" }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td
                  colSpan={isSystem ? 4 : 5}
                  className="px-4 py-12 text-center"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No rules in this ruleset.{!isSystem && " Add one above."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, React.CSSProperties> = {
    critical: {
      backgroundColor: "var(--danger-surface)",
      color: "var(--danger-text)",
    },
    high: {
      backgroundColor: "var(--warning-surface)",
      color: "var(--warning-text)",
    },
    medium: {
      backgroundColor: "var(--info-surface)",
      color: "var(--info-text)",
    },
    low: {
      backgroundColor: "var(--bg-raised)",
      color: "var(--text-secondary)",
    },
    // Legacy values
    error: {
      backgroundColor: "var(--danger-surface)",
      color: "var(--danger-text)",
    },
    warning: {
      backgroundColor: "var(--warning-surface)",
      color: "var(--warning-text)",
    },
    info: {
      backgroundColor: "var(--info-surface)",
      color: "var(--info-text)",
    },
  };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={styles[severity] ?? styles.medium}
    >
      {severity}
    </span>
  );
}
