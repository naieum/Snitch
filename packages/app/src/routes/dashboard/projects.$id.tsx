import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface Memory {
  id: string;
  content: string;
  context: string | null;
  source: string | null;
  createdAt: string | null;
}

interface LinkedRuleset {
  rulesetId: string;
  name: string;
  category: string | null;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  languages: string | null;
  frameworks: string | null;
}

export const Route = createFileRoute("/dashboard/projects/$id")({
  component: ProjectDetailPage,
});

function formatJsonArray(val: string | null): string {
  if (!val) return "";
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.join(", ");
  } catch {}
  return val;
}

function ProjectDetailPage() {
  const { id } = useParams({ from: "/dashboard/projects/$id" });
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [linkedRulesets, setLinkedRulesets] = useState<LinkedRuleset[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesetIdToAdd, setRulesetIdToAdd] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/projects/${id}/rulesets`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([projectData, rulesetsData]: [any, any]) => {
        if (projectData) {
          setProject(projectData as ProjectDetail);
          setMemories(
            Array.isArray(projectData.memories) ? (projectData.memories as Memory[]) : []
          );
        }
        setLinkedRulesets(Array.isArray(rulesetsData) ? (rulesetsData as LinkedRuleset[]) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Project not found.
      </div>
    );
  }

  async function handleLinkRuleset(e: React.FormEvent) {
    e.preventDefault();
    if (!rulesetIdToAdd.trim()) return;
    const res = await fetch(`/api/projects/${project!.id}/rulesets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rulesetId: rulesetIdToAdd }),
    });
    if (res.ok) {
      const data = (await res.json()) as LinkedRuleset;
      setLinkedRulesets((prev) => [...prev, data]);
      setRulesetIdToAdd("");
    }
  }

  async function handleUnlinkRuleset(rulesetId: string) {
    const res = await fetch(
      `/api/projects/${project!.id}/rulesets/${rulesetId}`,
      { method: "DELETE", credentials: "include" }
    );
    if (res.ok) {
      setLinkedRulesets((prev) =>
        prev.filter((r) => r.rulesetId !== rulesetId)
      );
    }
  }

  return (
    <div>
      <div className="mb-1">
        <Link
          to="/dashboard/projects"
          className="text-sm transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          &larr; Back to projects
        </Link>
      </div>

      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {project.name}
      </h1>
      {project.description && (
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          {project.description}
        </p>
      )}
      <div
        className="mt-2 flex items-center gap-3 text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        {project.languages && (
          <span className="badge rounded px-2 py-0.5">
            {formatJsonArray(project.languages)}
          </span>
        )}
        {project.frameworks && (
          <span className="badge rounded px-2 py-0.5">
            {formatJsonArray(project.frameworks)}
          </span>
        )}
      </div>

      {/* Linked rulesets */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Linked Rulesets
          </h2>
        </div>
        <form onSubmit={handleLinkRuleset} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Ruleset ID to link"
            value={rulesetIdToAdd}
            onChange={(e) => setRulesetIdToAdd(e.target.value)}
            className="input-field flex-1 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Link
          </button>
        </form>
        <div
          className="mt-3 divide-y rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          {linkedRulesets.map((lr) => (
            <div
              key={lr.rulesetId}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <Link
                  to="/dashboard/rulesets/$id"
                  params={{ id: lr.rulesetId }}
                  className="link font-medium"
                >
                  {lr.name}
                </Link>
                {lr.category && (
                  <span
                    className="ml-2 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {lr.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleUnlinkRuleset(lr.rulesetId)}
                className="text-sm transition-colors"
                style={{ color: "var(--danger-text)" }}
              >
                Remove
              </button>
            </div>
          ))}
          {linkedRulesets.length === 0 && (
            <p
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              No rulesets linked. Add one above.
            </p>
          )}
        </div>
      </section>

      {/* Memories */}
      <section className="mt-8">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Memories
        </h2>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Context memories stored for this project.
        </p>
        <div
          className="mt-3 divide-y rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="text-sm line-clamp-2"
                style={{ color: "var(--text-primary)" }}
              >
                {mem.content}
              </p>
              <div
                className="mt-1 flex items-center gap-3 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {mem.context && <span>Context: {mem.context}</span>}
                {mem.source && <span>Source: {mem.source}</span>}
                {mem.createdAt && (
                  <span>{new Date(mem.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
          {memories.length === 0 && (
            <p
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              No memories stored yet. Memories are created via the MCP
              integration.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
