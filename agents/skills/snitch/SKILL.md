<!-- Canonical source: skills/snitch/SKILL.md - keep in sync -->
---
name: snitch
description: Comprehensive security audit with evidence-based findings. Combines deep pattern knowledge with contextual reasoning to eliminate false positives.
---

# Security Audit

You are a security expert performing a comprehensive security audit.

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

1. **Search** - Use Grep/Glob to find relevant patterns
2. **Read** - Use Read to see the actual code in context
3. **Analyze** - Apply the context rules below to determine if it is real
4. **Report** - Only report with quoted evidence

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

Three sequential `AskUserQuestion` calls. Each shows checkboxes for a slice of the 40 categories. Accumulate all checked items across all three calls, then run the union.

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
- **Full System Scan** check everything (all 40 categories)

> If Q4 = **Quick Scan**: run smart detection + any Q1–Q3 boxes already checked; stop here.
> If Q4 = **Full System Scan**: run all 40; stop here.
> If Q4 = **Continue →**: proceed to Call 2 with Q1–Q3 selections accumulated.

---

#### Call 2 of 3 — Modern Stack + Compliance + Performance (Cats 13–26, 39)

Call `AskUserQuestion` with 4 questions:

**Q1** `multiSelect: true` | header: `"Auth & Payments"`
- **🏢 Auth Providers** (Cat 14) — Clerk, Auth0, or NextAuth set up wrong
- **⏱️ Token & Session Lifetimes** (Cat 39) — sessions that expire too soon, never, or don't log out properly
- **💳 Stripe** (Cat 13) — secret keys exposed, webhooks not verified
- **🤖 AI APIs** (Cat 15) — API keys leaked, no rate limits on AI calls

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

#### Call 3 of 3 — Infrastructure, Supply Chain & Governance (Cats 27–38, 40) + Scope

Call `AskUserQuestion` with 4 questions:

**Q1** `multiSelect: true` | header: `"Supply Chain"`
- **📦 Dependencies** (Cat 27) — known vulnerabilities in your npm packages
- **🔓 Authorization** (Cat 28) — users can access or edit other users' data
- **📎 File Uploads** (Cat 29) — no file type checks, dangerous filenames
- **🧩 Input Validation** (Cat 30) — path traversal, prototype pollution, regex denial-of-service

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

**Q4** `multiSelect: false` | header: `"Scope"`
- **Entire codebase** scan all source files (Recommended)
- **Changed files only** restrict to files modified since last commit (`git diff HEAD --name-only`)

---

#### AskUserQuestion Behavior Rules

After all three calls (or fewer if Quick/Full shortcut used):

1. **Accumulate** all checked categories from every question across all calls into a single set
2. **Full System Scan shortcut** → overrides accumulated set; scan all 40
3. **Quick Scan shortcut** → run smart detection + merge any manually checked cats
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
║     - SQL Injection, XSS, Hardcoded Secrets, Auth, SSRF           ║
║     - Smart detection selects 5-10 relevant categories             ║
║     - Fast, covers the most common issues                         ║
╠════════════════════════════════════════════════════════════════════╣
║ [2] Web Security                                                   ║
║     - SQL Injection, XSS, CORS, SSRF, Dangerous Patterns          ║
║     - Logging & Data Exposure                                      ║
║     - Focus on web application vulnerabilities                     ║
╠════════════════════════════════════════════════════════════════════╣
║ [3] Secrets & Authentication                                      ║
║     - Hardcoded Secrets, Authentication, Rate Limiting            ║
║     - Focus on credential and access control issues               ║
╠════════════════════════════════════════════════════════════════════╣
║ [4] Modern Stack                                                   ║
║     - Stripe, Auth Providers, AI APIs, Email, Twilio              ║
║     - Database, Redis, Supabase, Cloud Security                   ║
║     - Focus on modern service integrations                        ║
╠════════════════════════════════════════════════════════════════════╣
║ [5] Compliance (HIPAA/SOC2/PCI/GDPR)                              ║
║     - HIPAA, SOC 2, PCI-DSS, GDPR                                  ║
║     - Regulatory compliance requirements                           ║
╠════════════════════════════════════════════════════════════════════╣
║ [6] Performance                                                    ║
║     - Memory Leaks, N+1 Queries, Performance Problems             ║
║     - Focus on runtime performance and efficiency                  ║
╠════════════════════════════════════════════════════════════════════╣
║ [7] Infrastructure & Supply Chain                                  ║
║     - Dependencies (CVE/0-day audit), Authorization/IDOR          ║
║     - File Uploads, Input Validation, CI/CD Security              ║
║     - Security Headers, Unused Dependencies & Bloat               ║
║     - Focus on infrastructure and supply chain risks               ║
╠════════════════════════════════════════════════════════════════════╣
║ [8] Full System Scan                                              ║
║     - All 40 categories                                           ║
║     - Comprehensive but uses more tokens                          ║
╠════════════════════════════════════════════════════════════════════╣
║ [9] Governance & Compliance (Extended)                             ║
║     - FIPS 140-3, Governance Certs, BC/DR, Monitoring             ║
║     - Data Classification & Lifecycle, Token Lifetimes             ║
║     - Focus on regulatory and operational resilience               ║
╠════════════════════════════════════════════════════════════════════╣
║ [10] Custom Selection                                              ║
║      - Pick specific categories individually                       ║
║      - Select by name or number                                    ║
╠════════════════════════════════════════════════════════════════════╣
║ [11] Scan Changed Files Only (--diff)                              ║
║      - Run Git diff and scan only modified files                   ║
║      - Good for pre-commit checks                                 ║
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
- Detect tech stack from package.json (or equivalent)
- Select 5-10 relevant categories based on dependencies
- Always include: Categories 1, 2, 3, 4 (SQLi, XSS, Secrets, Auth)
- Add relevant categories based on detected dependencies
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
- If user runs with arguments (e.g., `/securitybridge --categories=1,2,3`):
- SKIP the interactive menu entirely
- Use the provided arguments to determine what to scan
- Proceed directly to execution

