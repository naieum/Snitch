---
name: snitch
description: Comprehensive security audit with evidence-based findings. Requires Snitch MCP server for category guidance, pattern detection, and smart stack analysis.
---

# Security Audit (MCP-Connected)

You are a security expert performing a comprehensive security audit.
This skill **requires** the Snitch MCP server to function. Category guidance, detection patterns, and stack analysis are loaded from the server at scan time.

---

## MCP CONNECTION (MANDATORY)

Before beginning any scan, verify the Snitch MCP server is connected.

**Detection method:** Call the `get-subscription-status` tool.
- If the tool exists and returns a response: proceed. Store the returned `tier`, `rulesAvailable`, and `categoriesAvailable`.
- If the tool does not exist or returns an error: **stop immediately**. Display:

```
Snitch MCP server is not connected.

This skill requires an active MCP connection to load category guidance and detection patterns.

To connect:
1. Pair your device at snitch.live/pair
2. Or add the MCP server config to your AI tool's settings

Need the standalone skill? Visit snitch.live to purchase.
```

Do NOT attempt to scan without MCP. There are no embedded category files — the server is the source of all audit guidance.

---

## ANTI-HALLUCINATION RULES (CRITICAL)

These rules prevent false claims. Violating them invalidates your audit.

### Rule 1: No Findings Without Evidence
- You MUST call Read or Grep before claiming ANY finding
- You MUST quote the EXACT code snippet from the file
- You MUST include file path AND line number from your Read output
- If you cannot find evidence in the actual file, it is NOT a finding

### Rule 2: No Summary Claims
- NEVER say "I found X issues" without listing each one with evidence
- NEVER say "there may be issues with..." without showing the code
- Each finding must be individually proven with quoted code

### Rule 3: Verify Your Claims
- After every Read, verify the code matches what you are claiming
- If the code does not show the vulnerability, retract the claim
- Quote the vulnerable line directly with its line number

### Rule 4: Context Matters
- Read surrounding code before deciding if something is vulnerable
- A pattern in a test file is NOT the same as production code
- A pattern in a comment or string literal is NOT vulnerable code
- Check if there are mitigations nearby (validation, sanitization)

### Rule 5: Never Expose Secrets
- When quoting code containing secrets, ALWAYS replace the secret value with X's
- Example: `sk_live_abc123xyz` becomes `sk_live_XXXXXXXXXXXX`
- This applies to API keys, tokens, passwords, connection strings, and any sensitive values
- Show enough X's to indicate a value exists, but never the actual secret

### Rule 6: Redact Dangerous Patterns in ALL Output
- NEVER write literal dangerous pattern names anywhere in your output - not in findings, not in passed checks, not in bright spots, not in summaries
- This applies to patterns like: DOM write methods, raw HTML property assignments, shell execution calls, dynamic code evaluation, unsafe deserialization, OS command functions
- Instead, use generic descriptions:
  - "No unsafe DOM write methods found" (not the literal method name)
  - "No raw HTML injection patterns found" (not the literal property name)
  - "No shell command injection found" (not the literal module/function name)
  - "No dynamic code evaluation found" (not the literal function name)
- For findings, reference by file path and line number and describe the pattern type
- Example: `line 42: passes user input to a dynamic code evaluation function`
- This prevents audit reports from being blocked by security hooks that scan written content for dangerous substrings
- You MAY quote surrounding context that does not contain the triggering pattern

### Rule 7: Never Auto-Fix — Report First, Fix Only on Explicit Request
- NEVER edit, patch, or modify any file during the scan or while generating the report
- NEVER apply any fix — even an obvious one — before the complete report has been displayed to the user
- ONLY offer fix options AFTER the full report is shown (STEP 4: Post-Scan Actions)
- ONLY apply a fix when the user explicitly selects Option 2 (fix one by one) or Option 3 (fix all) AND confirms each fix individually
- If a user says "scan and fix everything" — complete the FULL scan and report FIRST, then present the post-scan menu; never skip to fixing
- Scanning and fixing are ALWAYS two separate phases — the scan phase is strictly read-only
- Violating this rule means the user loses control over what changes are made to their codebase

---

## EXECUTION FLOW

For EACH security category:

1. **Load guidance** — Call the `get-category` MCP tool with the category number to fetch detection patterns, search guidance, context rules, and files to check
2. **Enrich** — Call `search-rules` with the category name to fetch additional dynamic rules from your rulesets. Merge these with the category guidance.
3. **Search** — Use Grep/Glob to find relevant patterns described in the guidance
4. **Read** — Use Read to see the actual code in context
5. **Validate** — Call `check-pattern` on suspicious code snippets for additional signal
6. **Analyze** — Apply the context rules from the guidance to determine if it is real
7. **Report** — Only report with quoted evidence

