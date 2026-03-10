import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useClientSession } from "~/hooks/use-client-session";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { data: session } = useClientSession();
  const [stats, setStats] = useState({ rulesets: 0, projects: 0, keys: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/rulesets", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/projects", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/keys", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([rulesets, projects, keys]) => {
        setStats({
          rulesets: Array.isArray(rulesets) ? rulesets.length : 0,
          projects: Array.isArray(projects) ? projects.length : 0,
          keys: Array.isArray(keys) ? keys.length : 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        Welcome back, {userName}
      </h1>
      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
        Here is an overview of your snitchMCP workspace.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Rulesets"
          value={loading ? "--" : stats.rulesets}
          href="/dashboard/rulesets"
        />
        <StatCard
          label="Total Projects"
          value={loading ? "--" : stats.projects}
          href="/dashboard/projects"
        />
        <StatCard
          label="Devices"
          value={loading ? "--" : stats.keys}
          href="/dashboard/keys"
        />
      </div>

      <div
        className="surface mt-8 rounded-lg p-6"
      >
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/dashboard/rulesets"
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Create Ruleset
          </Link>
          <Link
            to="/dashboard/projects"
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Create Project
          </Link>
          <Link
            to="/dashboard/keys"
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Manage Devices
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="surface rounded-lg p-6">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-3xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
  if (href) return <Link to={href}>{content}</Link>;
  return content;
}
