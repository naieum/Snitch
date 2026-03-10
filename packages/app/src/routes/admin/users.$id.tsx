import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  subscriptionTier: string | null;
  createdAt: string;
  rulesets: { id: string; name: string; category: string | null }[];
  projects: { id: string; name: string }[];
  apiKeys: { id: string; name: string; keyPrefix: string }[];
}

export const Route = createFileRoute("/admin/users/$id")({
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { id } = useParams({ from: "/admin/users/$id" });
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => setUser(data as UserDetail | null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading user...</div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-zinc-500">User not found.</div>
    );
  }

  async function handleChangeTier(tier: string) {
    await fetch(`/api/admin/users/${user!.id}/tier`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-1">
        <Link
          to="/admin/users"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to users
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white">{user.name}</h1>
      <p className="mt-1 text-zinc-400">{user.email}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User info */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">Account Info</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-400">Tier</dt>
              <dd className="text-zinc-200">
                {user.subscriptionTier ?? "free"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Signed Up</dt>
              <dd className="text-zinc-200">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500 mb-2">Change Tier</p>
            <div className="flex gap-2">
              {["free", "base", "pro", "enterprise"].map((t) => (
                <button
                  key={t}
                  onClick={() => handleChangeTier(t)}
                  disabled={user!.subscriptionTier === t}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-30"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rulesets */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">
            Rulesets ({user.rulesets.length})
          </h2>
          <div className="mt-3 divide-y divide-zinc-800">
            {user.rulesets.map((rs) => (
              <div key={rs.id} className="py-2 flex justify-between">
                <span className="text-sm text-zinc-200">{rs.name}</span>
                <span className="text-xs text-zinc-500">
                  {rs.category ?? "--"}
                </span>
              </div>
            ))}
            {user.rulesets.length === 0 && (
              <p className="py-3 text-sm text-zinc-500">No rulesets.</p>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">
            Projects ({user.projects.length})
          </h2>
          <div className="mt-3 divide-y divide-zinc-800">
            {user.projects.map((p) => (
              <div key={p.id} className="py-2">
                <span className="text-sm text-zinc-200">{p.name}</span>
              </div>
            ))}
            {user.projects.length === 0 && (
              <p className="py-3 text-sm text-zinc-500">No projects.</p>
            )}
          </div>
        </div>

        {/* API Keys */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">
            API Keys ({user.apiKeys.length})
          </h2>
          <div className="mt-3 divide-y divide-zinc-800">
            {user.apiKeys.map((k) => (
              <div key={k.id} className="py-2 flex justify-between">
                <span className="text-sm text-zinc-200">{k.name}</span>
                <code className="text-xs text-zinc-500">{k.keyPrefix}...</code>
              </div>
            ))}
            {user.apiKeys.length === 0 && (
              <p className="py-3 text-sm text-zinc-500">No API keys.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