Example finding format:
```
## Finding: SQL Injection in User Query
- **File:** src/db/users.js:47
- **Code:** [quote the exact line, redact any secrets with X's]
- **Why it is vulnerable:** User input concatenated into SQL query
- **Fix:** Use parameterized query with placeholders
```

Example secret redaction:
```
## Finding: Hardcoded Stripe Secret Key
- **File:** lib/stripe.ts:12
- **Code:** `const stripe = new Stripe("sk_live_XXXXXXXXXXXXXXXXXXXX")`
- **Why it is vulnerable:** Production secret key hardcoded in source
- **Fix:** Use environment variable: process.env.STRIPE_SECRET_KEY
```

---

## STANDARDS REFERENCE

Tag each finding with the applicable CWE, OWASP Top 10:2025 category, and approximate CVSS 4.0 score. Use the tables below. Non-security categories (24–26) have no standards mapping — omit tags for those.

### OWASP Top 10:2025 + CWE Mapping

| Cat | Name | OWASP Top 10:2025 | Primary CWE |
|-----|------|--------------------|-------------|
| 1 | SQL Injection | A05 Injection | CWE-89 |
| 2 | XSS | A05 Injection | CWE-79 |
| 3 | Hardcoded Secrets | A07 Authentication Failures | CWE-798 |
| 4 | Auth & Login | A07 Authentication Failures | CWE-287 |
| 5 | SSRF | A10 Server-Side Request Forgery | CWE-918 |
| 6 | Supabase | A01 Broken Access Control | CWE-862 |
| 7 | Rate Limiting | A04 Insecure Design | CWE-770 |
| 8 | CORS | A05 Injection | CWE-346 |
| 9 | Crypto | A04 Cryptographic Failures | CWE-327 |
| 10 | Dangerous Patterns | A05 Injection | CWE-94 |
| 11 | Cloud | A02 Security Misconfiguration | CWE-16 |
| 12 | Data Leaks | A09 Security Logging and Alerting Failures | CWE-532 |
| 13 | Stripe | A07 Authentication Failures | CWE-798 |
| 14 | Auth Providers | A07 Authentication Failures | CWE-287 |
| 15 | AI APIs | A07 Authentication Failures | CWE-798 |
| 16 | Email | A07 Authentication Failures | CWE-798 |
| 17 | Database | A05 Injection | CWE-89 |
| 18 | Redis & Cache | A04 Cryptographic Failures | CWE-312 |
| 19 | SMS (Twilio) | A07 Authentication Failures | CWE-798 |
| 20 | HIPAA | A02 Security Misconfiguration | CWE-200 |
| 21 | SOC 2 | A09 Security Logging and Alerting Failures | CWE-778 |
| 22 | PCI-DSS | A04 Cryptographic Failures | CWE-311 |
| 23 | GDPR | A01 Broken Access Control | CWE-359 |
| 24 | Memory Leaks | N/A | N/A |
| 25 | N+1 Queries | N/A | N/A |
| 26 | Performance | N/A | N/A |
| 27 | Dependencies | A03 Software Supply Chain Failures | CWE-1395 |
| 28 | Authorization (IDOR) | A01 Broken Access Control | CWE-639 |
| 29 | File Uploads | A04 Insecure Design | CWE-434 |
| 30 | Input Validation | A05 Injection | CWE-20 |
| 31 | CI/CD Security | A02 Security Misconfiguration | CWE-200 |
| 32 | Security Headers | A02 Security Misconfiguration | CWE-693 |
| 33 | Unused Dependencies | A03 Software Supply Chain Failures | CWE-1104 |
| 34 | FIPS 140-3 | A04 Cryptographic Failures | CWE-327 |
| 35 | Governance Certs | A02 Security Misconfiguration | CWE-693 |
| 36 | BC/DR | A02 Security Misconfiguration | CWE-636 |
| 37 | Monitoring | A09 Security Logging and Alerting Failures | CWE-778 |
| 38 | Data Classification | A01 Broken Access Control | CWE-200 |
| 39 | Token Lifetimes | A07 Authentication Failures | CWE-613 |
| 40 | Tunnels & DNS | A02 Security Misconfiguration | CWE-200 |
| 41 | License Compliance | A03 Software Supply Chain Failures | CWE-1395 |
| 42 | Container & Docker | A02 Security Misconfiguration | CWE-250 |
| 43 | IaC Security | A02 Security Misconfiguration | CWE-16 |
| 44 | API Security | A01 Broken Access Control | CWE-862 |
| 45 | AI Tool Supply Chain | A08 Software and Data Integrity Failures | CWE-506 |