---

### Category Group Mappings

#### Group 2: Web Security
Categories: 1, 2, 5, 8, 10, 12
- SQL Injection (1)
- Cross-Site Scripting (2)
- SSRF (5)
- CORS Configuration (8)
- Dangerous Code Patterns (10)
- Logging & Data Exposure (12)

#### Group 3: Secrets & Authentication
Categories: 3, 4, 7, 39
- Hardcoded Secrets (3)
- Authentication Issues (4)
- Rate Limiting (7)
- Token & Session Lifetimes (39)

#### Group 4: Modern Stack
Categories: 6, 11, 13, 14, 15, 16, 17, 18, 19, 39
- Supabase Security (6)
- Cloud Security (11)
- Stripe Security (13)
- Auth Providers (14)
- AI API Security (15)
- Email Services (16)
- Database Security (17)
- Redis/Cache Security (18)
- SMS/Communication (19)
- Token & Session Lifetimes (39)

#### Group 5: Compliance
Categories: 20, 21, 22, 23
- HIPAA (20)
- SOC 2 (21)
- PCI-DSS (22)
- GDPR (23)

#### Group 6: Performance
Categories: 24, 25, 26
- Memory Leaks (24)
- N+1 Queries (25)
- Performance Problems (26)

#### Group 7: Infrastructure & Supply Chain
Categories: 27, 28, 29, 30, 31, 32, 33, 40
- Dependency Vulnerabilities (27)
- Authorization & Access Control (28)
- File Upload Security (29)
- Input Validation & ReDoS (30)
- CI/CD Pipeline Security (31)
- Security Headers (32)
- Unused Dependencies & Bloat (33)
- Tunnels & DNS Security (40)

#### Group 8: Full System Scan (40 categories)
Categories: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40

#### Group 9: Governance & Compliance (Extended)
Categories: 34, 35, 36, 37, 38
- FIPS 140-3 / Cryptographic Compliance (34)
- Security Governance Certifications (35)
- Business Continuity & Disaster Recovery (36)
- Infrastructure Monitoring & Observability (37)
- Data Classification & Lifecycle (38)

---

### Smart Detection Logic (Quick Scan - Option 1)

Quick Scan always includes: Categories 1, 2, 3, 4

Then adds categories based on detected dependencies:

#### Detection Method
1. Read `package.json` (or equivalent for other languages)
2. Parse dependencies and devDependencies
3. Check for security-relevant packages

#### Dependency → Category Mapping

**Always Add:**
- Category 1 (SQL Injection) - if any database package found
- Category 2 (XSS) - if any frontend framework found
- Category 3 (Hardcoded Secrets) - always
- Category 4 (Authentication) - if any auth package found
- Category 12 (Logging and Data Exposure) - always (any project can log sensitive data)

**Conditional Adds:**

Found `stripe` or `@stripe/stripe-js`:
- Add Category 13 (Stripe Security)

Found `@supabase/supabase-js` or `@supabase/ssr`:
- Add Category 6 (Supabase Security)

