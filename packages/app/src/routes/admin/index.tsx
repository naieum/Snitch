import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface AdminStats {
  users: number;
  rulesets: number;
  rules: number;
  logs: number;
  recentUsers: {
    id: string;
    name: string;
    email: string;
    createdAt: string | null;
  }[];
}

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState<AdminStats>({
    users: 0,
    rulesets: 0,
    rules: 0,
    logs: 0,
    recentUsers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data) setStats(data as AdminStats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading admin stats...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
      <p className="mt-1 text-zinc-400">System-wide statistics.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.users} />
        <StatCard label="Total Rulesets" value={stats.rulesets} />
        <StatCard label="Total Rules" value={stats.rules} />
        <StatCard label="Request Logs" value={stats.logs} />
      </div>

      {/* Recent signups */}
      <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white">Recent Signups</h2>
        <div className="mt-4 divide-y divide-zinc-800">
          {stats.recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <span className="text-xs text-zinc-500">
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString()
                  : "--"}
              </span>
            </div>
          ))}
          {stats.recentUsers.length === 0 && (
            <p className="py-4 text-sm text-zinc-500">No users yet.</p>
          )}
        </div>
      </div>

      {/* System health */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white">System Health</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <HealthIndicator label="Database" status="healthy" />
          <HealthIndicator label="Auth" status="healthy" />
          <HealthIndicator label="Worker" status="healthy" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function HealthIndicator({
  label,
  status,
}: {
  label: string;
  status: "healthy" | "degraded" | "down";
}) {
  const colors = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    down: "bg-red-500",
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
      <span className="text-sm text-zinc-300">{label}</span>
    </div>
  );
}