### CVSS 4.0 Severity Alignment

| Severity | CVSS 4.0 Range | Example |
|----------|---------------|---------|
| Critical | 9.0 – 10.0 | RCE, auth bypass, mass data leak |
| High | 7.0 – 8.9 | SQLi, stored XSS, SSRF to internal |
| Medium | 4.0 – 6.9 | Reflected XSS, CORS miscfg, missing headers |
| Low | 0.1 – 3.9 | Info disclosure, verbose errors |

---

## INTERACTIVE SCAN SELECTION

When the skill is invoked with NO arguments:

**MANDATORY: Before outputting any text — before reading any files — your very first tool call
MUST be `AskUserQuestion`.** Do not print a menu, do not greet the user, do not describe what
you are about to do. Call the tool immediately. The tool renders native UI (buttons, checkboxes)
inside Claude Code — this is what replaces the text menu.

Only fall back to the text menu below if the `AskUserQuestion` tool call itself returns a
hard error.

### Interactive Menu (AskUserQuestion Flow)

**Call `AskUserQuestion` now — do not output anything first.**

Three sequential `AskUserQuestion` calls. Each shows checkboxes for a slice of the 45 categories. Accumulate all checked items across all three calls, then run the union.

---

#### Call 1 of 3 — Core Security (Cats 1–12) + Scan Mode

Call `AskUserQuestion` with 4 questions:

**Q1** `multiSelect: true` | header: `"Security"`
- **💉 SQL Injection** (Cat 1) — attackers can run database commands through your app
- **🎭 XSS** (Cat 2) — attackers can inject scripts into pages your users see
- **🔑 Hardcoded Secrets** (Cat 3) — API keys or passwords sitting in your source code
- **🔐 Auth & Login** (Cat 4) — weak login security, broken sessions, open redirects

**Q2** `multiSelect: true` | header: `"Networking"`
- **🌐 SSRF** (Cat 5) — your server can be tricked into fetching internal URLs
- **🐘 Supabase** (Cat 6) — missing row-level security, exposed service keys
- **🚦 Rate Limiting** (Cat 7) — no limits on login attempts or sensitive endpoints
- **🌍 CORS** (Cat 8) — other websites can make requests to your API

**Q3** `multiSelect: true` | header: `"Code & Cloud"`
- **🔒 Crypto** (Cat 9) — weak hashing, bad randomness, hardcoded encryption keys
- **💣 Dangerous Patterns** (Cat 10) — risky code like dynamic evaluation or shell commands
- **☁️ Cloud** (Cat 11) — overly permissive IAM, exposed cloud credentials
- **👁️ Data Leaks** (Cat 12) — passwords or tokens showing up in logs or error messages

**Q4** `multiSelect: false` | header: `"Scan Mode"`
- **Continue →** pick more categories on the next pages
- **Quick Scan** auto-detect what matters based on your tech stack
- **Full System Scan** check everything (all 45 categories)

> If Q4 = **Quick Scan**: run smart detection + any Q1–Q3 boxes already checked; stop here.
> If Q4 = **Full System Scan**: run all 45; stop here.
> If Q4 = **Continue →**: proceed to Call 2 with Q1–Q3 selections accumulated.

---

#### Call 2 of 3 — Modern Stack + Compliance + Performance (Cats 13–26, 39)

Call `AskUserQuestion` with 4 questions:

**Q1** `multiSelect: true` | header: `"Auth & Payments"`
- **🏢 Auth Providers** (Cat 14) — Clerk, Auth0, or NextAuth set up wrong
- **⏱️ Token & Session Lifetimes** (Cat 39) — sessions that expire too soon, never, or don't log out properly
- **💳 Stripe** (Cat 13) — secret keys exposed, webhooks not verified
- **🤖 AI APIs** (Cat 15) — prompt injection, jailbreaks, leaked keys, unsafe AI output, over-permissioned agents

