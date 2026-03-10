import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  SiClaude,
  SiAnthropic,
  SiGooglegemini,
  SiGithubcopilot,
  SiCursor,
  SiWindsurf,
  SiZedindustries,
} from "@icons-pack/react-simple-icons";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Snitch — Security Audit for AI-Generated Code" },
      {
        name: "description",
        content:
          "Security audit plugin that works inside your AI coding tools. 45 categories, evidence-based findings. Works with Claude Code, Cursor, Gemini CLI, and more.",
      },
      {
        property: "og:title",
        content: "Snitch — Security Audit for AI-Generated Code",
      },
      {
        property: "og:description",
        content:
          "Your AI writes the code. Snitch reads every line. 45 categories. Evidence-based findings.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://snitch.live" },
    ],
  }),
});

/* ══════════════════════════════════════════════════════════════════
   DATA CONSTANTS
   ══════════════════════════════════════════════════════════════════ */

const FEATURED_CATEGORIES: {
  id: number;
  name: string;
  severity: "critical" | "high" | "medium";
  description: string;
}[] = [
  {
    id: 1,
    name: "SQL Injection",
    severity: "critical",
    description:
      "Finds user input flowing into database queries — raw SQL, ORM calls, and dynamic query builders. Knows the difference between a parameterized query and a dangerous one.",
  },
  {
    id: 3,
    name: "Hardcoded Secrets",
    severity: "critical",
    description:
      "The most common issue in AI-generated code. Your AI doesn't think about .env files unless you tell it to. Snitch catches what it left behind.",
  },
  {
    id: 4,
    name: "Authentication Issues",
    severity: "critical",
    description:
      "Unprotected routes, sessions that never expire, logout flows that don't invalidate tokens. Auth is complex — Snitch checks the edge cases your AI skips.",
  },
  {
    id: 15,
    name: "AI API Security",
    severity: "critical",
    description:
      "Prompt injection, leaked AI API keys, unvalidated AI output, missing cost controls. The category no other scanner has — because they were built before AI-generated code was the norm.",
  },
  {
    id: 13,
    name: "Stripe Security",
    severity: "high",
    description:
      "Webhook verification, key exposure, client-side price manipulation. If you accept payments, this category alone is worth the price of admission.",
  },
  {
    id: 6,
    name: "Supabase Security",
    severity: "high",
    description:
      "RLS gaps, service key exposure, connection string leaks. Knows the difference between an anon key (fine in client) and a service role key (not fine).",
  },
  {
    id: 39,
    name: "Token Lifetimes",
    severity: "high",
    description:
      "If someone steals a session cookie, how long do they have? Snitch checks expiry, rotation, and absolute timeouts across your auth stack.",
  },
  {
    id: 28,
    name: "Authorization / IDOR",
    severity: "high",
    description:
      "Can user A see user B's data by changing an ID in the URL? Checks that resource access includes ownership verification, not just authentication.",
  },
  {
    id: 20,
    name: "HIPAA Compliance",
    severity: "high",
    description:
      "PHI encryption, access audit logs, data retention policies. If you handle health data, Snitch checks the compliance basics your AI doesn't know about.",
  },
  {
    id: 31,
    name: "CI/CD Pipeline Security",
    severity: "high",
    description:
      "Secrets in CI config, unprotected deployment triggers, missing review gates. Supply chain security for your build pipeline.",
  },
  {
    id: 25,
    name: "N+1 Queries",
    severity: "medium",
    description:
      "Not a security bug, but a performance issue that becomes a denial-of-service vector at scale. Finds database calls that multiply with your data.",
  },
  {
    id: 10,
    name: "Dangerous Code Patterns",
    severity: "high",
    description:
      "Dynamic code evaluation, shell execution, unsafe deserialization. The patterns that turn a code flaw into a remote code execution.",
  },
];

const REMAINING_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "Core Security",
    items: [
      "XSS (Cat 2)",
      "SSRF (Cat 5)",
      "Rate Limiting (Cat 7)",
      "CORS (Cat 8)",
      "Cryptography (Cat 9)",
      "Cloud Config (Cat 11)",
      "Data Leaks (Cat 12)",
    ],
  },
  {
    group: "Modern Stack",
    items: [
      "Auth Providers (Cat 14)",
      "Email Services (Cat 16)",
      "Database Security (Cat 17)",
      "Redis Security (Cat 18)",
      "SMS Services (Cat 19)",
    ],
  },
  {
    group: "Compliance",
    items: ["SOC 2 (Cat 21)", "PCI-DSS (Cat 22)", "GDPR (Cat 23)"],
  },
  {
    group: "Performance",
    items: ["Memory Leaks (Cat 24)", "Slow Code Paths (Cat 26)"],
  },
  {
    group: "Infrastructure",
    items: [
      "Dependencies (Cat 27)",
      "File Uploads (Cat 29)",
      "Input Validation (Cat 30)",
      "Security Headers (Cat 32)",
      "Unused Packages (Cat 33)",
      "DNS & Tunnels (Cat 40)",
    ],
  },
  {
    group: "Governance",
    items: [
      "FIPS Compliance (Cat 34)",
      "Certifications (Cat 35)",
      "BC/DR Plans (Cat 36)",
      "Monitoring (Cat 37)",
      "Data Classification (Cat 38)",
    ],
  },
];

