import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface Device {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string | null;
  lastUsedAt: string | null;
  createdAt: string | null;
  clientType: string | null;
  machineLabel: string | null;
  lastHeartbeat: string | null;
}

interface Session {
  id: string;
  createdAt: string | null;
  expiresAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export const Route = createFileRoute("/dashboard/keys")({
  component: DevicesPage,
});

function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: "Unknown browser", os: "Unknown OS" };
  let browser = "Unknown browser";
  let os = "Unknown OS";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
  if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  return { browser, os };
}

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/keys", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/sessions", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([devicesData, sessionsData]: [any, any]) => {
        setDevices(Array.isArray(devicesData) ? devicesData : []);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRemoveDevice(id: string) {
    if (!confirm("Remove this device? It will need to be paired again.")) return;
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    }
  }

  async function handleRevokeSession(id: string) {
    if (!confirm("Revoke this session? You'll be logged out on that device.")) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading devices...
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        Devices &amp; Sessions
      </h1>
      <p
        className="mt-1 mb-8"
        style={{ color: "var(--text-secondary)" }}
      >
        Manage paired devices and active sessions on your account.
      </p>

      {/* Paired Devices */}
      <div className="mb-8">
        <h2
          className="text-sm font-medium uppercase tracking-wider mb-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Paired Devices
        </h2>
        <div
          className="divide-y rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                  style={{
                    backgroundColor: "var(--bg-raised)",
                    color: "var(--text-secondary)",
                  }}
                >
                  &#9109;
                </div>
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {device.machineLabel || device.name}
                  </p>
                  <div
                    className="mt-0.5 flex items-center gap-3 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <span>
                      {device.clientType === "desktop" ? "Snitch Skill" : "MCP Device"}
                    </span>
                    {device.lastHeartbeat && (
                      <span>Last seen {timeAgo(device.lastHeartbeat)}</span>
                    )}
                    {device.createdAt && (
                      <span>Paired {new Date(device.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {device.clientType === "desktop" && (
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: device.lastHeartbeat && (Date.now() - new Date(device.lastHeartbeat).getTime()) < 86400000
                        ? "var(--success-surface)"
                        : "var(--warning-surface)",
                      color: device.lastHeartbeat && (Date.now() - new Date(device.lastHeartbeat).getTime()) < 86400000
                        ? "var(--success-text)"
                        : "var(--warning-text)",
                    }}
                  >
                    {device.lastHeartbeat && (Date.now() - new Date(device.lastHeartbeat).getTime()) < 86400000
                      ? "Active"
                      : "Inactive"}
                  </span>
                )}
                <button
                  onClick={() => handleRemoveDevice(device.id)}
                  className="text-sm transition-colors"
                  style={{ color: "var(--danger-text)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {devices.length === 0 && (
            <div
              className="px-5 py-10 text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              <p className="text-sm">No paired devices.</p>
              <p className="mt-1 text-xs">
                Connect a device to pair it at snitch.live/pair
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <h2
          className="text-sm font-medium uppercase tracking-wider mb-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Active Sessions
        </h2>
        <div
          className="divide-y rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          {sessions.map((session) => {
            const { browser, os } = parseUserAgent(session.userAgent);
            return (
              <div
                key={session.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    &#9783;
                  </div>
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {browser} on {os}
                    </p>
                    <div
                      className="mt-0.5 flex items-center gap-3 text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {session.ipAddress && <span>{session.ipAddress}</span>}
                      {session.createdAt && (
                        <span>Signed in {timeAgo(session.createdAt)}</span>
                      )}
                      {session.expiresAt && (
                        <span>
                          Expires{" "}
                          {new Date(session.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="text-sm transition-colors"
                  style={{ color: "var(--danger-text)" }}
                >
                  Revoke
                </button>
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div
              className="px-5 py-10 text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              <p className="text-sm">No active sessions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