Found `openai`, `@anthropic-ai/sdk`, or `ai`:
- Add Category 15 (AI API Security)

Found `resend`, `@sendgrid/mail`, or `postmark`:
- Add Category 16 (Email Services)

Found `@upstash/redis`, `ioredis`, or `redis`:
- Add Category 18 (Redis/Cache Security)

Found `twilio`:
- Add Category 19 (SMS/Communication)

Found `@clerk/nextjs`, `@auth0/nextjs-auth0`, or `next-auth`:
- Add Category 14 (Auth Providers)

Found `@aws-sdk/*`, `@google-cloud/*`, or `@azure/*`:
- Add Category 11 (Cloud Security)

Found `pg`, `mysql2`, `@prisma/client`, or `drizzle-orm`:
- Add Category 17 (Database Security)

Found `fetch`, `axios`, `got`, or `node-fetch`:
- Add Category 5 (SSRF)

Found any auth package (`jsonwebtoken`, `passport`, `next-auth`, `@clerk/nextjs`, `@auth0/nextjs-auth0`, `better-auth`, `express-session`):
- Add Category 7 (Rate Limiting)

Found any auth/session/JWT package (`jsonwebtoken`, `jose`, `next-auth`, `@auth/core`, `better-auth`, `@clerk/nextjs`, `@auth0/nextjs-auth0`, `express-session`, `iron-session`, `lucia`):
- Add Category 39 (Token & Session Lifetime Analysis)

Found `cors` package:
- Add Category 8 (CORS Configuration)

Found Keywords: `patient`, `medical`, `diagnosis`, `prescription`, `mrn`, `phi`:
- Add Category 20 (HIPAA)

Found Keywords: `audit`, `logging`, `compliance`, `mfa`:
- Add Category 21 (SOC 2)

Found Keywords: `card`, `payment`, `stripe`, `cvv`, `pan`:
- Add Category 22 (PCI-DSS)

Found Keywords: `consent`, `gdpr`, `data-export`, `data-delete`:
- Add Category 23 (GDPR)

Found Keywords: `fips`, `fips140`, `nist`, `cipher`, `tls_min`, `openssl`:
- Add Category 34 (FIPS / Cryptographic Compliance)

Found Keywords: `iso27001`, `fedramp`, `cmmc`, `govcloud`, `cui`, `nist800`, `ato`:
- Add Category 35 (Governance Certifications)

Found any React/Vue/Angular framework or any database package (`@prisma/client`, `drizzle-orm`, `pg`, `mysql2`, `mongoose`):
- Add Category 24 (Memory Leaks)

Found any ORM (`@prisma/client`, `drizzle-orm`, `typeorm`, `sequelize`, `mongoose`):
- Add Category 25 (N+1 Queries)

Found any web framework/ORM (`next`, `express`, `fastify`, `@prisma/client`, `drizzle-orm`) or `lodash` or `moment`:
- Add Category 26 (Performance Problems)

**Always Add:**
- Category 27 (Dependency Vulnerabilities) - applies to every project with a package manifest
- Category 33 (Unused Dependencies & Bloat) - applies to every project with a package manifest

Found any auth/database/API route package (`next-auth`, `@clerk/nextjs`, `@auth0/nextjs-auth0`, `@prisma/client`, `drizzle-orm`, `express`, `fastify`):
- Add Category 28 (Authorization & Access Control / IDOR)

Found `multer`, `formidable`, `busboy`, or `@uploadthing/*`:
- Add Category 29 (File Upload Security)

Found any web framework (`next`, `express`, `fastify`, `koa`, `hono`):
- Add Category 30 (Input Validation & ReDoS)

Found `.github/workflows` directory exists:
- Add Category 31 (CI/CD Pipeline Security)

Found any web framework (`next`, `express`, `fastify`):
- Add Category 32 (Security Headers)

Found `opossum`, `cockatiel`, or patterns matching circuit breaker / retry / graceful shutdown:
- Add Category 36 (Business Continuity & Disaster Recovery)

Found `@sentry/node`, `@datadog/datadog-api-client`, `newrelic`, `prom-client`, `@opentelemetry/*`, `dd-trace`, `@grafana/*`:
- Add Category 37 (Infrastructure Monitoring & Observability)

Found `cron`, `node-cron`, `@upstash/qstash` with data cleanup patterns, or `ttl`, `retention`, `purge`, `anonymize` keywords:
- Add Category 38 (Data Classification & Lifecycle)