const MCP_TOOLS: { name: string; description: string }[] = [
  {
    name: "start-audit",
    description:
      "Kick off a security scan. Your AI gets the methodology and runs it using its own file access — your code never leaves your machine.",
  },
  {
    name: "detect-stack",
    description:
      "Reads your package.json and figures out which categories matter for your tech stack. No manual selection needed.",
  },
  {
    name: "get-category",
    description:
      "Pull the guidance for a single category on demand. Useful for targeted scans or deep-diving into a specific area.",
  },
  {
    name: "check-pattern",
    description:
      "Submit a code snippet for a second opinion against the pattern database. Additional signal for borderline cases.",
  },
  {
    name: "get-rules",
    description:
      "Retrieve your team's custom security rules, filtered by language, framework, or project.",
  },
  {
    name: "search-rules",
    description:
      "Semantic search across your rule library. Find relevant rules by meaning, not just keywords.",
  },
  {
    name: "add-memory",
    description:
      "Store findings and context across audit sessions. Your next scan remembers what the last one found.",
  },
  {
    name: "get-memories",
    description:
      "Query past audit context. Ask for previous findings on a topic and get relevant history.",
  },
];

const VALIDATION_SIGNALS: { name: string }[] = [
  { name: "Reproducibility Hooks" },
  { name: "Negative Testing" },
  { name: "Fix Verification" },
  { name: "Patch Safety" },
  { name: "Sensitive Flow Traceability" },
  { name: "Runtime Guardrails" },
];

/* ══════════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ══════════════════════════════════════════════════════════════════ */

/* ── Animated grid background ── */
function GridCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      const step = 40;
      const isDark =
        document.documentElement.getAttribute("data-theme") !== "cream";
      const baseAlpha = isDark ? 0.06 : 0.08;

      ctx!.lineWidth = 0.5;
      for (let x = 0; x <= w; x += step) {
        const pulse = Math.sin((x + t * 30) * 0.01) * 0.02;
        ctx!.strokeStyle = isDark
          ? `rgba(255,255,255,${baseAlpha + pulse})`
          : `rgba(0,0,0,${baseAlpha + pulse})`;
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, h);
        ctx!.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        const pulse = Math.sin((y + t * 20) * 0.01) * 0.02;
        ctx!.strokeStyle = isDark
          ? `rgba(255,255,255,${baseAlpha + pulse})`
          : `rgba(0,0,0,${baseAlpha + pulse})`;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
        ctx!.stroke();
      }

      for (let x = 0; x <= w; x += step) {
        for (let y = 0; y <= h; y += step) {
          const dist = Math.sqrt((x - w / 2) ** 2 + (y - h / 3) ** 2);
          const glow = Math.max(0, 1 - dist / (w * 0.5));
          const dotAlpha =
            0.03 + glow * 0.15 + Math.sin((x + y + t * 40) * 0.005) * 0.03;
          ctx!.fillStyle = isDark
            ? `rgba(255,255,255,${dotAlpha})`
            : `rgba(74,111,165,${dotAlpha})`;
          ctx!.beginPath();
          ctx!.arc(x, y, 1 + glow * 1.5, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      t++;
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 0.8 }}
    />
  );
}

/* ── Blinking cursor ── */
function Cursor() {
  return (
    <span
      className="inline-block w-[2px] ml-1 align-baseline"
      style={{
        height: "1em",
        backgroundColor: "var(--accent)",
        animation: "blink 1s step-end infinite",
      }}
    />
  );
}

/* ── Typewriter terminal ── */
interface TerminalLine {
  prefix: string;
  text: string;
  color?: string;
  delay?: number;
}

