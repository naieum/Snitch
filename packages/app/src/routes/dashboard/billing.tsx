import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface BillingData {
  tier: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string | null;
  granted?: boolean;
}

export const Route = createFileRoute("/dashboard/billing")({
  component: BillingPage,
});

const plans = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    limits: {
      categories: 0,
      rulesets: 3,
      rules: 50,
      projects: 1,
      mcpCalls: "50/mo",
    },
  },
  {
    tier: "base",
    name: "Base",
    price: "$12.99/mo",
    limits: {
      categories: 20,
      rulesets: 10,
      rules: 200,
      projects: 5,
      mcpCalls: "2,000/mo",
    },
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$19.99/mo",
    limits: {
      categories: 35,
      rulesets: 25,
      rules: 500,
      projects: 10,
      mcpCalls: "5,000/mo",
    },
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    price: "$79.99/mo",
    limits: {
      categories: 45,
      rulesets: "Unlimited",
      rules: "Unlimited",
      projects: "Unlimited",
      mcpCalls: "Unlimited",
      seats: 5,
    },
  },
];

function BillingPage() {
  const [billing, setBilling] = useState<BillingData>({
    tier: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data) setBilling(data as BillingData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentPlan = plans.find((p) => p.tier === billing.tier) ?? plans[0];

  async function handleUpgrade(tier: string) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });
    if (res.ok) {
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
    }
  }

  async function handleManage() {
    const res = await fetch("/api/stripe/portal", { method: "POST", credentials: "include" });
    if (res.ok) {
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
        Loading billing...
      </div>
    );
  }

  const statusLabel = billing.granted
    ? "Granted"
    : billing.status === "active"
      ? "Active"
      : billing.tier === "free"
        ? "Free"
        : billing.status ?? "Free";

  return (
    <div>
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        Billing
      </h1>
      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
        Manage your subscription and usage.
      </p>

      {/* Current plan */}
      <div className="surface mt-8 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Current Plan
            </p>
            <div className="mt-1 flex items-center gap-3">
              <span
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {currentPlan.name}
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={
                  billing.granted
                    ? {
                        backgroundColor: "var(--success-surface, #064e3b)",
                        color: "var(--success-text, #6ee7b7)",
                      }
                    : billing.tier === "free"
                      ? {
                          backgroundColor: "var(--bg-raised)",
                          color: "var(--text-secondary)",
                        }
                      : {
                          backgroundColor: "var(--info-surface)",
                          color: "var(--info-text)",
                        }
                }
              >
                {statusLabel}
              </span>
            </div>
          </div>
          {billing.stripeSubscriptionId && !billing.granted && (
            <button
              onClick={handleManage}
              className="btn-secondary rounded-lg px-4 py-2 text-sm"
            >
              Manage Subscription
            </button>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="surface mt-6 rounded-lg p-6">
        <h2
          className="font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Usage Limits
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <UsageStat label="Categories" limit={currentPlan.limits.categories} />
          <UsageStat label="Rulesets" limit={currentPlan.limits.rulesets} />
          <UsageStat label="Rules" limit={currentPlan.limits.rules} />
          <UsageStat label="Projects" limit={currentPlan.limits.projects} />
          <UsageStat label="MCP Calls" limit={currentPlan.limits.mcpCalls} />
        </div>
      </div>

      {/* Pricing comparison */}
      <div className="mt-8">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Compare Plans
        </h2>
        <div
          className="mt-4 overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    key={p.tier}
                    className="px-4 py-3 text-center font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              <tr style={{ borderColor: "var(--border)" }}>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Price
                </td>
                {plans.map((p) => (
                  <td
                    key={p.tier}
                    className="px-4 py-3 text-center"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {p.price}
                  </td>
                ))}
              </tr>
              {(["categories", "rulesets", "rules", "projects", "mcpCalls"] as const).map(
                (key) => (
                  <tr key={key} style={{ borderColor: "var(--border)" }}>
                    <td
                      className="px-4 py-3 capitalize"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {key === "mcpCalls" ? "MCP Calls" : key}
                    </td>
                    {plans.map((p) => (
                      <td
                        key={p.tier}
                        className="px-4 py-3 text-center"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {p.limits[key] ?? "--"}
                      </td>
                    ))}
                  </tr>
                )
              )}
              <tr style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3" />
                {plans.map((p) => (
                  <td key={p.tier} className="px-4 py-3 text-center">
                    {p.tier === "free" ? null : p.tier !== billing.tier ? (
                      <button
                        onClick={() => handleUpgrade(p.tier)}
                        disabled={billing.granted}
                        className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 ${
                          plans.indexOf(p) >
                          plans.findIndex((x) => x.tier === billing.tier)
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                      >
                        {plans.indexOf(p) >
                        plans.findIndex((x) => x.tier === billing.tier)
                          ? "Upgrade"
                          : "Downgrade"}
                      </button>
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Current plan
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsageStat({
  label,
  limit,
}: {
  label: string;
  limit: string | number;
}) {
  return (
    <div>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {limit}
      </p>
    </div>
  );
}
