import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Snitch" },
      { name: "description", content: "Snitch terms of service." },
    ],
  }),
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        Terms of Service
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
            1. What Snitch Is
          </h2>
          <p>
            Snitch is a security audit tool that helps developers find
            vulnerabilities in their code. It works by providing structured
            security methodology to AI coding assistants (like Claude Code,
            Cursor, etc.), which then scan your codebase and report findings
            with evidence.
          </p>
          <p className="mt-2">
            Snitch does not guarantee that your code is secure. It is a tool
            that helps you find issues — not a replacement for professional
            security audits, penetration testing, or compliance certification.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            2. Products
          </h2>
          <p>
            <strong>Snitch Skill</strong> — A one-time purchase that adds a
            security audit skill file to your AI coding tools (Claude Code,
            Cursor, etc.). The skill runs entirely within your existing AI
            tool — your code never leaves your machine during scans.
          </p>
          <p className="mt-2">
            <strong>Snitch MCP Server</strong> — A hosted API that provides
            security methodology, custom rules, and project memory to
            connected AI agents. Requires an account and may involve a
            subscription.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            3. Accounts
          </h2>
          <p>
            Some features require an account. You are responsible for keeping
            your credentials secure. If you suspect unauthorized access,
            contact us immediately.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            4. Payments and Refunds
          </h2>
          <p>
            Payments are processed through Stripe. For the Skill, you
            pay once and receive lifetime updates. For the MCP Server,
            subscription fees are billed monthly and can be cancelled at any
            time.
          </p>
          <p className="mt-2">
            If you are unsatisfied with your purchase, contact us within 14
            days for a full refund. We want you to be happy with the product.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            5. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Reverse engineer, redistribute, or resell Snitch or its
              components
            </li>
            <li>
              Use Snitch to attack, exploit, or compromise systems you do not
              own or have authorization to test
            </li>
            <li>
              Circumvent rate limits, authentication, or other security
              measures
            </li>
            <li>
              Use the MCP server to store illegal content or content that
              violates the rights of others
            </li>
          </ul>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            6. Your Code
          </h2>
          <p>
            When using the Snitch Skill, your code stays on your machine. We
            never see it, collect it, or transmit it.
          </p>
          <p className="mt-2">
            When using the MCP Server's <code>check-pattern</code> tool, code
            snippets you submit are processed in memory to match against
            security patterns. They are not stored, logged, or used for
            training.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            7. No Warranty
          </h2>
          <p>
            Snitch is provided "as is" without warranty of any kind. We do
            not guarantee that it will find every vulnerability, prevent
            every breach, or satisfy every compliance requirement. Use it as
            one layer of defense, not your only one.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            8. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, Snitch and its creators
            are not liable for any indirect, incidental, special, or
            consequential damages arising from your use of the product. Our
            total liability is limited to the amount you paid for the
            product.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            9. Changes
          </h2>
          <p>
            We may update these terms. If we make significant changes, we
            will notify you via email or a notice on the site. Continued use
            after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            10. Contact
          </h2>
          <p>
            Questions about these terms? Email us at{" "}
            <a
              href="mailto:support@snitch.live"
              className="link"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              support@snitch.live
            </a>
            .
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
