```
   _____ _   ____________________  __
  / ___// | / /  _/_  __/ ____/ / / /
  \__ \/  |/ // /  / / / /   / /_/ /
 ___/ / /|  // /  / / / /___/ __  /
/____/_/ |_/___/ /_/  \____/_/ /_/
```

An open source security audit skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Codex CLI](https://github.com/openai/codex), [OpenCode](https://github.com/opencode-ai/opencode), [Antigravity](https://github.com/neplextech/antigravity), and [Cursor](https://www.cursor.com/).

Here's the thing about security scanners: they're terrible. They pattern-match `api_key = "..."` and flag it even when it's a comment, a test placeholder, or literally a detection pattern inside another security tool. You get 500 findings, 499 of them are garbage, and by finding 12 you've stopped reading. This is especially brutal when you're vibe coding - your AI is writing fast, you're shipping fast, and nobody's actually checking what went out the door. Your AI built it, shipped it, and nobody reviewed it. Traditional scanners make it worse because they train you to ignore their output.

Snitch is different. It gives your AI deep knowledge of what to look for across 32 security categories, but it **requires evidence for every single claim**. No file read? Not a finding. Can't quote the exact line? Not a finding. Didn't check if there's sanitization two lines above? Not a finding.

The result: you get a report where everything in it is real. Your AI writes the code, Snitch reviews it, you ship with confidence. The agentic workflow, complete.

## Install

Pick your weapon. Snitch works everywhere:

### Claude Code

```
/plugin marketplace add naieum/Snitch
/plugin install snitch@naieum-Snitch
```

That's it. Two commands. First one registers the marketplace, second one installs the plugin.

### Gemini CLI

```bash
gemini extensions install https://github.com/naieum/Snitch.git
```

One command. Done.

### Codex CLI

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/agents/skills/snitch ~/.codex/skills/snitch
```

Clone it, copy the skill to your global skills directory. If you'd rather scope it to a single project, use `.agents/skills/snitch` instead of `~/.codex/skills/snitch`.

### OpenCode

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch ~/.config/opencode/skills/snitch
```

Clone, copy, done. That's a global install - if you want it scoped to one project, use `.opencode/skills/snitch` instead.

### Antigravity

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch ~/.gemini/antigravity/skills/snitch
```

Same deal. Global install. For a single project, drop it in `.agent/skills/snitch` instead.

### Cursor

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch .cursor/skills/snitch
```

Project-level only. Drop it in `.cursor/skills/` and Cursor picks it up.

---

Then run `/snitch` in any project.

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

You'll get an interactive menu:

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

**Quick Scan** is what you want 90% of the time. It reads your `package.json`, figures out you're using Prisma and Stripe and Resend, and only scans the categories that matter. No wasted tokens checking for Twilio issues in a project that doesn't use Twilio.

You can also skip the menu entirely:

```
/snitch --categories=1,2,3,13
/snitch --diff
```

### After the Scan

Once Snitch finishes, it'll ask you what to do next:

- **Run another scan** - go back to the menu, audit more categories
- **Fix one by one** - walk through each finding, approve or skip fixes individually
- **Fix all (batch)** - apply every fix at once
- **Done** - exit

## What It Checks

### 32 Categories

**Core Security** - SQL Injection, XSS, Hardcoded Secrets, Authentication, SSRF, Rate Limiting, CORS, Cryptography, Dangerous Patterns, Cloud Security, Data Exposure

**Modern Stack** - Supabase (RLS, service role keys), Stripe (webhook verification, key exposure), Auth Providers (Clerk/Auth0/NextAuth middleware), AI APIs (OpenAI/Anthropic key exposure, prompt injection), Email (Resend/SendGrid spam relay), Database (Prisma raw queries), Redis/Upstash (token exposure), Twilio (SMS pumping)

**Compliance** - HIPAA (PHI in logs, unencrypted health data), SOC 2 (audit trails, MFA, password policy), PCI-DSS (card data storage, CVV retention), GDPR (consent, data deletion, data export)

**Performance** - Memory Leaks (event listeners, intervals, unbounded caches), N+1 Queries (ORM queries in loops, missing eager loading), Performance Problems (sync I/O in handlers, missing indexes, unbounded queries, full library imports)

**Infrastructure & Supply Chain** - Dependency Vulnerabilities (missing lockfiles, outdated packages, typosquatting), Authorization/IDOR (missing ownership checks, predictable IDs), File Upload Security (path traversal, missing validation), Input Validation/ReDoS (prototype pollution, catastrophic backtracking), CI/CD Pipeline Security (secret exposure, expression injection, unpinned actions), Security Headers (CSP, HSTS, clickjacking protection)

## How It Actually Works

Snitch isn't just a list of regex patterns. For every category, it knows:

1. **What to search for** - the grep patterns and file globs
2. **What's actually vulnerable** - vs. what just looks scary
3. **What context to check** - is this test code? is there validation nearby? is it server-only?

Every finding in the report includes the file path, line number, exact code snippet, why it's vulnerable, and how to fix it. If Snitch can't prove it with evidence from your actual codebase, it doesn't report it.

## Want to See It in Action?

We built [vibeHealth](https://github.com/naieum/vibeHealth) - a deliberately vulnerable telehealth app that fails all 31 applicable security categories. It's a full Next.js 14 app with auth, payments, messaging, AI symptom checking, the works. Every page has real UI, every API route works. It just happens to be horrifically insecure on purpose.

```bash
git clone https://github.com/naieum/vibeHealth.git
cd vibeHealth
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Then open your CLI of choice in the vibeHealth directory and run `/snitch`. Watch it find everything.

It's a good way to see what Snitch reports look like before running it on your actual codebase.

## License

MIT
