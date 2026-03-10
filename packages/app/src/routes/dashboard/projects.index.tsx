import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  languages: string | null;
  frameworks: string | null;
  createdAt: string | null;
}

export const Route = createFileRoute("/dashboard/projects/")({
  component: ProjectsPage,
});

function formatJsonArray(val: string | null): string {
  if (!val) return "--";
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.join(", ");
  } catch {}
  return val;
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    languages: "",
    frameworks: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = (await res.json()) as Project;
        setProjects((prev) => [...prev, data]);
        setForm({ name: "", description: "", languages: "", frameworks: "" });
        setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading projects...
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
            Projects
          </h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your projects and linked rulesets.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
        >
          Create Project
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="surface mt-6 rounded-lg p-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Project name"
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
            <input
              type="text"
              placeholder="Languages (comma-separated)"
              value={form.languages}
              onChange={(e) => setForm({ ...form, languages: e.target.value })}
              className="input-field rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Frameworks (comma-separated)"
                value={form.frameworks}
                onChange={(e) =>
                  setForm({ ...form, frameworks: e.target.value })
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
                Name
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Description
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Languages
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Frameworks
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
            {projects.map((p) => (
              <tr
                key={p.id}
                className="transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <td className="px-4 py-3">
                  <Link
                    to="/dashboard/projects/$id"
                    params={{ id: p.id }}
                    className="link font-medium"
                  >
                    {p.name}
                  </Link>
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {p.description ?? "--"}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatJsonArray(p.languages)}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatJsonArray(p.frameworks)}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString()
                    : "--"}
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No projects yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