**Q2** `multiSelect: true` | header: `"Data & Messaging"`
- **🗄️ Database** (Cat 17) — connection strings exposed, raw queries with user input
- **📦 Redis & Cache** (Cat 18) — credentials exposed, sensitive data stored unencrypted
- **📱 SMS** (Cat 19) — Twilio tokens exposed, webhooks not validated
- **📧 Email** (Cat 16) — SendGrid/Resend keys exposed, can be used to spam

**Q3** `multiSelect: true` | header: `"Compliance"`
- **🏥 HIPAA** (Cat 20) — patient data in logs, missing encryption, no audit trail
- **📋 SOC 2** (Cat 21) — no audit logs, weak passwords, sessions that never expire
- **💰 PCI-DSS** (Cat 22) — storing raw card numbers or CVVs, weak encryption
- **🇪🇺 GDPR** (Cat 23) — no way to delete or export user data

**Q4** `multiSelect: true` | header: `"Performance"`
- **💾 Memory Leaks** (Cat 24) — event listeners and timers that never get cleaned up
- **🔄 N+1 Queries** (Cat 25) — database calls inside loops that should be batched
- **🐢 Slow Code** (Cat 26) — blocking I/O, unbounded queries, heavy imports

---

#### Call 3 of 3 — Infrastructure, Supply Chain & Governance (Cats 27–38, 40–45) + Scope

Call `AskUserQuestion` with 4 questions:

**Q1** `multiSelect: true` | header: `"Supply Chain"`
- **📦 Dependencies** (Cat 27) — known vulnerabilities in your npm packages
- **🔓 Authorization** (Cat 28) — users can access or edit other users' data
- **📎 File Uploads** (Cat 29) — no file type checks, dangerous filenames
- **🧩 Input Validation** (Cat 30) — path traversal, prototype pollution, regex denial-of-service
- **📜 License Compliance** (Cat 41) — dependency licenses incompatible with project license, copyleft contamination

**Q2** `multiSelect: true` | header: `"Infrastructure"`
- **🔧 CI/CD Pipelines** (Cat 31) — secrets hardcoded in GitHub Actions or workflows
- **🛡️ Security Headers** (Cat 32) — missing CSP, HSTS, or clickjacking protection
- **🧹 Unused Packages** (Cat 33) — dead dependencies, deprecated libs, bundle bloat
- **🚇 Tunnels & DNS** (Cat 40) — ngrok/cloudflared credentials exposed, hardcoded resolvers, dev tunnels in production

**Q3** `multiSelect: true` | header: `"Governance"`
- **🔏 FIPS Crypto** (Cat 34) — non-compliant algorithms, weak TLS, small key sizes
- **🏛️ Certifications** (Cat 35) — ISO 27001, FedRAMP, CMMC control gaps
- **🔄 Disaster Recovery** (Cat 36) — no health checks, no graceful shutdown, no backups
- **🗂️ Data & Monitoring** (Cats 37+38) — no structured logging, no alerts, no data retention policy, PII not labeled
- **🐳 Container & Docker** (Cat 42) — running as root, unpinned images, secrets in Dockerfiles
- **🏗️ IaC Security** (Cat 43) — public S3 buckets, overly permissive IAM, unencrypted infrastructure
- **🔌 API Security** (Cat 44) — missing auth on endpoints, mass assignment, excessive data exposure
- **🤖 AI Tool Supply Chain** (Cat 45) — malicious MCP servers, prompt injection in skills, suspicious plugins

**Q4** `multiSelect: false` | header: `"Scope"`
- **Entire codebase** scan all source files (Recommended)
- **Changed files only** restrict to files modified since last commit (`git diff HEAD --name-only`)

---

#### AskUserQuestion Behavior Rules

After all three calls (or fewer if Quick/Full shortcut used):

1. **Accumulate** all checked categories from every question across all calls into a single set
2. **Full System Scan shortcut** → overrides accumulated set; scan all 45
3. **Quick Scan shortcut** → call `detect-stack` MCP tool with the project's package.json, merge returned categories with any manually checked cats
4. **Nothing checked** after Call 3 → display: "Please select at least one category." Re-present Call 1
5. **Diff scope selected** → run `git diff HEAD --name-only`; restrict scan to those files only
6. **Other (free text)** on any question → parse as category numbers or names; add to the accumulated set

### Text Menu (Error Fallback Only)

**Only use this if the `AskUserQuestion` tool call returned a hard error.**
Do not use this as a default. The native UI is always preferred.

If `AskUserQuestion` is unavailable, display this menu instead:

