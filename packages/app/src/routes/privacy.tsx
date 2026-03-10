import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Snitch" },
      { name: "description", content: "Snitch privacy policy." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        Privacy Policy
      </h1>
      <p
        className="mt-2 text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        Last updated: March 9, 2026
      </p>

      <div
        className="mt-8 space-y-8 text-xs leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            The Short Version
          </h2>
          <p>
            We collect the minimum data needed to provide the service. We do
            not sell your data. We do not read your code. We do not track
            you across the web.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            What We Collect
          </h2>

          <h3
            className="mb-1 mt-4 font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Snitch Skill
          </h3>
          <p>
            The Snitch Skill is a file that runs entirely within your AI
            coding tool on your machine. It does not phone home, does not
            collect telemetry, and does not transmit your code. No network
            requests are made during scans.
          </p>

          <h3
            className="mb-1 mt-4 font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Website & MCP Server
          </h3>
          <p>When you create an account, we store:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Email address</strong> — for authentication and
              account recovery
            </li>
            <li>
              <strong>Name</strong> — if you provide one, for display
              purposes
            </li>
            <li>
              <strong>Payment information</strong> — processed and stored by
              Stripe, not us. We receive a customer ID and subscription
              status.
            </li>
            <li>
              <strong>Usage metrics</strong> — API call counts for rate
              limiting. We track how many MCP calls you make, not what you
              send in them.
            </li>
          </ul>

          <h3
            className="mb-1 mt-4 font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            MCP Tool Calls
          </h3>
          <p>
            When you use the <code>check-pattern</code> tool, code snippets
            are processed in memory to match against security patterns. They
            are <strong>not stored, not logged, and not used for training</strong>.
            The response is returned and the input is discarded.
          </p>
          <p className="mt-2">
            Project memories and custom rules you create are stored in our
            database and tied to your account. You can delete them at any
            time from the dashboard.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Cookies
          </h2>
          <p>
            We use a session cookie for authentication. That's it. No
            analytics cookies, no tracking pixels, no third-party scripts.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Third Parties
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Stripe</strong> — payment processing. Subject to{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
                style={{
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Stripe's Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Cloudflare</strong> — hosting and CDN. Subject to{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
                style={{
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Cloudflare's Privacy Policy
              </a>
              .
            </li>
          </ul>
          <p className="mt-2">
            We do not share your data with anyone else.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Data Retention
          </h2>
          <p>
            Account data is retained as long as your account is active. If
            you delete your account, we delete your data within 30 days.
            Payment records may be retained longer as required by law.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Your Rights
          </h2>
          <p>
            You can request a copy of your data, correct inaccuracies, or
            delete your account at any time. Email{" "}
            <a
              href="mailto:support@snitch.live"
              className="link"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              support@snitch.live
            </a>{" "}
            and we will respond within 7 days.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Changes
          </h2>
          <p>
            If we change this policy, we will update the date above and
            notify you via email if the changes are significant.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link
          to="/"
          className="link text-xs"
          style={{
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
