import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface Ruleset {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isPublic: number | null;
  ownerId: string | null;
  ruleCount: number | null;
  createdAt: string | null;
}

export const Route = createFileRoute("/dashboard/rulesets/")({
  component: RulesetsPage,
});

function RulesetsPage() {
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/rulesets", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRulesets(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/rulesets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = (await res.json()) as Ruleset;
        setRulesets((prev) => [...prev, data]);
        setForm({ name: "", description: "", category: "" });
        setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  }

  // Separate system rulesets from user rulesets
  const systemRulesets = rulesets.filter((rs) => !rs.ownerId);
  const userRulesets = rulesets.filter((rs) => rs.ownerId);

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading rulesets...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Rulesets
          </h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your security rule collections.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
        >
          Create Ruleset
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="surface mt-6 rounded-lg p-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Ruleset name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input-field rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="input-field flex-1 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={creating}
                className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
              >
                {creating ? "..." : "Create"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* System / Built-in Rulesets */}
      {systemRulesets.length > 0 && (
        <div className="mt-6">
          <h2
            className="text-sm font-medium uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Built-in Rules
          </h2>
          <div className="space-y-3">
            {systemRulesets.map((rs) => (
              <Link
                key={rs.id}
                to="/dashboard/rulesets/$id"
                params={{ id: rs.id }}
                className="surface block rounded-lg p-5 transition-colors"
                style={{ textDecoration: "none" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {rs.name}
                      </span>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: "var(--info-surface)",
                          color: "var(--info-text)",
                        }}
                      >
                        System
                      </span>
                    </div>
                    {rs.description && (
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {rs.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-tertiary)" }}>
                    <span>{rs.ruleCount ?? 0} rules</span>
                    <span style={{ color: "var(--text-tertiary)" }}>&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User Rulesets */}
      <div className="mt-6">
        {systemRulesets.length > 0 && (
          <h2
            className="text-sm font-medium uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Your Rulesets
          </h2>
        )}
        <div
          className="overflow-hidden rounded-lg border"
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
                  Name
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Category
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Rules
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Visibility
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {userRulesets.map((rs) => (
                <tr
                  key={rs.id}
                  className="transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/dashboard/rulesets/$id"
                      params={{ id: rs.id }}
                      className="link font-medium"
                    >
                      {rs.name}
                    </Link>
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {rs.category ?? "--"}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {rs.ruleCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        rs.isPublic
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
                      {rs.isPublic ? "Public" : "Private"}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {rs.createdAt
                      ? new Date(rs.createdAt).toLocaleDateString()
                      : "--"}
                  </td>
                </tr>
              ))}
              {userRulesets.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    No custom rulesets yet. Create one to add your own rules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