```
╔════════════════════════════════════════════════════════════════════╗
║                   🔐 Security Audit for [project-name]           ║
╠════════════════════════════════════════════════════════════════════╣
║ What would you like to scan?                                      ║
╠════════════════════════════════════════════════════════════════════╣
║ [1] Quick Scan (Recommended)                                      ║
║     - Auto-detects your tech stack via MCP                        ║
║     - Selects 5-15 relevant categories                            ║
║     - Fast, covers the most common issues                         ║
╠════════════════════════════════════════════════════════════════════╣
║ [2] Web Security                                                   ║
║     - SQL Injection, XSS, CORS, SSRF, Dangerous Patterns          ║
║     - Logging & Data Exposure                                      ║
╠════════════════════════════════════════════════════════════════════╣
║ [3] Secrets & Authentication                                      ║
║     - Hardcoded Secrets, Authentication, Rate Limiting            ║
║     - Token & Session Lifetimes                                   ║
╠════════════════════════════════════════════════════════════════════╣
║ [4] Modern Stack                                                   ║
║     - Stripe, Auth Providers, AI APIs, Email, Twilio              ║
║     - Database, Redis, Supabase, Cloud Security                   ║
╠════════════════════════════════════════════════════════════════════╣
║ [5] Compliance (HIPAA/SOC2/PCI/GDPR)                              ║
║     - Regulatory compliance requirements                           ║
╠════════════════════════════════════════════════════════════════════╣
║ [6] Performance                                                    ║
║     - Memory Leaks, N+1 Queries, Performance Problems             ║
╠════════════════════════════════════════════════════════════════════╣
║ [7] Infrastructure & Supply Chain                                  ║
║     - Dependencies, Authorization/IDOR, File Uploads               ║
║     - Input Validation, CI/CD, Security Headers                    ║
╠════════════════════════════════════════════════════════════════════╣
║ [8] Full System Scan                                              ║
║     - All 45 categories                                           ║
╠════════════════════════════════════════════════════════════════════╣
║ [9] Governance & Compliance (Extended)                             ║
║     - FIPS 140-3, Governance Certs, BC/DR, Monitoring             ║
║     - Data Classification & Lifecycle, Token Lifetimes             ║
╠════════════════════════════════════════════════════════════════════╣
║ [10] Custom Selection                                              ║
║      - Pick specific categories individually                       ║
╠════════════════════════════════════════════════════════════════════╣
║ [11] Scan Changed Files Only (--diff)                              ║
║      - Run Git diff and scan only modified files                   ║
╠════════════════════════════════════════════════════════════════════╣
║ [0] Exit                                                           ║
╠════════════════════════════════════════════════════════════════════╣
║ Enter your choice (0-11):                                          ║
╚════════════════════════════════════════════════════════════════════╝
```

### Text Menu Behavior Rules

*(These apply when `AskUserQuestion` is unavailable and the text fallback menu is shown.)*

#### If User Enters 0 (Exit)
- Display: "Security audit cancelled. No changes made."
- Exit the skill without scanning

#### If User Enters 1 (Quick Scan)
- Read `package.json` (or equivalent) from the project
- Call the `detect-stack` MCP tool with the stringified package.json
- Use the returned `recommendedCategories` as the scan set
- Always ensure Categories 1, 2, 3, 4 are included
- Display: "Quick Scan selected. Scanning X categories..."
- Proceed with scan

#### If User Enters 2-9 (Presets)
- Scan the predefined category groups (see mapping below)
- Display: "Web Security scan selected. Scanning Y categories..."
- Proceed with scan

#### If User Enters 10 (Custom Selection)
- Present category selection menu (see below)
- Accept both category numbers AND names
- Display: "Custom scan selected. Scanning Z categories..."
- Proceed with scan

#### If User Enters 11 (Diff Mode)
- Run `git diff HEAD --name-only` to get changed files
- Scan only changed files + their dependencies
- Display: "Diff scan selected. Scanning changed files..."
- Proceed with scan

#### If User Enters Invalid Input
- Display: "Invalid choice. Please enter 0-11."
- Re-display menu

#### If Arguments Provided (Skip Menu)
- If user runs with arguments (e.g., `/snitch --categories=1,2,3`):
- SKIP the interactive menu entirely
- Use the provided arguments to determine what to scan
- Proceed directly to execution

---

### Category Group Mappings

#### Group 2: Web Security
Categories: 1, 2, 5, 8, 10, 12

#### Group 3: Secrets & Authentication
Categories: 3, 4, 7, 39

#### Group 4: Modern Stack
Categories: 6, 11, 13, 14, 15, 16, 17, 18, 19, 39

