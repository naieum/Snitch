import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface SystemData {
  database: {
    tables: { name: string; rows: number }[];
  };
}

export const Route = createFileRoute("/admin/system")({
  component: AdminSystemPage,
});

function AdminSystemPage() {
  const [data, setData] = useState<SystemData>({
    database: { tables: [] },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/system")
      .then((r) => (r.ok ? r.json() : null))
      .then((result: any) => {
        if (result) setData(result as SystemData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading system info...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">System Health</h1>
      <p className="mt-1 text-zinc-400">
        Infrastructure and database status.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* D1 Database */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">D1 Database</h2>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-400">Connected</span>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50">
                  <th className="px-3 py-2 text-left font-medium text-zinc-400">
                    Table
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-400">
                    Rows
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.database.tables.map((t) => (
                  <tr key={t.name}>
                    <td className="px-3 py-2 text-zinc-300 font-mono text-xs">
                      {t.name}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-400">
                      {t.rows}
                    </td>
                  </tr>
                ))}
                {data.database.tables.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-4 text-center text-zinc-500"
                    >
                      No table data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="font-semibold text-white">KV Namespace</h2>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-zinc-300">Bound</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Used for rate limiting and session caching.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="font-semibold text-white">Vectorize Index</h2>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-zinc-300">Active</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Used for semantic rule search via MCP.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="font-semibold text-white">Worker Runtime</h2>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-zinc-300">Running</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Cloudflare Workers runtime. CPU and memory managed by platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
