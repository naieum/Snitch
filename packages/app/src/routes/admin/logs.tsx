import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  userId: string | null;
  method: string;
  path: string;
  statusCode: number | null;
  latency: number | null;
  userAgent: string | null;
  ip: string | null;
  timestamp: string | null;
}

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "errors">("all");

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    tab === "errors"
      ? logs.filter((l) => l.statusCode && l.statusCode >= 400)
      : logs;

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading logs...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Request Logs</h1>
      <p className="mt-1 text-zinc-400">Recent API request history.</p>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setTab("all")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "all"
                ? "bg-indigo-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTab("errors")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "errors"
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Errors (4xx/5xx)
          </button>
        </div>
        <span className="text-xs text-zinc-500">
          {filtered.length} entries
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-400 whitespace-nowrap">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Method
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Path
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Latency
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : "--"}
                  </td>
                  <td className="px-4 py-3">
                    <MethodBadge method={log.method} />
                  </td>
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs max-w-[200px] truncate">
                    {log.path}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge code={log.statusCode} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {log.latency != null ? `${log.latency}ms` : "--"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs truncate max-w-[120px]">
                    {log.userId ?? "--"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    No logs found.
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

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "text-green-400",
    POST: "text-blue-400",
    PUT: "text-yellow-400",
    PATCH: "text-yellow-400",
    DELETE: "text-red-400",
  };
  return (
    <span
      className={`font-mono text-xs font-medium ${colors[method] ?? "text-zinc-400"}`}
    >
      {method}
    </span>
  );
}

function StatusBadge({ code }: { code: number | null }) {
  if (code == null) return <span className="text-zinc-500">--</span>;
  const color =
    code < 300
      ? "text-green-400"
      : code < 400
        ? "text-yellow-400"
        : code < 500
          ? "text-orange-400"
          : "text-red-400";
  return <span className={`font-mono text-xs font-medium ${color}`}>{code}</span>;
}
