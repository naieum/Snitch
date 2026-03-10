import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useClientSession } from "~/hooks/use-client-session";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const sidebarLinks = [
  { to: "/dashboard", label: "Overview", exact: true },
  { to: "/dashboard/rulesets", label: "Rulesets" },
  { to: "/dashboard/projects", label: "Projects" },
  { to: "/dashboard/history", label: "Scan History" },
  { to: "/dashboard/integrations", label: "Integrations" },
  { to: "/dashboard/keys", label: "Devices" },
  { to: "/dashboard/billing", label: "Billing" },
  { to: "/dashboard/settings", label: "Settings" },
] as const;

function DashboardLayout() {
  const { data: session, loading } = useClientSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p style={{ color: "var(--text-tertiary)" }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex">
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 border-r px-3 py-6"
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mb-6 px-3">
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            Navigation
          </p>
        </div>
        <nav className="space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={
                "exact" in link ? { exact: true } : undefined
              }
              className="sidebar-link block rounded-lg px-3 py-2 text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div
          className="mt-8 border-t pt-6 px-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-xs truncate"
            style={{ color: "var(--text-tertiary)" }}
          >
            {session?.user?.email}
          </p>
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