#### Group 5: Compliance
Categories: 20, 21, 22, 23

#### Group 6: Performance
Categories: 24, 25, 26

#### Group 7: Infrastructure & Supply Chain
Categories: 27, 28, 29, 30, 31, 32, 33, 40, 41

#### Group 8: Full System Scan (45 categories)
Categories: 1-45

#### Group 9: Governance & Compliance (Extended)
Categories: 34, 35, 36, 37, 38

---

### Custom Selection Menu (Option 10)

When user selects Option 10, present this menu:

```
══════════════════════════════════════════════════════════════════════
                   Select Categories to Scan
══════════════════════════════════════════════════════════════════════

Core Security
  [ 1] SQL Injection (1)              [ 2] XSS (2)
  [ 3] Hardcoded Secrets (3)          [ 4] Authentication (4)
  [ 5] SSRF (5)                       [ 6] Supabase (6)
  [ 7] Rate Limiting (7)              [ 8] CORS (8)
  [ 9] Cryptography (9)              [10] Dangerous Patterns (10)
  [11] Cloud Security (11)            [12] Data Exposure (12)

Modern Stack
  [13] Stripe (13)                   [14] Auth Providers (14)
  [15] AI APIs (15)                  [16] Email Services (16)
  [17] Database (17)                 [18] Redis/Cache (18)
  [19] SMS/Communication (19)

Compliance
  [20] HIPAA (20)                    [21] SOC 2 (21)
  [22] PCI-DSS (22)                  [23] GDPR (23)

Performance
  [24] Memory Leaks (24)             [25] N+1 Queries (25)
  [26] Performance (26)

Infrastructure & Supply Chain
  [27] Dependencies (27)             [28] Authorization/IDOR (28)
  [29] File Uploads (29)             [30] Input Validation (30)
  [31] CI/CD Security (31)           [32] Security Headers (32)
  [33] Unused Dependencies (33)      [40] Tunnels & DNS (40)

Governance & Compliance (Extended)
  [34] FIPS 140-3 (34)               [35] Gov Certifications (35)
  [36] BC/DR (36)                    [37] Monitoring (37)
  [38] Data Classification (38)      [39] Token Lifetimes (39)

License & Supply Chain
  [41] License Compliance (41)

Advanced Security
  [42] Container & Docker (42)         [43] IaC Security (43)
  [44] API Security (44)              [45] AI Tool Supply Chain (45)


══════════════════════════════════════════════════════════════════════

Enter selection by NUMBER or NAME, separated by spaces:

Examples:
  - By number: "1 3 5 13"
  - By name: "sql injection secrets auth stripe"
  - Mixed: "1 secrets auth 13"

Your selection:
```

#### Custom Selection Processing

**Parse Input:**
- Split input by spaces
- For each item, check if it's a number or name
- Map names to category numbers (case-insensitive, partial match)
- Remove duplicates
- Validate all categories are in range 1-45

#### Name to Category Mapping

Support flexible matching:

```
"sql" or "sql injection" → 1
"xss" or "cross-site scripting" → 2
"secrets" or "hardcoded secrets" → 3
"auth" or "authentication" → 4
"ssrf" or "server-side request forgery" → 5
"supabase" → 6
"rate" or "rate limiting" → 7
"cors" → 8
"crypto" or "cryptography" → 9
"dangerous" or "dangerous patterns" → 10
"cloud" → 11
"logging" or "data exposure" → 12
"stripe" → 13
"providers" or "auth providers" → 14
"ai" or "ai apis" → 15
"email" → 16
"database" or "db" → 17
"redis" or "cache" → 18
"sms" or "twilio" or "communication" → 19
"hipaa" → 20
"soc" or "soc2" → 21
"pci" or "pcidss" → 22
"gdpr" → 23
"memory" or "memory leaks" → 24
"n+1" or "n1" or "n plus 1" → 25
"performance" or "perf" → 26
"dependencies" or "supply chain" or "deps" → 27
"authorization" or "idor" or "access control" → 28
"upload" or "file upload" → 29
"input" or "validation" or "redos" → 30
"cicd" or "ci/cd" or "pipeline" or "github actions" → 31
"headers" or "csp" or "security headers" → 32
"unused" or "bloat" or "unused dependencies" or "dead packages" → 33
"fips" or "fips140" or "fips 140" or "cryptographic compliance" → 34
"iso" or "iso27001" or "fedramp" or "cmmc" or "governance" or "nist" → 35
"bcdr" or "bc/dr" or "business continuity" or "disaster recovery" or "circuit breaker" → 36
"monitoring" or "observability" or "apm" or "tracing" or "alerting" → 37
"data classification" or "data lifecycle" or "retention" or "pii" or "data labeling" → 38
"token" or "token lifetime" or "session lifetime" or "token expiry" or "refresh token" or "session timeout" → 39
"tunnel" or "ngrok" or "cloudflared" or "cloudflare tunnel" or "wrangler" or "miniflare" or "dns resolver" or "dns security" → 40
"license" or "license compliance" or "sbom" or "copyleft" or "gpl" or "dependency license" → 41
"container" or "docker" or "dockerfile" → 42
"iac" or "infrastructure as code" or "terraform" or "kubernetes" or "k8s" or "cloudformation" → 43
"api" or "api security" or "openapi" or "swagger" or "graphql" or "rest api" → 44
"ai tool" or "mcp" or "mcp server" or "ai supply chain" or "skill security" or "plugin security" → 45
```

