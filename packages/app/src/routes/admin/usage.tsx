import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface UsageData {
  tierDistribution: { tier: string; count: number }[];
  topEndpoints: { path: string; count: number }[];
  recentUsage: { period: string; action: string; total: number }[];
}

export const Route = createFileRoute("/admin/usage")({
  component: AdminUsagePage,
});

function AdminUsagePage() {
  const [data, setData] = useState<UsageData>({
    tierDistribution: [],
    topEndpoints: [],
    recentUsage: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/usage", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((result: any) => {
        if (result) setData(result as UsageData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading usage data...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Usage Analytics</h1>
      <p className="mt-1 text-zinc-400">
        Platform usage data and distribution.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tier distribution */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">Tier Distribution</h2>
          <div className="mt-4 space-y-3">
            {data.tierDistribution.map((t) => (
              <div key={t.tier} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      t.tier === "base"
                        ? "bg-blue-500"
                        : t.tier === "pro"
                          ? "bg-indigo-500"
                          : t.tier === "enterprise"
                            ? "bg-violet-500"
                            : "bg-zinc-500"
                    }`}
                  />
                  <span className="text-sm text-zinc-300 capitalize">
                    {t.tier}
                  </span>
                </div>
                <span className="text-sm font-medium text-white">
                  {t.count}
                </span>
              </div>
            ))}
            {data.tierDistribution.length === 0 && (
              <p className="text-sm text-zinc-500">No users yet.</p>
            )}
          </div>
        </div>

        {/* Top endpoints */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">Top Endpoints</h2>
          <div className="mt-4 space-y-2">
            {data.topEndpoints.map((ep, i) => (
              <div key={ep.path} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-5">{i + 1}.</span>
                  <code className="text-sm text-zinc-300 font-mono truncate max-w-[250px]">
                    {ep.path}
                  </code>
                </div>
                <span className="text-sm text-zinc-400">{ep.count}</span>
              </div>
            ))}
            {data.topEndpoints.length === 0 && (
              <p className="text-sm text-zinc-500">No request data.</p>
            )}
          </div>
        </div>
      </div>

      {/* Usage records table */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-semibold text-white">Usage Records</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Period
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Action
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.recentUsage.map((u, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-zinc-300">{u.period}</td>
                  <td className="px-4 py-2 text-zinc-400">{u.action}</td>
                  <td className="px-4 py-2 text-right text-zinc-200">
                    {u.total}
                  </td>
                </tr>
              ))}
              {data.recentUsage.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No usage data yet.
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
