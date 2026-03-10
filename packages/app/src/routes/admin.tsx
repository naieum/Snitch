import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const adminLinks = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/rulesets", label: "Rulesets" },
  { to: "/admin/logs", label: "Logs" },
  { to: "/admin/usage", label: "Usage" },
  { to: "/admin/stripe", label: "Stripe" },
  { to: "/admin/system", label: "System" },
] as const;

function AdminLayout() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 px-3 py-6">
        <div className="mb-6 px-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Admin Panel
            </p>
            <span className="rounded bg-red-950 px-1.5 py-0.5 text-xs font-medium text-red-300">
              Admin
            </span>
          </div>
        </div>
        <nav className="space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={
                "exact" in link ? { exact: true } : undefined
              }
              className="block rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors [&.active]:bg-indigo-950/50 [&.active]:text-indigo-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-zinc-800 pt-6 px-3">
          <Link
            to="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 py-8 overflow-auto">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
