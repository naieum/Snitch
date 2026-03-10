import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

type Platform = "slack" | "teams" | "discord";
type Threshold = "critical" | "high" | "medium" | "all";

interface Integration {
  id: string;
  platform: Platform;
  webhookUrl: string;
  threshold: Threshold;
  weeklyDigest: boolean;
  createdAt: string;
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "slack", label: "Slack" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "discord", label: "Discord" },
];

const THRESHOLDS: { value: Threshold; label: string }[] = [
  { value: "critical", label: "Critical only" },
  { value: "high", label: "High+" },
  { value: "medium", label: "Medium+" },
  { value: "all", label: "All severities" },
];

export const Route = createFileRoute("/dashboard/integrations")({
  component: IntegrationsDashboard,
});

function IntegrationsDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [platform, setPlatform] = useState<Platform>("slack");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [threshold, setThreshold] = useState<Threshold>("high");
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  function loadIntegrations() {
    fetch("/api/integrations", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((result) => {
        if (result) setIntegrations(result as Integration[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function resetForm() {
    setPlatform("slack");
    setWebhookUrl("");
    setThreshold("high");
    setWeeklyDigest(false);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  }

  function editIntegration(integration: Integration) {
    setPlatform(integration.platform);
    setWebhookUrl(integration.webhookUrl);
    setThreshold(integration.threshold);
    setWeeklyDigest(integration.weeklyDigest);
    setEditingId(integration.id);
    setError(null);
    setSuccess(null);
  }

  async function handleSave() {
    if (!webhookUrl.trim()) {
      setError("Webhook URL is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body: Record<string, unknown> = {
        platform,
        webhookUrl: webhookUrl.trim(),
        threshold,
        weeklyDigest,
      };
      if (editingId) body.id = editingId;

      const res = await fetch("/api/integrations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setError((data as { error?: string }).error ?? "Failed to save integration.");
        return;
      }

      setSuccess(editingId ? "Integration updated." : "Integration created.");
      resetForm();
      loadIntegrations();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/integrations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== id));
        if (editingId === id) resetForm();
        setSuccess("Integration deleted.");
      }
    } catch {
      setError("Failed to delete integration.");
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading integrations...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Integrations
      </h1>
      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
        Configure webhook notifications for scan results.
      </p>

      {/* Status messages */}
      {error && (
        <div
          className="mt-4 rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mt-4 rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--success)" }}
        >
          {success}
        </div>
      )}

      {/* Form */}
      <div className="surface mt-6 rounded-lg p-6">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {editingId ? "Edit Integration" : "Add Integration"}
        </h2>

        <div className="mt-4 space-y-4">
          {/* Platform */}
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-tertiary)" }}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-tertiary)" }}>
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Threshold */}
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-tertiary)" }}>
              Alert Threshold
            </label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value as Threshold)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {THRESHOLDS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Weekly digest */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="weeklyDigest"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              style={{ accentColor: "var(--accent)" }}
            />
            <label
              htmlFor="weeklyDigest"
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Enable weekly digest summary
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary rounded px-5 py-2 text-xs font-medium"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add Integration"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded px-5 py-2 text-xs font-medium"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Existing integrations */}
      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Active Integrations
        </h2>
        {integrations.map((integration) => (
          <div key={integration.id} className="surface rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {PLATFORMS.find((p) => p.value === integration.platform)?.label ??
                    integration.platform}
                </span>
                <span
                  className="rounded px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: "var(--surface)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {THRESHOLDS.find((t) => t.value === integration.threshold)?.label ??
                    integration.threshold}
                </span>
                {integration.weeklyDigest && (
                  <span
                    className="rounded px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: "var(--surface)",
                      color: "var(--text-tertiary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Weekly digest
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editIntegration(integration)}
                  className="rounded px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(integration.id)}
                  className="rounded px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--surface)",
                    color: "var(--danger)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {integration.webhookUrl.replace(/(https?:\/\/[^/]+\/).*/, "$1...")}
            </p>
          </div>
        ))}
        {integrations.length === 0 && (
          <div className="surface rounded-lg p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No integrations configured. Add one above to receive scan notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