function AnimatedTerminal({
  title,
  lines,
  loop = true,
}: {
  title: string;
  lines: TerminalLine[];
  loop?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= lines.length) {
      if (loop) {
        const resetTimer = setTimeout(() => setVisibleCount(0), 4000);
        return () => clearTimeout(resetTimer);
      }
      return;
    }

    const delay = lines[visibleCount]?.delay ?? 600;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount, lines, loop]);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div
        className="flex items-center gap-1.5 px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--danger)" }}
        />
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--warning)" }}
        />
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
        />
        <span
          className="ml-2"
          style={{ color: "var(--text-tertiary)", fontSize: "10px" }}
        >
          {title}
        </span>
      </div>
      <div
        className="space-y-1 p-4 text-xs"
        style={{ fontFamily: "inherit", minHeight: `${lines.length * 1.5 + 1}em` }}
      >
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className="flex gap-2">
            <span
              style={{
                color:
                  line.prefix === "!"
                    ? "var(--danger)"
                    : line.prefix === "+"
                      ? "var(--success)"
                      : "var(--accent)",
                flexShrink: 0,
              }}
            >
              {line.prefix}
            </span>
            <span
              style={{
                color:
                  line.color ??
                  (line.prefix === "!"
                    ? "var(--danger-text, var(--danger))"
                    : line.prefix === "+"
                      ? "var(--success-text, var(--success))"
                      : "var(--text-secondary)"),
              }}
            >
              {line.text}
            </span>
          </div>
        ))}
        {visibleCount < lines.length && (
          <span
            className="inline-block w-[6px] h-[13px]"
            style={{
              backgroundColor: "var(--accent)",
              animation: "blink 1s step-end infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Static terminal (no animation) ── */
function StaticTerminal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div
        className="flex items-center gap-1.5 px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--danger)" }}
        />
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--warning)" }}
        />
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
        />
        <span
          className="ml-2"
          style={{ color: "var(--text-tertiary)", fontSize: "10px" }}
        >
          {title}
        </span>
      </div>
      <div className="p-4 text-xs" style={{ fontFamily: "inherit" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Interactive Before/After code comparison ── */
function BeforeAfter({
  title,
  before,
  after,
  explanation,
}: {
  title: string;
  before: { label: string; lines: string[] };
  after: { label: string; lines: string[] };
  explanation: string;
}) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-xs font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAfter(false)}
            className="rounded px-2.5 py-1 text-[11px] transition-all"
            style={{
              backgroundColor: !showAfter
                ? "var(--danger)"
                : "transparent",
              color: !showAfter
                ? "#fff"
                : "var(--text-tertiary)",
              border: !showAfter
                ? "none"
                : "1px solid var(--border)",
            }}
          >
            {before.label}
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className="rounded px-2.5 py-1 text-[11px] transition-all"
            style={{
              backgroundColor: showAfter
                ? "var(--success)"
                : "transparent",
              color: showAfter
                ? "#fff"
                : "var(--text-tertiary)",
              border: showAfter
                ? "none"
                : "1px solid var(--border)",
            }}
          >
            {after.label}
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-0.5 text-xs" style={{ fontFamily: "inherit" }}>
          {(showAfter ? after.lines : before.lines).map((line, i) => (
            <div
              key={`${showAfter}-${i}`}
              className="flex gap-3"
              style={{
                opacity: line.trim() === "" ? 0 : 1,
                minHeight: "1.2em",
              }}
            >
              <span
                className="w-5 text-right flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  color: line.startsWith("+")
                    ? "var(--success)"
                    : line.startsWith("-")
                      ? "var(--danger)"
                      : "var(--text-secondary)",
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
        <p
          className="mt-4 text-xs leading-relaxed"
          style={{
            color: showAfter
              ? "var(--success-text, var(--success))"
              : "var(--danger-text, var(--danger))",
          }}
        >
          {showAfter ? "Fixed." : explanation}
        </p>
      </div>
    </div>
  );
}

/* ── Featured category card ── */
function FeaturedCategoryCard({
  cat,
}: {
  cat: (typeof FEATURED_CATEGORIES)[number];
}) {
  const colors = {
    critical: "var(--danger)",
    high: "var(--warning)",
    medium: "var(--info)",
  };
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: colors[cat.severity] }}
          />
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {cat.name}
          </p>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: colors[cat.severity] }}
        >
          {cat.severity}
        </span>
      </div>
      <p
        className="mt-2 text-xs leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {cat.description}
      </p>
    </div>
  );
}

