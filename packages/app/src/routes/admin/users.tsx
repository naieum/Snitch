import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  subscriptionTier: string | null;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading users...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <p className="mt-1 text-zinc-400">All registered users.</p>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Tier
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Signed Up
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-zinc-900/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    to="/admin/users/$id"
                    params={{ id: u.id }}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    {u.email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-300">{u.name}</td>
                <td className="px-4 py-3">
                  <TierBadge tier={u.subscriptionTier ?? "free"} />
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(u.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: "bg-zinc-800 text-zinc-400",
    base: "bg-blue-950 text-blue-300",
    pro: "bg-indigo-950 text-indigo-300",
    enterprise: "bg-violet-950 text-violet-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[tier] ?? styles.free
      }`}
    >
      {tier}
    </span>
  );
}