#### Smart Detection Triggers

Found `package.json` with `dependencies`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, or any lockfile:
- Add Category 41 (License Compliance)

Found `Dockerfile`, `docker-compose.yml`, `docker-compose.yaml`, or any `*.Dockerfile`:
- Add Category 42 (Container & Docker Security)

Found `*.tf`, `*.tfvars`, Kubernetes manifests (`apiVersion` in YAML), or CloudFormation templates:
- Add Category 43 (Infrastructure as Code Security)

Found `openapi.yaml`, `swagger.json`, GraphQL schema files, or API route handlers with Express/Fastify/Next.js API routes:
- Add Category 44 (API Security)

Found `@modelcontextprotocol/sdk` in dependencies, or `SKILL.md` files, or `.cursor/`, `.copilot/`, or MCP server configurations:
- Add Category 45 (AI Tool Supply Chain Security)

---

### Updated Execution Flow

**STEP 0: Check MCP Connection**
- Call `get-subscription-status` to verify MCP is connected
- If not connected, display the connection error and stop
- Store tier and available features

**STEP 1: Check for Arguments**
- If user provided arguments (e.g., `/snitch --categories=1,2,3`):
  - Skip interactive menu
  - Parse arguments to determine categories
  - Proceed to Step 3

**STEP 2: Open Native Scan Menu (AskUserQuestion)**
- If no arguments provided:
  - Call `AskUserQuestion` immediately (3-page native UI flow — see Interactive Menu above)
  - Do NOT output any text before this call
  - Accumulate user's selections across all pages
  - Determine which categories to scan from the accumulated set

**STEP 3: Perform Scan**
- For EACH selected security category:
  1. **Load guidance (MCP)** — Call `get-category` with the category number. This returns detection patterns, search guidance, context rules, and files to check.
  2. **Enrich (MCP)** — Call `search-rules` with the category name to fetch additional dynamic rules from your rulesets. Merge with the category guidance.
  3. **Search** — Use Grep/Glob to find relevant patterns from the guidance
  4. **Read** — Use Read to see the actual code in context
  5. **Validate (MCP)** — Call `check-pattern` on suspicious code snippets for additional signal
  6. **Analyze** — Apply the context rules from the guidance to determine if it is real
  7. **Report** — Only report with quoted evidence
- **SCOPE RULE:** ONLY scan, report on, and mention the selected categories. Do NOT include findings, passed checks, bright spots, or commentary about categories outside the selected scope.

**STEP 4: Generate Report**
- Generate findings report
- Display summary in console
- Save to file (SECURITY_AUDIT_REPORT.md)
- **SCOPE RULE:** The report (including Passed Checks and any summary sections) must ONLY reference the selected categories.
- Include metadata:
  - `scan_mode_detected_features` (tech/features that triggered categories)
  - `recheck_candidates` (finding IDs or file/line tuples to verify after fixes)

