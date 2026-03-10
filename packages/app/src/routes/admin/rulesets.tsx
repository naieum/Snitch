import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface AdminRuleset {
  id: string;
  name: string;
  category: string | null;
  isPublic: number | null;
  ruleCount: number | null;
  ownerEmail: string | null;
  createdAt: string | null;
}

export const Route = createFileRoute("/admin/rulesets")({
  component: AdminRulesetsPage,
});

function AdminRulesetsPage() {
  const [rulesets, setRulesets] = useState<AdminRuleset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/rulesets")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRulesets(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    ...new Set(rulesets.map((r) => r.category).filter(Boolean)),
  ];

  const filtered = rulesets.filter((rs) => {
    if (filter === "public" && !rs.isPublic) return false;
    if (filter === "private" && rs.isPublic) return false;
    if (categoryFilter && rs.category !== categoryFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading rulesets...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">All Rulesets</h1>
      <p className="mt-1 text-zinc-400">
        Browse all rulesets across all users.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          {(["all", "public", "private"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c!}>
                {c}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-zinc-500">{filtered.length} results</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Owner
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Rules
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Visibility
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((rs) => (
              <tr
                key={rs.id}
                className="hover:bg-zinc-900/50 transition-colors"
              >
                <td className="px-4 py-3 text-zinc-200">{rs.name}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {rs.ownerEmail ?? "--"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {rs.category ?? "--"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {rs.ruleCount ?? 0}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      rs.isPublic
                        ? "bg-green-950 text-green-300"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {rs.isPublic ? "Public" : "Private"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  No rulesets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