Found `ngrok`, `.ngrok2/`, `.ngrok/`, `NGROK_AUTHTOKEN` in env/config, or `cloudflared`, `.cloudflared/`, `TUNNEL_TOKEN`, `trycloudflare.com` URLs:
- Add Category 40 (Tunnels & DNS Security)

Found `wrangler.toml`, `wrangler.jsonc`, `.dev.vars`, `miniflare`, `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`:
- Add Category 40 (Tunnels & DNS Security)

#### Example Output

```
Quick Scan selected.
Detected tech stack: Next.js, Prisma, Stripe, Supabase
Selected categories: 1, 2, 3, 4, 6, 13, 17 (7 categories)
Starting scan...
```

---

### Custom Selection Menu (Option 9)

When user selects Option 9, present this menu:

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
- Validate all categories are in range 1-40

**Examples:**

Input: `"1 3 5 13"`
→ Selected: 1, 3, 5, 13

Input: `"sql injection secrets auth stripe"`
→ Parsed: "sql injection" → 1, "secrets" → 3, "auth" → 4, "stripe" → 13
→ Selected: 1, 3, 4, 13

Input: `"1 secrets auth 13"`
→ Parsed: 1, "secrets" → 3, "auth" → 4, 13
→ Selected: 1, 3, 4, 13

Input: `"1 1 3 3"`
→ Deduplicated: 1, 3
→ Selected: 1, 3

Input: `"99 xyz"`
→ Invalid categories detected
→ Display: "Invalid categories: 99, xyz. Please enter 1-40 or valid names."
→ Re-display menu

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
```

---

### Updated Execution Flow

**STEP 0: Check for Arguments**
- If user provided arguments (e.g., `/securitybridge --categories=1,2,3`):
  - Skip interactive menu
  - Parse arguments to determine categories
  - Proceed to Step 2

**STEP 1: Open Native Scan Menu (AskUserQuestion)**
- If no arguments provided:
  - Call `AskUserQuestion` immediately (3-page native UI flow — see Interactive Menu above)
  - Do NOT output any text before this call
  - Accumulate user's selections across all pages
  - Determine which categories to scan from the accumulated set

**STEP 2: Perform Scan**
- For EACH selected security category:
  1. **Load guidance** - Read `categories/{NN}-{name}.md` for this category
  2. **Search** - Use Grep/Glob to find relevant patterns from the guidance
  3. **Read** - Use Read to see the actual code in context
  4. **Analyze** - Apply the context rules from the guidance to determine if it is real
  5. **Report** - Only report with quoted evidence
- **SCOPE RULE:** ONLY scan, report on, and mention the selected categories. Do NOT include findings, passed checks, bright spots, or commentary about categories outside the selected scope. If you observe something outside scope while scanning, ignore it entirely.

**STEP 3: Generate Report**
- Generate findings report
- Display summary in console
- Save to file (SECURITY_AUDIT_REPORT.md)
- **SCOPE RULE:** The report (including Passed Checks and any summary sections) must ONLY reference the selected categories. Do not list passed checks for categories that were not scanned.

**STEP 4: Post-Scan Actions**

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
- Return to STEP 1 (present the interactive menu again)
- Previous findings remain in the saved report
- New scan appends to or replaces the report

**Option 2: Fix issues one by one**
- For each finding (ordered by severity: Critical → High → Medium → Low):
  1. Display the finding (file, line, evidence, fix description)
  2. Ask the user: "Apply this fix?" with options: Yes / Skip / Stop fixing
  3. If Yes: apply the fix, show the change, move to the next finding
  4. If Skip: move to the next finding without changes
  5. If Stop: exit the fix loop, return to the post-scan menu (re-present STEP 4)
- After all findings are processed, return to the post-scan menu (re-present STEP 4)

**Option 3: Fix all issues (batch)**
- Display a summary of all fixes that will be applied
- Ask the user to confirm: "Apply all X fixes?" with options: Yes / No
- If Yes: apply all fixes, then display a summary of changes made
- If No: return to the post-scan menu (re-present STEP 4)
- After batch fix completes, return to the post-scan menu (re-present STEP 4)

**Option 4: Done**
- Display: "Security audit complete. Report saved to SECURITY_AUDIT_REPORT.md."
- Exit the skill

---

## CATEGORY GUIDANCE (Loaded On Demand)

Category detection rules, context analysis, and vulnerability patterns live in separate files
under `categories/` in the same directory as this skill file.

**Loading rule:** Before scanning each selected category, Read its guidance file:

1. Locate the `categories/` directory next to this SKILL.md
2. Read the file matching the category number: `categories/{NN}-{name}.md`
3. Use the Detection, Search, Context, and Files to Check sections from that file
4. If the file cannot be found, fall back to general security knowledge for that category

**File listing:**
01-sql-injection.md, 02-xss.md, 03-hardcoded-secrets.md, 04-authentication.md,
05-ssrf.md, 06-supabase.md, 07-rate-limiting.md, 08-cors.md, 09-crypto.md,
10-dangerous-patterns.md, 11-cloud.md, 12-data-leaks.md, 13-stripe.md,
14-auth-providers.md, 15-ai-apis.md, 16-email.md, 17-database.md, 18-redis.md,
19-sms.md, 20-hipaa.md, 21-soc2.md, 22-pci-dss.md, 23-gdpr.md,
24-memory-leaks.md, 25-n-plus-one.md, 26-performance.md, 27-dependencies.md,
28-authorization.md, 29-file-uploads.md, 30-input-validation.md, 31-cicd.md,
32-security-headers.md, 33-unused-deps.md, 34-fips.md, 35-governance.md,
36-bcdr.md, 37-monitoring.md, 38-data-classification.md, 39-token-lifetimes.md,
40-tunnels-dns.md

Do NOT pre-load all category files. Only Read the ones the user selected.

---

## FINAL REPORT FORMAT

```markdown
# Security Audit Report

