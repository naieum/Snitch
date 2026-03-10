/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
  Link,
} from "@tanstack/react-router";
import { signOut } from "~/server/lib/auth-client";
import { useClientSession } from "~/hooks/use-client-session";
import { ThemeProvider, ThemeToggle } from "~/lib/theme";
import "~/app.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "snitchMCP" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="midnight">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          <TopNav />
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function TopNav() {
  const { data: session } = useClientSession();

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg-overlay)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            snitch<span style={{ color: "var(--accent)" }}>MCP</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/dashboard"
              className="link transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() =>
                  signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/";
                      },
                    },
                  })
                }
                className="link text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn-primary rounded-lg px-4 py-1.5 text-sm font-medium"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
