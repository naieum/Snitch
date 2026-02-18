```
   _____ _   ____________________  __
  / ___// | / /  _/_  __/ ____/ / / /
  \__ \/  |/ // /  / / / /   / /_/ /
 ___/ / /|  // /  / / / /___/ __  /
/____/_/ |_/___/ /_/  \____/_/ /_/
```

An open source security audit skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Codex CLI](https://github.com/openai/codex), [OpenCode](https://github.com/opencode-ai/opencode), [Antigravity](https://github.com/neplextech/antigravity), and [Cursor](https://www.cursor.com/).

---

Security scanners are cooked. Like actually broken in a way that makes your codebase *less* safe because they train you to ignore their output.

You get 500 findings. You read 12. By finding 8 you're skimming. By finding 20 you've closed the tab. And half of them are `api_key = "YOUR_KEY_HERE"` in a comment or a test fixture that's been there since the repo was initialized. The scanner doesn't know. It doesn't care. It found the pattern. That's its whole job.

This is fine when a human wrote all the code and roughly knows what's in it. It is *not* fine when your AI wrote 80% of it in the last three weeks and you haven't read most of it. Which is where we all are now.

Snitch is different. It gives your AI deep knowledge of what to actually look for across 32 security categories, but every single finding requires evidence. No file read, no finding. Can't quote the exact line, no finding. Didn't verify there's no sanitization two lines above it, no finding. The rule is simple: if you can't prove it with code from your actual codebase, it doesn't go in the report.

The result is a report where everything in it is real. Your AI builds the thing, Snitch reviews the thing, you ship with confidence. The loop closes.

## Install

### Claude Code

```
/plugin marketplace add naieum/Snitch
/plugin install snitch@naieum-Snitch
```

Two commands. That's it.

### Gemini CLI

```bash
gemini extensions install https://github.com/naieum/Snitch.git
```

### Codex CLI

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/agents/skills/snitch ~/.codex/skills/snitch
```

Global install. If you want it scoped to one project, use `.agents/skills/snitch` instead.

### OpenCode

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch ~/.config/opencode/skills/snitch
```

For a single project, use `.opencode/skills/snitch`.

### Antigravity

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch ~/.gemini/antigravity/skills/snitch
```

Single project: `.agent/skills/snitch`.

### Cursor

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch .cursor/skills/snitch
```

Project-level only.

---

<details>
<summary>Updating / Uninstalling</summary>

**Claude Code:**
```
/plugin marketplace update naieum-Snitch
/plugin uninstall snitch@naieum-Snitch
```

**Gemini CLI:**
```bash
gemini extensions update snitch
gemini extensions uninstall snitch
```

**Codex CLI:**
```bash
rm -rf ~/.codex/skills/snitch
```

**OpenCode:**
```bash
rm -rf ~/.config/opencode/skills/snitch
```

**Antigravity:**
```bash
rm -rf ~/.gemini/antigravity/skills/snitch
```

**Cursor:**
```bash
rm -rf .cursor/skills/snitch
```

</details>

## Usage

```
/snitch
```

You'll get a menu:

```
[1] Quick Scan          - Auto-detects your stack, picks relevant checks
[2] Web Security        - SQLi, XSS, CORS, SSRF, dangerous patterns
[3] Secrets & Auth      - Hardcoded keys, auth issues, rate limiting
[4] Modern Stack        - Stripe, Supabase, OpenAI, Resend, Twilio, etc.
[5] Compliance          - HIPAA, SOC 2, PCI-DSS, GDPR
[6] Performance         - Memory leaks, N+1 queries, performance issues
[7] Infrastructure      - Dependencies, IDOR, file uploads, CI/CD, headers
[8] Full System         - All 32 categories (thorough but uses more tokens)
[9] Custom Selection    - Pick specific categories by number or name
[10] Changed Files Only - Git diff mode, great for pre-commit
```

Just use Quick Scan. Seriously. It reads your `package.json`, sees you're using Prisma and Stripe and Resend, and only runs the checks that matter for your actual stack. No wasted tokens auditing Twilio SMS pumping vectors in a project that doesn't have a phone number anywhere in it.

You can also skip the menu:

```
/snitch --categories=1,2,3,13
/snitch --diff
```

`--diff` is genuinely underrated. Run it before every commit. Takes maybe 30 seconds on a normal diff and catches the stuff that slips through when you're in flow state and merging fast.

### After the Scan

Snitch asks what you want to do with the findings:

- **Run another scan** - go back to the menu, audit more categories
- **Fix one by one** - walk through each finding, approve or skip fixes individually
- **Fix all (batch)** - apply everything at once
- **Done** - exit

## What It Checks

### 32 Categories

**Core Security** — SQL Injection, XSS, Hardcoded Secrets, Authentication, SSRF, Rate Limiting, CORS, Cryptography, Dangerous Patterns, Cloud Security, Data Exposure

**Modern Stack** — Supabase (RLS, service role keys), Stripe (webhook verification, key exposure), Auth Providers (Clerk/Auth0/NextAuth middleware), AI APIs (OpenAI/Anthropic key exposure, prompt injection), Email (Resend/SendGrid spam relay), Database (Prisma raw queries), Redis/Upstash (token exposure), Twilio (SMS pumping)

**Compliance** — HIPAA (PHI in logs, unencrypted health data), SOC 2 (audit trails, MFA, password policy), PCI-DSS (card data storage, CVV retention), GDPR (consent, data deletion, data export)

**Performance** — Memory Leaks (event listeners, intervals, unbounded caches), N+1 Queries (ORM queries in loops, missing eager loading), Performance Problems (sync I/O in handlers, missing indexes, unbounded queries, full library imports)

**Infrastructure & Supply Chain** — Dependency Vulnerabilities (missing lockfiles, outdated packages, typosquatting), Authorization/IDOR (missing ownership checks, predictable IDs), File Upload Security (path traversal, missing validation), Input Validation/ReDoS (prototype pollution, catastrophic backtracking), CI/CD Pipeline Security (secret exposure, expression injection, unpinned actions), Security Headers (CSP, HSTS, clickjacking protection)

## How It Actually Works

It's not regex. For every category, Snitch knows what to grep for, what patterns are actually dangerous vs. what just looks scary, and what context to check before calling something a finding. Is this test code? Is there validation two lines above? Is this server-only or could it run client-side? It checks.

Every finding you get includes the file path, line number, exact code snippet, why it's vulnerable, and how to fix it. If it can't prove it with evidence from your codebase, it doesn't report it. That's the whole design.

## See It In Action

We built [vibeHealth](https://github.com/naieum/vibeHealth) — a deliberately vulnerable telehealth app that fails all 31 applicable security categories. Full Next.js 14 app with auth, payments, messaging, AI symptom checking. Every page has real UI, every API route works. It's just catastrophically insecure on purpose.

Clone it, open your CLI in the directory, run `/snitch`. Watch it find everything. Good way to see what the reports look like before you run it on something you actually care about.

## License

MIT