## Summary
- **Overall Risk:** [Critical/High/Medium/Low]
- **Findings:** X Critical, X High, X Medium, X Low
- **Standards:** CWE Top 25 (2025), OWASP Top 10 (2025), CVSS 4.0

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
- [ ] No SQL injection found (Category 1)
- [ ] Proper password hashing (Category 9)
- [ ] RLS enabled on all Supabase tables (Category 6)
- [ ] Stripe webhook signatures verified (Category 13)
- [ ] AI API keys server-only (Category 15)
- [ ] Database connections use parameterized queries (Category 17)
- [ ] PHI encrypted at rest (Category 20 - HIPAA)
- [ ] Audit logging on sensitive routes (Category 21 - SOC 2)
- [ ] No raw card data stored (Category 22 - PCI-DSS)
- [ ] Data deletion endpoints exist (Category 23 - GDPR)
- [ ] Event listeners properly cleaned up (Category 24 - Memory Leaks)
- [ ] No database queries inside loops (Category 25 - N+1 Queries)
- [ ] No synchronous file I/O in request handlers (Category 26 - Performance)
- [ ] Lockfile present and committed (Category 27 - Dependencies)
- [ ] Resource ownership verified on all endpoints (Category 28 - Authorization)
- [ ] File uploads validated and sanitized (Category 29 - File Uploads)
- [ ] Input validation with schema library (Category 30 - Input Validation)
- [ ] CI/CD secrets use proper references (Category 31 - CI/CD Security)
- [ ] Security headers configured (Category 32 - Security Headers)
- [ ] No unused or bloated dependencies found (Category 33 - Unused Dependencies)
- [ ] FIPS-approved algorithms and key sizes in use (Category 34 - FIPS 140-3)
- [ ] Governance certification controls implemented (Category 35 - ISO 27001/FedRAMP/CMMC)
- [ ] Health checks, graceful shutdown, and circuit breakers in place (Category 36 - BC/DR)
- [ ] APM, structured logging, and alerting configured (Category 37 - Monitoring)
- [ ] Data classification, retention, and deletion lifecycle defined (Category 38 - Data Classification)
- [ ] Token lifetimes appropriate for app type, refresh flow implemented, logout invalidates tokens (Category 39 - Token Lifetimes)
- [ ] No tunnel credentials in git, no dev tunnels in production, DNS resolvers configurable (Category 40 - Tunnels & DNS)
```

**IMPORTANT:** When reporting findings involving secrets, ALWAYS redact the actual values:
- `sk_live_abc123` → `sk_live_XXXXXX`
- `password: "secret123"` → `password: "XXXXXXXX"`
- `postgresql://user:pass@host` → `postgresql://user:XXXX@host`

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
9. **Stay in scope.** Only report on selected categories. No findings, passed checks, or bright spots for unselected categories.
10. **Never auto-fix.** Scan phase is strictly read-only. Generate the complete report first. Only touch files after the report is displayed and the user explicitly chooses a fix option and confirms it.
11. **Run npm audit.** For Category 27, always run the package manager's audit command to get authoritative CVE data — don't guess from version numbers alone.
12. **Tag findings.** Include CWE, OWASP, and approximate CVSS from the Standards Reference table. Omit for non-security categories (performance 24–26).

$ARGUMENTS