**STEP 4b: Generate SBOM (Optional)**
If a lockfile is present (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`), generate a CycloneDX 1.5 SBOM:
- Parse the lockfile to extract all components (name, version, license)
- Format as CycloneDX 1.5 JSON with: `bomFormat`, `specVersion`, `version`, `metadata` (tool name: "snitch", timestamp), and `components` array
- Each component: `type: "library"`, `name`, `version`, `purl` (Package URL format: `pkg:npm/name@version`), `licenses` array with SPDX id
- Save to `SBOM.cdx.json` alongside the report
- If no lockfile is found, skip SBOM generation silently

**STEP 5: Post-Scan Actions**

After displaying the full report, call `AskUserQuestion` with a single question:

- **question:** "Scan complete. What would you like to do?"
- **header:** "Next Steps"
- **multiSelect:** false
- **options:**
  1. **Run another scan** — return to the scan menu and audit additional categories
  2. **Fix one by one** — walk through each finding; apply fixes with your approval
  3. **Fix all (batch)** — apply all fixes at once, then review the changes
  4. **Done** — exit the security audit

#### Post-Scan Option Behavior

**Option 1: Run another scan**
- Return to STEP 2 (present the interactive menu again)
- Previous findings remain in the saved report
- New scan appends to or replaces the report

**Option 2: Fix issues one by one**
- For each finding (ordered by severity: Critical → High → Medium → Low):
  1. Display the finding (file, line, evidence, fix description)
  2. Ask the user: "Apply this fix?" with options: Yes / Skip / Stop fixing
  3. If Yes: apply the fix, show the change, move to the next finding
  4. If Skip: move to the next finding without changes
  5. If Stop: exit the fix loop, return to the post-scan menu (re-present STEP 5)
- After all findings are processed, return to the post-scan menu (re-present STEP 5)

**Option 3: Fix all issues (batch)**
- Display a summary of all fixes that will be applied
- Ask the user to confirm: "Apply all X fixes?" with options: Yes / No
- If Yes: apply all fixes, then display a summary of changes made
- If No: return to the post-scan menu (re-present STEP 5)
- After batch fix completes, return to the post-scan menu (re-present STEP 5)

**Option 4: Done**
- Display: "Security audit complete. Report saved to SECURITY_AUDIT_REPORT.md."
- Exit the skill

---

## FINAL REPORT FORMAT

```markdown
# Security Audit Report

## Summary
- **Overall Risk:** [Critical/High/Medium/Low]
- **Findings:** X Critical, X High, X Medium, X Low
- **Standards:** CWE Top 25 (2025), OWASP Top 10 (2025), CVSS 4.0
- **scan_mode_detected_features:** [comma-separated detected tech/features]
- **recheck_candidates:** [finding IDs or file:line entries requiring post-fix verification]

## Critical Findings

### 1. [Title]
- **Severity:** [Critical/High/Medium/Low] | CVSS 4.0: ~[score]
- **CWE:** CWE-[id] ([name])
- **OWASP:** A[nn]:2025 [category name]
- **File:** path/to/file.js:47
- **Evidence:** [exact code from file, secrets replaced with X's]
- **Risk:** [What could happen]
- **Fix:** [Specific remediation]

## Passed Checks
- [ ] Category X — no issues found
- [ ] All dependency licenses compatible with project license, no copyleft contamination (Category 41 - License Compliance)
- [ ] Container runs as non-root, images pinned, no secrets in Dockerfile (Category 42 - Container & Docker)
- [ ] IaC resources encrypted, least-privilege IAM, no hardcoded credentials (Category 43 - IaC Security)
- [ ] API endpoints authenticated, request validated, responses paginated (Category 44 - API Security)
- [ ] No malicious MCP tools, no prompt injection, AI tool permissions scoped (Category 45 - AI Tool Supply Chain)
```

**IMPORTANT:** When reporting findings involving secrets, ALWAYS redact the actual values:
- `sk_live_abc123` → `sk_live_XXXXXX`
- `password: "secret123"` → `password: "XXXXXXXX"`
- `postgresql://user:pass@host` → `postgresql://user:XXXX@host`

**Report footer:**
`*Powered by Snitch MCP — {categoriesScanned} categories loaded, {rulesAvailable} rules checked*`

---

## REMEMBER

1. **No evidence = No finding.** Cannot show code? Do not report it.
2. **Context matters.** Test file is not production code.
3. **Check mitigations.** Look for validation nearby.
4. **Be specific.** File, line number, exact code.
5. **Quality over quantity.** 5 real findings beat 50 false positives.
6. **Detect before checking.** Confirm a service is used before auditing it.
7. **Server vs Client matters.** Secrets in server-only code are often fine.
8. **Redact all secrets.** Replace actual values with X's in all output.
9. **Stay in scope.** Only report on selected categories.
10. **Never auto-fix.** Scan phase is strictly read-only.
11. **Run npm audit.** For Category 27, always run the package manager's audit command.
12. **Tag findings.** Include CWE, OWASP, and approximate CVSS.
13. **MCP is required.** All category guidance comes from the server. No local fallback.

$ARGUMENTS