/* ── Tool badge ── */
function ToolBadge({ name }: { name: string }) {
  return (
    <span
      className="inline-block rounded border px-3 py-1.5 text-xs"
      style={{
        borderColor: "var(--border)",
        color: "var(--text-secondary)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {name}
    </span>
  );
}

/* ── Section helpers ── */
function Divider() {
  return (
    <div
      className="mx-auto h-px w-full max-w-5xl"
      style={{ backgroundColor: "var(--border)" }}
    />
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className="text-center text-xs uppercase tracking-widest"
      style={{ color: "var(--text-tertiary)" }}
    >
      {children}
    </p>
  );
}

/* ── Stat block ── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p
        className="text-3xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
    </div>
  );
}

/* ── MCP tool card ── */
function MCPToolCard({ tool }: { tool: (typeof MCP_TOOLS)[number] }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <p
        className="text-xs font-semibold"
        style={{ color: "var(--accent)" }}
      >
        {tool.name}
      </p>
      <p
        className="mt-1.5 text-[11px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {tool.description}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════════════════════════ */

function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* ─── 1. HERO ─── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-24 sm:py-32">
        <GridCanvas />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 30%, var(--accent) 0%, transparent 70%)",
            opacity: 0.04,
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div
            className="mx-auto mb-6 inline-block rounded border px-3 py-1 text-xs uppercase tracking-widest"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-tertiary)",
            }}
          >
            Security audit for AI-generated code
          </div>

          <h1
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "var(--text-primary)" }}
          >
            Your AI writes the code.
            <br />
            <span style={{ color: "var(--accent)" }}>
              Snitch reads every line.
            </span>
            <Cursor />
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl leading-relaxed"
            style={{ color: "var(--text-secondary)", fontSize: "13px" }}
          >
            Snitch searches your codebase, reads the actual code, and reports
            only what it can prove — with the file path, line number, and quoted
            snippet for every finding. 45 categories. CWE, OWASP, and CVSS
            mapping on every issue. If it can't show you the evidence, it
            doesn't report it.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="btn-primary rounded px-6 py-2.5 text-sm font-medium"
            >
              Get Started
            </Link>
            <a
              href="#workflow"
              className="btn-secondary rounded px-5 py-2.5 text-sm font-medium"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("workflow")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── STATS ─── */}
      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8">
          <Stat value="45" label="security categories" />
          <Stat value="15+" label="AI tools supported" />
          <Stat value="0" label="findings without proof" />
        </div>
      </section>

      <Divider />

      {/* ─── 2. WORKFLOW TIMELINE ─── */}
      <section id="workflow" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>How It Works</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            What happens when you run /snitch
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            A full security audit in five phases. Your AI does the scanning
            with its own tools — Snitch tells it exactly what to look for and
            how to verify it.
          </p>

          <div className="mx-auto mt-14 max-w-3xl space-y-10">
            {/* Phase 1 */}
            <div className="timeline-phase">
              <div className="timeline-dot">1</div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Pick your categories
              </h3>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Choose from three pages of categories organized by theme —
                Core Security, Modern Stack, and
                Infrastructure/Governance — or select a scan preset
                (web, secrets, compliance, full). The Quick Scan shortcut
                skips this step entirely and auto-detects your stack.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="timeline-phase">
              <div className="timeline-dot">2</div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Stack detection
              </h3>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Quick Scan reads your package.json (or equivalent manifest)
                and maps every dependency to the security categories that
                matter. No guessing — if you don't use Stripe, Snitch
                doesn't scan for Stripe issues.
              </p>
              <div className="mt-4">
                <StaticTerminal title="stack detection">
                  <div className="space-y-1">
                    <p style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)" }}>{">"}</span>{" "}
                      Reading package.json...
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)" }}>{">"}</span>{" "}
                      Found <span style={{ color: "var(--accent)" }}>stripe</span>{" "}
                      → Cat 13 (Stripe Security)
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)" }}>{">"}</span>{" "}
                      Found <span style={{ color: "var(--accent)" }}>@prisma/client</span>{" "}
                      → Cats 1, 17, 25, 28 (SQL, DB, N+1, AuthZ)
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)" }}>{">"}</span>{" "}
                      Found <span style={{ color: "var(--accent)" }}>openai</span>{" "}
                      → Cat 15 (AI API Security)
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)" }}>{">"}</span>{" "}
                      Found <span style={{ color: "var(--accent)" }}>@clerk/nextjs</span>{" "}
                      → Cats 7, 14, 39 (Rate Limit, Auth Provider, Tokens)
                    </p>
                    <p className="mt-2" style={{ color: "var(--success-text, var(--success))" }}>
                      <span style={{ color: "var(--success)" }}>+</span>{" "}
                      Selected 12 categories based on your stack
                    </p>
                  </div>
                </StaticTerminal>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="timeline-phase">
              <div className="timeline-dot">3</div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Search → Read → Verify
              </h3>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Most scanners match a pattern and call it a finding. Snitch
                makes your AI read the actual file, check the context, and
                decide if it's real. False positives get dismissed with a
                reason — only confirmed issues make the report.
              </p>
              <div className="mt-4">
                <AnimatedTerminal
                  title="search → read → verify"
                  lines={[
                    { prefix: ">", text: "Searching for hardcoded secrets...", delay: 600 },
                    { prefix: ">", text: 'Grep: found 3 matches for API key patterns', delay: 700 },
                    { prefix: ">", text: "Reading src/lib/stripe.ts:14...", delay: 500 },
                    { prefix: "!", text: "CONFIRMED — secret key assigned to variable in source", delay: 800 },
                    { prefix: ">", text: "Reading tests/helpers/mock-stripe.ts:8...", delay: 500 },
                    { prefix: "+", text: "DISMISSED — pattern found in test file, not production code", delay: 800 },
                    { prefix: ">", text: "Reading .env.example:3...", delay: 500 },
                    { prefix: "+", text: "DISMISSED — placeholder value in example config", delay: 700 },
                    { prefix: ">", text: "Category 3: 1 confirmed finding, 2 dismissed", delay: 600 },
                  ]}
                />
              </div>
            </div>

            {/* Phase 4 */}
            <div className="timeline-phase">
              <div className="timeline-dot">4</div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Report
              </h3>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Every finding includes the exact file, line number, code
                snippet, CWE ID, OWASP category, CVSS 4.0 score, what could
                happen if it's exploited, and how to fix it. Secrets are
                automatically redacted in the report output.
              </p>
              <div className="mt-4">
                <StaticTerminal title="SECURITY_AUDIT_REPORT.md">
                  <div className="space-y-3">
                    <div>
                      <p style={{ color: "var(--text-tertiary)" }}>
                        # Security Audit Report
                      </p>
                      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                        Overall Risk:{" "}
                        <span style={{ color: "var(--danger)" }}>Critical</span>
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>
                        Findings:{" "}
                        <span style={{ color: "var(--danger)" }}>1 Critical</span>,{" "}
                        <span style={{ color: "var(--warning)" }}>1 High</span>,
                        0 Medium, 0 Low
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>
                        Standards: CWE Top 25 (2025), OWASP Top 10 (2025), CVSS 4.0
                      </p>
                    </div>
                    <div
                      className="h-px w-full"
                      style={{ backgroundColor: "var(--border)" }}
                    />
                    <div>
                      <p style={{ color: "var(--danger)" }}>
                        ## Finding 1: Hardcoded API Secret Key
                      </p>
                      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                        Severity: Critical | CVSS 4.0: ~9.1
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>
                        CWE: CWE-798 (Hardcoded Credentials)
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>
                        OWASP: A07:2025 Authentication Failures
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>
                        File: lib/stripe.ts:14
                      </p>
                      <p className="mt-1" style={{ color: "var(--text-tertiary)" }}>
                        Evidence:
                      </p>
                      <p
                        className="rounded px-2 py-1 mt-1"
                        style={{
                          backgroundColor: "var(--bg-base)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        const stripe = new Stripe("sk_live_XXXXXXXXXXXX")
                      </p>
                      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
                        Risk: Anyone with repo access can use this key to charge
                        accounts, issue refunds, or access customer data.
                      </p>
                      <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                        Fix: Move to environment variable
                        process.env.STRIPE_SECRET_KEY
                      </p>
                    </div>
                  </div>
                </StaticTerminal>
              </div>
            </div>

            {/* Phase 5 */}
            <div className="timeline-phase">
              <div className="timeline-dot">5</div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Fix
              </h3>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                After the report, you get a post-scan menu: fix findings
                one-by-one with approval for each change, batch-fix all at
                once, or just take the report and handle it yourself.
              </p>
              <p
                className="mt-2 text-xs font-semibold"
                style={{ color: "var(--accent)" }}
              >
                The scan is read-only. It never touches your code until you
                say so.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 3. THE EVIDENCE STANDARD ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>The Evidence Standard</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Every claim backed by code. No exceptions.
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Snitch uses strict anti-hallucination rules to ensure that no
            finding gets reported without real evidence from your actual files.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left: What the evidence standard means */}
            <div className="space-y-5">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Built-in anti-hallucination rules
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                AI tools are great at generating code. They're also great at
                generating confident-sounding security findings that don't
                exist. Snitch includes a strict set of rules that force the AI
                to prove every claim against your actual source files before it
                can report anything.
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Every finding must include a file path, line number, and quoted
                code snippet. If the AI can't show you the vulnerable line, the
                finding gets dropped. Context is checked — a pattern in a test
                file or comment is not a production vulnerability.
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Secrets are automatically redacted in report output. The scan
                never modifies your files. And the methodology prioritizes
                quality — 5 real findings beat 50 false positives.
              </p>
            </div>

            {/* Right: Confirmed vs Dismissed */}
            <div className="space-y-4">
              <StaticTerminal title="confirmed vs. dismissed">
                <div className="space-y-4">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-wider mb-2"
                      style={{ color: "var(--danger)" }}
                    >
                      Confirmed finding
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--danger)" }}>!</span> src/lib/stripe.ts:14
                    </p>
                    <p
                      className="mt-1 rounded px-2 py-1"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      const stripe = new Stripe("sk_live_XXXXXXXXXXXX")
                    </p>
                    <p className="mt-1" style={{ color: "var(--text-tertiary)" }}>
                      Production file. Secret key hardcoded in source.
                      No environment variable reference. Confirmed.
                    </p>
                  </div>
                  <div
                    className="h-px w-full"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-wider mb-2"
                      style={{ color: "var(--success)" }}
                    >
                      Dismissed finding
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--success)" }}>+</span> tests/helpers/mock-stripe.ts:8
                    </p>
                    <p
                      className="mt-1 rounded px-2 py-1"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      const testKey = "sk_test_XXXXXXXXXXXX"
                    </p>
                    <p className="mt-1" style={{ color: "var(--text-tertiary)" }}>
                      Reason: Pattern found in test file, not production code.
                      Test-mode key prefix. Dismissed.
                    </p>
                  </div>
                </div>
              </StaticTerminal>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 4. WHAT IT CATCHES ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>What It Catches</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            45 categories. Zero guesswork.
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Each category comes with specific search patterns, context rules,
            and guidance on what to ignore. Click any card to see what it
            searches for vs. what it dismisses.
          </p>

          {/* Featured categories */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_CATEGORIES.map((cat) => (
              <FeaturedCategoryCard key={cat.id} cat={cat} />
            ))}
          </div>

          {/* Remaining categories by group */}
          <div className="mt-10">
            <p
              className="text-center text-xs font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              + 28 more categories
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {REMAINING_GROUPS.map((group) => (
                <div key={group.group}>
                  <p
                    className="text-[10px] uppercase tracking-wider mb-2 font-semibold"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {group.group}
                  </p>
                  {group.items.map((item) => (
                    <p
                      key={item}
                      className="text-[11px] leading-loose"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 5. BEFORE / AFTER ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>What Snitch Finds</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Toggle between the problem and the fix.
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-center text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            These are real patterns that AI coding tools produce every day.
            Click the toggle to see what's wrong and how to fix it.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BeforeAfter
              title="Hardcoded API Key"
              before={{
                label: "AI wrote this",
                lines: [
                  'import Stripe from "stripe";',
                  "",
                  "const stripe = new Stripe(",
                  '-  "sk_live_XXXXXXXXXXXXXXXXXXXX"',
                  ");",
                  "",
                  "// Your Stripe secret key is now in",
                  "// every developer's git clone, your",
                  "// CI logs, and your git history forever.",
                ],
              }}
              after={{
                label: "After fix",
                lines: [
                  'import Stripe from "stripe";',
                  "",
                  "const stripe = new Stripe(",
                  "+  process.env.STRIPE_SECRET_KEY!",
                  ");",
                  "",
                  "// Key lives in your environment, not",
                  "// your source code. Rotate it without",
                  "// a code change.",
                ],
              }}
              explanation="Anyone who can see your repo can charge your Stripe account, issue refunds, or access customer payment data."
            />

            <BeforeAfter
              title="Unverified Webhook"
              before={{
                label: "AI wrote this",
                lines: [
                  "app.post('/webhook/stripe', async (req, res) => {",
                  "-  const event = req.body;",
                  "",
                  '  if (event.type === "payment_intent.succeeded") {',
                  "    await activateSubscription(event.data);",
                  "  }",
                  "",
                  "  res.sendStatus(200);",
                  "});",
                  "// No signature verification.",
                ],
              }}
              after={{
                label: "After fix",
                lines: [
                  "app.post('/webhook/stripe', async (req, res) => {",
                  "+  const sig = req.headers['stripe-signature'];",
                  "+  const event = stripe.webhooks.constructEvent(",
                  "+    req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!",
                  "+  );",
                  "",
                  '  if (event.type === "payment_intent.succeeded") {',
                  "    await activateSubscription(event.data);",
                  "  }",
                  "  res.sendStatus(200);",
                  "});",
                ],
              }}
              explanation="Anyone can POST fake payment events to your webhook and get free subscriptions, credits, or access."
            />

            <BeforeAfter
              title="SQL Injection"
              before={{
                label: "AI wrote this",
                lines: [
                  "app.get('/users', async (req, res) => {",
                  "  const search = req.query.name;",
                  "",
                  "-  const users = await db.query(",
                  '-    `SELECT * FROM users WHERE name = \'${search}\'`',
                  "  );",
                  "",
                  "  res.json(users);",
                  "});",
                  "// User input goes straight into SQL.",
                ],
              }}
              after={{
                label: "After fix",
                lines: [
                  "app.get('/users', async (req, res) => {",
                  "  const search = req.query.name;",
                  "",
                  "+  const users = await db.query(",
                  "+    'SELECT * FROM users WHERE name = $1',",
                  "+    [search]",
                  "+  );",
                  "",
                  "  res.json(users);",
                  "});",
                ],
              }}
              explanation="A user can type a specially crafted search term that dumps your entire database, deletes tables, or bypasses authentication."
            />

            <BeforeAfter
              title="Session Never Expires"
              before={{
                label: "AI wrote this",
                lines: [
                  "const session = await lucia.createSession(userId, {});",
                  "",
                  "const cookie = lucia.createSessionCookie(",
                  "  session.id",
                  ");",
                  "",
                  "// Default config: session lives forever.",
                  "// No maxAge, no absolute timeout,",
                  "-// no idle timeout. Once logged in,",
                  "-// always logged in.",
                ],
              }}
              after={{
                label: "After fix",
                lines: [
                  "const session = await lucia.createSession(userId, {",
                  "+  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)",
                  "});",
                  "",
                  "const cookie = lucia.createSessionCookie(",
                  "  session.id",
                  ");",
                  "",
                  "+// Session expires in 7 days.",
                  "+// Idle timeout handled by middleware.",
                ],
              }}
              explanation="If someone steals a session cookie (via XSS, shared computer, stolen laptop), they have permanent access to that account."
            />

            <BeforeAfter
              title="Prompt Injection"
              before={{
                label: "AI wrote this",
                lines: [
                  "app.post('/chat', async (req, res) => {",
                  "  const userMessage = req.body.message;",
                  "",
                  "-  const response = await openai.chat.completions.create({",
                  "-    messages: [",
                  '-      { role: "system", content:',
                  '-        `You are a helper for ${userMessage}` },',
                  "-    ],",
                  "-  });",
                  "  // User input is part of the system prompt.",
                ],
              }}
              after={{
                label: "After fix",
                lines: [
                  "app.post('/chat', async (req, res) => {",
                  "  const userMessage = req.body.message;",
                  "",
                  "+  const response = await openai.chat.completions.create({",
                  "+    messages: [",
                  '+      { role: "system", content:',
                  '+        "You are a helpful assistant." },',
                  '+      { role: "user", content: userMessage },',
                  "+    ],",
                  "+  });",
                ],
              }}
              explanation="User input in the system prompt lets attackers override your AI's instructions, exfiltrate data, or manipulate behavior."
            />

            <BeforeAfter
              title="IDOR — Accessing Other Users' Data"
              before={{
                label: "AI wrote this",
                lines: [
                  "app.get('/api/orders/:id', auth, async (req, res) => {",
                  "-  const order = await db.orders.findUnique({",
                  "-    where: { id: req.params.id }",
                  "-  });",
                  "",
                  "  res.json(order);",
                  "});",
                  "",
                  "// Authenticated, but no ownership check.",
                  "// Change the ID, get anyone's order.",
                ],
              }}
              after={{
                label: "After fix",
                lines: [
                  "app.get('/api/orders/:id', auth, async (req, res) => {",
                  "+  const order = await db.orders.findUnique({",
                  "+    where: {",
                  "+      id: req.params.id,",
                  "+      userId: req.user.id",
                  "+    }",
                  "+  });",
                  "",
                  "+  if (!order) return res.status(404).end();",
                  "  res.json(order);",
                  "});",
                ],
              }}
              explanation="Any logged-in user can view, modify, or delete any other user's data just by changing the ID in the URL."
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 6. THE MCP SERVER ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>The MCP Server</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            The skill file is the methodology.
            <br />
            The MCP server is the backend that enriches it.
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Custom rules, semantic search across your rule library, and project
            memory that persists across sessions. Connect any MCP-compatible AI
            agent — your code never touches our servers.
          </p>

          {/* Sub-section A: The 8 tools */}
          <div className="mt-12">
            <h3
              className="text-sm font-semibold text-center mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              8 tools your AI agent can call
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MCP_TOOLS.map((tool) => (
                <MCPToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          </div>

          {/* Sub-section B: Demo terminal */}
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnimatedTerminal
              title="AI agent — MCP audit"
              lines={[
                { prefix: ">", text: "Calling start-audit(scanType: 'quick')", delay: 600 },
                { prefix: ">", text: "MCP returned: methodology + 12 categories", delay: 800 },
                { prefix: ">", text: "Calling detect-stack(package.json)", delay: 600 },
                { prefix: ">", text: "Stack: Next.js, Prisma, OpenAI", delay: 500 },
                { prefix: ">", text: "Recommended: +Cat 15 (AI APIs), +Cat 17 (DB)", delay: 700 },
                { prefix: ">", text: "Scanning with local Grep/Read tools...", delay: 1000 },
                { prefix: "!", text: "CRITICAL  src/ai/chat.ts:23 — user input in prompt", delay: 800 },
                { prefix: "+", text: "PASS  Database queries use parameterized bindings", delay: 500 },
                { prefix: ">", text: "Calling check-pattern on suspicious snippet...", delay: 700 },
                { prefix: "!", text: "HIGH  src/ai/chat.ts:45 — AI output rendered as raw HTML", delay: 800 },
                { prefix: ">", text: "Calling add-memory to store findings...", delay: 600 },
                { prefix: "+", text: "Audit complete: 2 findings, 10 passed", delay: 500 },
              ]}
            />

            {/* Sub-section C: Custom Rules & Memory */}
            <div className="space-y-6">
              <div
                className="rounded-lg border p-5"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Custom Rules
                </h4>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Create org-specific security rules with regex patterns,
                  language and framework filters, and severity levels. Rules
                  get vectorized automatically for semantic search — so your AI
                  can find relevant rules by meaning, not just keywords.
                </p>
              </div>
              <div
                className="rounded-lg border p-5"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Project Memory
                </h4>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Store findings, decisions, and context across audit sessions.
                  Query past context semantically — ask "what auth issues were
                  found before?" and get relevant history. Your next scan has
                  memory of the last.
                </p>
              </div>
              <div
                className="rounded-lg border p-5"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Device Pairing
                </h4>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Connect your CLI tools to the MCP server via a pairing code
                  at{" "}
                  <Link to="/pair" className="link" style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>
                    snitch.live/pair
                  </Link>
                  . One-time setup, then your AI agent has access to custom
                  rules and memory on every scan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 7. VALIDATION SIGNALS ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Beyond Vulnerabilities</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Can your project stay secure?
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Quick Scan doesn't just find vulnerabilities — it checks whether
            your project has the infrastructure to stay secure. Six supplementary
            validation signals assess your testing, CI, monitoring, and
            resilience posture.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {VALIDATION_SIGNALS.map((vs) => (
              <span
                key={vs.name}
                className="inline-block rounded border px-3 py-1.5 text-xs"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                {vs.name}
              </span>
            ))}
          </div>
          <p
            className="mt-4 text-center text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Each signal checks a different dimension of your project's security
            posture — from test coverage to runtime guardrails.
          </p>
        </div>
      </section>

      <Divider />

      {/* ─── 8. WORKS WITH ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>Works With</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Your tools. Your workflow.
          </h2>

          <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-5">
            {(
              [
                { name: "Claude Code", icon: SiClaude },
                { name: "Gemini CLI", icon: SiGooglegemini },
                { name: "Codex CLI", icon: SiAnthropic },
                { name: "Copilot CLI", icon: SiGithubcopilot },
                { name: "Cursor", icon: SiCursor },
                { name: "Windsurf", icon: SiWindsurf },
                { name: "Cline", icon: null },
                { name: "Kilo Code", icon: null },
                { name: "Roo Code", icon: null },
                { name: "Zed", icon: SiZedindustries },
                { name: "GitHub Copilot", icon: SiGithubcopilot },
                { name: "Aider", icon: null },
                { name: "Continue.dev", icon: null },
                { name: "OpenCode", icon: null },
                { name: "Antigravity", icon: null },
              ] as { name: string; icon: any }[]
            ).map((tool) => {
              const IconComp = tool.icon;
              return (
                <div
                  key={tool.name}
                  className="flex flex-col items-center gap-2 rounded-lg border p-3"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-surface)",
                  }}
                >
                  {IconComp ? (
                    <IconComp size={24} color="var(--text-secondary)" />
                  ) : (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold"
                      style={{
                        backgroundColor: "var(--bg-raised)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {tool.name.charAt(0)}
                    </span>
                  )}
                  <span
                    className="text-[10px] text-center leading-tight"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {tool.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-8 max-w-2xl grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                CLI tools
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Drop the skill file into your project directory
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                IDE extensions
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Add as custom instructions or attach the skill file
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                MCP-compatible
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Direct server connection for full API access
              </p>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 9. PRICING ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>Pricing</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Straightforward pricing. No surprises.
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-center text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            MCP-first subscriptions. Custom rules, semantic search, and memory
            across sessions — pick the tier that fits your team.
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Base */}
            <div
              className="flex flex-col justify-between rounded-lg border p-6"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-primary)" }}
                >
                  Base
                </span>
                <p className="mt-3">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    $12.99
                  </span>
                  <span
                    className="ml-1 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    /mo
                  </span>
                </p>
                <p
                  className="mt-3 text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  20 core security categories, custom rules, and project memory.
                  Everything you need to start scanning.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {[
                    "20 core security categories",
                    "2,000 MCP calls/month",
                    "10 rulesets",
                    "5 projects",
                    "All 8 MCP tools",
                    "Device pairing",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: "var(--success)" }}>+</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/login"
                className="btn-secondary mt-6 block rounded px-4 py-2.5 text-center text-xs font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div
              className="flex flex-col justify-between rounded-lg border-2 p-6"
              style={{
                borderColor: "var(--accent)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Pro
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-text)",
                    }}
                  >
                    Popular
                  </span>
                </div>
                <p className="mt-3">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    $19.99
                  </span>
                  <span
                    className="ml-1 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    /mo
                  </span>
                </p>
                <p
                  className="mt-3 text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  35 categories covering core + modern stack. More MCP calls,
                  more rulesets, more projects.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {[
                    "35 categories (core + modern stack)",
                    "5,000 MCP calls/month",
                    "25 rulesets",
                    "10 projects",
                    "Semantic vector search",
                    "Full project memory",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: "var(--success)" }}>+</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/login"
                className="btn-primary mt-6 block rounded px-4 py-2.5 text-center text-xs font-medium"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Enterprise */}
            <div
              className="flex flex-col justify-between rounded-lg border p-6"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-primary)" }}
                >
                  Enterprise
                </span>
                <p className="mt-3">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    $79.99
                  </span>
                  <span
                    className="ml-1 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    /mo
                  </span>
                </p>
                <p
                  className="mt-3 text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  All 45 categories, unlimited everything. Built for teams
                  that need compliance and governance coverage.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {[
                    "All 45 security categories",
                    "Unlimited MCP calls",
                    "Unlimited rulesets",
                    "Unlimited projects",
                    "5 seats included",
                    "Compliance & governance",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: "var(--success)" }}>+</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/dashboard/billing"
                className="btn-secondary mt-6 block rounded px-4 py-2.5 text-center text-xs font-medium"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 10. HONEST LIMITS ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Honest Limits</SectionLabel>
          <h2
            className="mt-3 text-center text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            What Snitch is not.
          </h2>
          <div
            className="mx-auto mt-8 max-w-xl space-y-3 text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {[
              "Snitch is not a replacement for a professional penetration test. It's a first pass that catches the things most teams miss.",
              "Snitch does not guarantee your code is secure. No tool can. It finds issues — what you do with the findings is up to you.",
              "Snitch does not run in production. It's a development-time audit tool. It reads your code and reports what it finds.",
              "Findings depend on the AI model powering your coding tool. Better models produce better results. Snitch provides the methodology; the model does the reasoning.",
            ].map((text, i) => (
              <p key={i} className="flex gap-2">
                <span
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  —
                </span>
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── 11. FINAL CTA ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-lg font-bold leading-relaxed sm:text-xl"
            style={{ color: "var(--text-primary)" }}
          >
            Your AI builds it. Snitch reviews it.
            <br />
            Ship knowing what's in there.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="btn-primary inline-block rounded px-6 py-2.5 text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="px-4 py-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            snitch.live
          </span>
          <div className="flex gap-4 text-xs">
            <Link
              to="/terms"
              className="link"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="link"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Privacy
            </Link>
            <Link
              to="/plugin"
              className="link"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Plugin
            </Link>
            <Link
              to="/pair"
              className="link"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Pair Device
            </Link>
            <Link
              to="/dashboard"
              className="link"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
