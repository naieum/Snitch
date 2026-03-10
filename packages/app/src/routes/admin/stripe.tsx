import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface StripeData {
  subscriptionsByTier: { tier: string; count: number }[];
  totalActive: number;
  mrr: number;
  skillPurchases: number;
  skillRevenue: number;
}

const tierPrices: Record<string, number> = {
  free: 0,
  base: 12.99,
  pro: 19.99,
  enterprise: 79.99,
};

export const Route = createFileRoute("/admin/stripe")({
  component: AdminStripePage,
});

function AdminStripePage() {
  const [data, setData] = useState<StripeData>({
    subscriptionsByTier: [],
    totalActive: 0,
    mrr: 0,
    skillPurchases: 0,
    skillRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stripe", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((result: any) => {
        if (result) setData(result as StripeData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading Stripe data...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Stripe Overview</h1>
      <p className="mt-1 text-zinc-400">
        Subscription metrics and revenue.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Active Subscriptions</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {data.totalActive}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">MRR</p>
          <p className="mt-1 text-3xl font-bold text-green-400">
            ${data.mrr}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">ARR (estimated)</p>
          <p className="mt-1 text-3xl font-bold text-green-400">
            ${data.mrr * 12}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Skill Purchases</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {data.skillPurchases}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Skill Revenue</p>
          <p className="mt-1 text-3xl font-bold text-green-400">
            ${data.skillRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Subscriptions by tier */}
      <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-semibold text-white">Subscriptions by Tier</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Tier
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">
                  Count
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">
                  Price
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.subscriptionsByTier.map((s) => (
                <tr key={s.tier}>
                  <td className="px-4 py-3 text-zinc-200 capitalize">
                    {s.tier}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    {s.count}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    ${tierPrices[s.tier] ?? 0}/mo
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">
                    ${s.count * (tierPrices[s.tier] ?? 0)}/mo
                  </td>
                </tr>
              ))}
              {data.subscriptionsByTier.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No active subscriptions.
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
