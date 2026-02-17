<\!-- Canonical source: skills/snitch/SKILL.md - keep in sync -->
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

## INTERACTIVE SCAN SELECTION

When the skill is invoked with NO arguments, present this menu to the user:

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
║     - All 33 categories                                           ║
║     - Comprehensive but uses more tokens                          ║
╠════════════════════════════════════════════════════════════════════╣
║ [9] Custom Selection                                              ║
║     - Pick specific categories individually                       ║
║     - Select by name or number                                     ║
╠════════════════════════════════════════════════════════════════════╣
║ [10] Scan Changed Files Only (--diff)                              ║
║      - Run Git diff and scan only modified files                   ║
║      - Good for pre-commit checks                                 ║
╠════════════════════════════════════════════════════════════════════╣
║ [0] Exit                                                           ║
╠════════════════════════════════════════════════════════════════════╣
║ Enter your choice (0-10):                                          ║
╚════════════════════════════════════════════════════════════════════╝
```

### Menu Behavior Rules

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

#### If User Enters 2-8 (Presets)
- Scan the predefined category groups (see mapping below)
- Display: "Web Security scan selected. Scanning Y categories..."
- Proceed with scan

#### If User Enters 9 (Custom Selection)
- Present category selection menu (see below)
- Accept both category numbers AND names
- Display: "Custom scan selected. Scanning Z categories..."
- Proceed with scan

#### If User Enters 10 (Diff Mode)
- Run `git diff HEAD --name-only` to get changed files
- Scan only changed files + their dependencies
- Display: "Diff scan selected. Scanning changed files..."
- Proceed with scan

#### If User Enters Invalid Input
- Display: "Invalid choice. Please enter 0-10."
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
Categories: 3, 4, 7
- Hardcoded Secrets (3)
- Authentication Issues (4)
- Rate Limiting (7)

#### Group 4: Modern Stack
Categories: 6, 11, 13, 14, 15, 16, 17, 18, 19
- Supabase Security (6)
- Cloud Security (11)
- Stripe Security (13)
- Auth Providers (14)
- AI API Security (15)
- Email Services (16)
- Database Security (17)
- Redis/Cache Security (18)
- SMS/Communication (19)

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
Categories: 27, 28, 29, 30, 31, 32, 33
- Dependency Vulnerabilities (27)
- Authorization & Access Control (28)
- File Upload Security (29)
- Input Validation & ReDoS (30)
- CI/CD Pipeline Security (31)
- Security Headers (32)
- Unused Dependencies & Bloat (33)

#### Group 8: Full System Scan
Categories: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33

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
  [33] Unused Dependencies (33)

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
- Validate all categories are in range 1-32

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
→ Display: "Invalid categories: 99, xyz. Please enter 1-32 or valid names."
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
```

---

### Updated Execution Flow

**STEP 0: Check for Arguments**
- If user provided arguments (e.g., `/securitybridge --categories=1,2,3`):
  - Skip interactive menu
  - Parse arguments to determine categories
  - Proceed to Step 2

**STEP 1: Present Interactive Menu**
- If no arguments provided:
  - Display main menu
  - Wait for user input
  - Parse user choice
  - Determine which categories to scan

**STEP 2: Perform Scan**
- For EACH selected security category:
  1. **Search** - Use Grep/Glob to find relevant patterns
  2. **Read** - Use Read to see the actual code in context
  3. **Analyze** - Apply the context rules below to determine if it is real
  4. **Report** - Only report with quoted evidence
- **SCOPE RULE:** ONLY scan, report on, and mention the selected categories. Do NOT include findings, passed checks, bright spots, or commentary about categories outside the selected scope. If you observe something outside scope while scanning, ignore it entirely.

**STEP 3: Generate Report**
- Generate findings report
- Display summary in console
- Save to file (SECURITY_AUDIT_REPORT.md)
- **SCOPE RULE:** The report (including Passed Checks and any summary sections) must ONLY reference the selected categories. Do not list passed checks for categories that were not scanned.

**STEP 4: Post-Scan Actions**
- After displaying the report, present the user with next steps using AskUserQuestion:

```
Scan complete. What would you like to do next?
```

Present these options:

| Option | Label | Description |
|--------|-------|-------------|
| 1 | Run another scan | Return to the scan selection menu to audit additional categories |
| 2 | Fix issues one by one | Walk through each finding individually, applying fixes with your approval |
| 3 | Fix all issues (batch) | Apply fixes for all findings at once, then review the changes |
| 4 | Done | Exit the security audit |

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

## CATEGORY 1: SQL Injection

### Detection
- Raw SQL usage: `pg`, `mysql2`, `better-sqlite3`, `knex` imports
- Query builder or ORM raw methods: `$queryRaw`, `$executeRaw`, `sql.raw`, `knex.raw`
- Database connection patterns without an ORM

### What to Search For
- String concatenation in SQL queries
- Template literal interpolation in queries
- Format string interpolation in queries

### Actually Vulnerable
- Direct string concatenation building SQL with user input
- Template literals inserting variables directly into SQL strings
- Python format strings with user variables in SQL

### NOT Vulnerable
- Parameterized queries with placeholders ($1, ?, :name)
- ORM methods that handle escaping (Prisma, TypeORM, Sequelize)
- Queries in comments or documentation
- Queries with only hardcoded values

### Context Check
1. Does user input actually flow into this query?
2. Is there validation/sanitization before this line?
3. Is this in test code or production code?

### Files to Check
- `**/db*.ts`, `**/query*.ts`, `**/sql*.ts`
- `**/repository*.ts`, `**/model*.ts`
- Database migration files, raw query utilities

---

## CATEGORY 2: Cross-Site Scripting (XSS)

### Detection
- Frontend framework usage: React, Vue, Angular, Svelte
- Server-rendered HTML: EJS, Pug, Handlebars templates
- DOM manipulation patterns in client-side code

### What to Search For
- DOM property assignments that inject raw HTML (the `inner` + `HTML` property)
- React unsafe HTML rendering (the `dangerously` + `SetInnerHTML` prop)
- DOM write methods (the `document` `.write` method)
- Vue v-html directive
- Unescaped template output

### Actually Vulnerable
- Assigning user input directly to the DOM's raw HTML property
- Rendering user content as raw HTML in React via unsafe props
- Writing user data via DOM write methods
- Vue v-html with user-controlled content

### NOT Vulnerable
- Static HTML content assignment
- Using textContent instead of raw HTML properties
- Content sanitized with DOMPurify before use
- Admin-only or trusted source content

### Context Check
1. Where does the content come from?
2. Is there sanitization before rendering?
3. Is this admin-only or user-generated content?

### Files to Check
- `**/components/**/*.tsx`, `**/components/**/*.vue`
- `**/views/**`, `**/templates/**`
- Server-rendered template files (`.ejs`, `.pug`, `.hbs`)

---

## CATEGORY 3: Hardcoded Secrets

### Detection
- Any project with source code (universally applicable)
- `.env` files, config files, source files with string literals
- CI/CD configuration files

### What to Search For
- API keys assigned as string literals
- Passwords in code
- AWS access keys (AKIA prefix)
- Stripe keys (sk_live_, sk_test_)
- Private keys in source files

### Actually Vulnerable
- Real API keys assigned to variables
- Real passwords hardcoded in source
- AWS access keys embedded in code
- Private keys stored in source files

### NOT Vulnerable
- Environment variable references (process.env.X)
- Template placeholders
- Example values in comments
- Test/development placeholder values
- .env.example with dummy values
- Security scanner pattern definitions
- Real secrets in .env.local or .env.development that are gitignored (flag as Medium, not Critical — not committed to source)

### Context Check
1. Is this a real secret or a placeholder?
2. Is it in a test/example file?
3. Is it documentation or actual code?
4. Is the secret in a file listed in .gitignore (lower severity — not committed to git) vs. committed to source control (higher severity — already in history)?

### Files to Check
- `.env*`, `**/*.config.*`, `**/config/**`
- `docker-compose*.yml`, `Dockerfile*`
- CI/CD files: `.github/workflows/*`, `.gitlab-ci.yml`

---

## CATEGORY 4: Authentication Issues

### Detection
- Auth libraries: `jsonwebtoken`, `passport`, `express-session`, `next-auth`, `@clerk/nextjs`, `better-auth`
- JWT usage: `jwt.sign`, `jwt.verify`, `jose` imports
- Session/cookie configuration patterns

### What to Search For
- Routes without auth middleware
- JWT signing with weak secrets
- JWT allowing none algorithm
- Insecure cookie settings
- Hardcoded session secrets
- Open redirects: `redirect()`, `res.redirect()` using `returnUrl`, `next`, `redirect_to` query params without allowlist validation
- WebSocket connections: `wss.on('connection', (ws) => { ... })` handlers that process messages before verifying authentication

### Actually Vulnerable
- Admin routes with no authentication middleware
- JWT secrets that are short or obvious
- Accepting none as a valid JWT algorithm
- Cookies without secure flag in production
- Session secrets hardcoded as simple strings
- `redirect(req.query.returnUrl)` without validating the URL is same-origin or on an allowlist
- `res.redirect(req.body.next)` after login with no URL validation
- WebSocket connection handler that processes data without checking session/JWT on the initial upgrade request

### NOT Vulnerable
- Routes with auth middleware applied
- Public routes that should be public
- JWT secrets loaded from environment
- Development-only insecure settings with env checks
- Redirect URLs validated against a same-origin check or explicit allowlist
- Auth provider handling redirects (Clerk, Auth0 handle this internally)
- WebSocket handlers that validate auth token from query params or headers on the `connection` event before any processing

### Context Check
1. Is middleware applied at router level?
2. Should this route be public?
3. Is insecure setting guarded by environment check?

### Files to Check
- `middleware.ts`, `**/auth/**`, `**/session/**`
- `pages/api/**`, `app/api/**`, `**/routes/**`
- JWT and session configuration files

---

## CATEGORY 5: SSRF (Server-Side Request Forgery)

### Detection
- HTTP client libraries: `fetch`, `axios`, `got`, `node-fetch`, `undici`
- URL construction from dynamic sources
- Webhook or callback URL handling patterns

### What to Search For
- fetch/axios/request with dynamic URLs
- User input flowing into URL parameters
- Webhook URL handling
- URL validation using weak methods

### Actually Vulnerable
- Fetching URLs directly from user input
- User-controlled webhook/callback URLs
- Validation using string includes instead of proper parsing

### NOT Vulnerable
- Hardcoded URLs
- Environment variable base with static paths
- Proper URL parsing with allowlist validation
- Internal service calls without user input

### Context Check
1. Does user input flow into the URL?
2. Is there URL validation before the request?
3. Does validation handle IP bypass formats?

### Files to Check
- `**/api/**`, `**/routes/**`, `**/services/**`
- Webhook handlers, callback URL processors
- HTTP client utility files

---

## CATEGORY 6: Supabase Security

### Detection
- `@supabase/supabase-js`, `@supabase/ssr` imports
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` environment variables
- Supabase migration files in `supabase/migrations/`

### What to Search For
- Tables without RLS in migrations
- Service role key in client code
- Service role in NEXT_PUBLIC variables
- RLS policies using just true

### Actually Vulnerable
- CREATE TABLE without matching RLS enablement
- Service role key passed to client-side code
- Service role key in public environment variables
- RLS policies that allow everything

### NOT Vulnerable
- Tables with RLS enabled and real policies
- Service role in server-only code
- Anon key in client code (expected)
- Intentionally public tables

### Context Check
1. Does each table have matching RLS?
2. Do RLS policies actually restrict access?
3. Is service role key server-side only?

### Files to Check
- `supabase/migrations/**`, `supabase/seed.sql`
- `lib/supabase*.ts`, `utils/supabase*.ts`
- `.env*`, `next.config.*`

---

## CATEGORY 7: Rate Limiting

### Detection
- Auth endpoints: login, signup, password reset, OTP verification routes
- Rate limiter libraries: `express-rate-limit`, `@upstash/ratelimit`, `rate-limiter-flexible`
- API routes handling sensitive operations

### What to Search For
- Auth endpoints: login, signup, password reset
- Rate limiter imports and usage
- In-memory vs persistent rate limiting

### Actually Vulnerable
- Login endpoint with no visible rate limiting
- Password reset without rate limiting
- In-memory limiter in production

### NOT Vulnerable
- Endpoints with rate limit middleware
- Infrastructure-level limiting (Cloudflare, WAF)
- Redis-backed rate limiting
- Non-sensitive endpoints

### Context Check
1. Is rate limiting handled at infrastructure level (Cloudflare, AWS WAF, API Gateway)?
2. Is this a public endpoint or a sensitive auth endpoint?
3. Is there a reverse proxy or load balancer applying rate limits upstream?

### Files to Check
- `**/login*.ts`, `**/signup*.ts`, `**/password*.ts`
- `**/auth/**`, `pages/api/auth/**`, `app/api/auth/**`
- Rate limiter configuration and middleware files

---

## CATEGORY 8: CORS Configuration

### Detection
- CORS middleware: `cors` package, `Access-Control-Allow-Origin` headers
- Framework CORS config: Next.js `next.config.js` headers, Express `cors()` middleware
- Manual header setting in API routes

### What to Search For
- CORS middleware configuration
- Access-Control headers
- Origin handling with credentials

### Actually Vulnerable
- Wildcard origin combined with credentials enabled
- Origin reflection without validation

### NOT Vulnerable
- Wildcard origin without credentials (public APIs)
- Specific origin allowlist
- Origin validation function

### Context Check
1. Is this a public API intended for cross-origin access?
2. Are credentials (cookies, auth headers) being sent with CORS requests?
3. Is the origin allowlist properly restricted to known domains?

### Files to Check
- `**/cors*.ts`, `**/middleware*.ts`
- `next.config.*`, `**/server*.ts`
- API route files setting response headers

---

## CATEGORY 9: Cryptography

### Detection
- Crypto libraries: `crypto`, `bcrypt`, `argon2`, `scrypt`, `jose`
- Hashing functions: `createHash`, `md5`, `sha1` (NOT sha256 or sha512 — those are fine)
- Encryption patterns: `createCipheriv`, `encrypt`, `decrypt`

### What to Search For
- MD5/SHA1 for password hashing
- Math.random for security tokens
- Hardcoded encryption keys
- Weak cipher modes

### Actually Vulnerable
- Weak hashes for password storage
- Predictable random for security purposes
- Encryption keys in source code
- ECB mode or deprecated ciphers

### NOT Vulnerable
- MD5/SHA1 for checksums only
- Secure random functions for tokens
- bcrypt/argon2/scrypt for passwords
- Keys from environment variables
- SHA-256, SHA-384, SHA-512 in any context (these are strong hashes — not a finding)

### Context Check
1. Is the weak hash used for password storage or non-security purposes (checksums)?
2. Is Math.random used for security tokens or UI randomization?
3. Are encryption keys loaded from environment or hardcoded?

### Files to Check
- `**/auth*.ts`, `**/crypto*.ts`, `**/hash*.ts`
- `**/token*.ts`, `**/password*.ts`
- Encryption and key management utilities

---

## CATEGORY 10: Dangerous Code Patterns

### Detection
- Dynamic code evaluation functions (JS eval, dynamic Function constructor, VM context runners)
- Shell/process execution modules (Node process spawning, shell command runners, sync variants)
- Unsafe deserialization (JSON.parse with untrusted input, YAML unsafe load, Python serialization modules)

### What to Search For
- Dynamic code evaluation patterns
- Shell command execution with user input
- Unsafe deserialization
- Unsafe YAML loading
- GraphQL introspection enabled in production: `introspection: true` in Apollo/GraphQL Yoga server config (leaks full schema)
- GraphQL server missing query depth and complexity limits (DoS vector)

### Actually Vulnerable
- User input in code evaluation
- Shell commands with concatenated user input
- Deserializing untrusted data
- YAML load without safe loader
- Apollo Server with `introspection: true` and no NODE_ENV guard (schema fully exposed)
- GraphQL server with no `depthLimit` or `queryComplexity` plugin (unbounded query cost)

### NOT Vulnerable
- Build tool configurations
- Static commands without user input
- Safe deserialization methods
- Vendor/node_modules code
- `introspection: process.env.NODE_ENV !== 'production'` (disabled in prod)
- Introspection guarded by admin-only authorization
- Depth/complexity limits configured

### Context Check
1. Does user input flow into the evaluated code or shell command?
2. Is this a build-time script or production runtime code?
3. Is the deserialized data from a trusted internal source?

### Files to Check
- `**/exec*.ts`, `**/shell*.ts`, `**/worker*.ts`
- `**/eval*.ts`, `**/script*.ts`
- Build scripts, task runners, utility scripts

---

## CATEGORY 11: Cloud Security

### Detection
- Cloud SDKs: `aws-sdk`, `@aws-sdk/*`, `@google-cloud/*`, `@azure/*`
- Infrastructure-as-code: Terraform (`.tf`), CloudFormation, Pulumi files
- Cloud environment variables: `AWS_ACCESS_KEY_ID`, `GOOGLE_APPLICATION_CREDENTIALS`

### What to Search For
- Cloud credentials in code
- Overly permissive IAM policies
- Open security groups
- Service account keys in repo

### Actually Vulnerable
- IAM with wildcard action AND resource
- Security groups open to 0.0.0.0/0 on sensitive ports
- Hardcoded cloud credentials
- Service account JSON committed

### NOT Vulnerable
- Constrained IAM policies
- Web ports open to public
- Secret manager references

### Context Check
1. Is the IAM policy scoped to specific resources or using wildcards?
2. Is the security group for a web server (80/443) or sensitive service?
3. Are credentials in code or loaded from a secret manager?

### Files to Check
- `**/*.tf`, `**/cloudformation*.yml`, `**/pulumi*.ts`
- `**/iam*.json`, `**/policy*.json`
- `.env*`, `**/credentials*`, `**/serviceaccount*`

---

## CATEGORY 12: Logging and Data Exposure

### Detection
- Logging libraries: `winston`, `pino`, `morgan`, `bunyan`, `console.log`
- Error handling: `catch` blocks, error middleware, error boundary components
- Debug configuration: `DEBUG=*`, `NODE_ENV` checks

### What to Search For
- Sensitive data in logs
- Stack traces to clients
- Debug mode in production
- Verbose error responses

### Actually Vulnerable
- Passwords or tokens in log statements
- Stack traces returned in API responses
- Debug enabled in production config

### NOT Vulnerable
- Logging without sensitive data
- Development-only verbose errors
- Redacted logging
- Error tracking with PII filtering

### Context Check
1. Does the log statement include sensitive data (passwords, tokens, PII)?
2. Is verbose error output guarded by a NODE_ENV check?
3. Is this a development/debug log or production logging?

### Files to Check
- `**/logger*.ts`, `**/logging*.ts`
- `**/error*.ts`, `**/middleware*.ts`
- Error boundary components, API error handlers

---

## CATEGORY 13: Stripe Security

### Detection
- `stripe` or `@stripe/stripe-js` imports
- `STRIPE_` environment variables

### What to Search For
- Secret keys in client code or public env vars
- Webhook endpoints without signature verification
- Test keys in production without env guards

### Critical
- `STRIPE_SECRET_KEY` or `sk_live_*` in client-side code
- `STRIPE_SECRET_KEY` in `NEXT_PUBLIC_*` variables
- Webhook endpoint missing `stripe.webhooks.constructEvent` verification

### High
- Test keys (`sk_test_*`) in production code without environment guards
- Missing `STRIPE_WEBHOOK_SECRET` verification in webhook handlers
- Hardcoded price IDs that should be environment variables

### Medium
- Publishable key (`pk_*`) hardcoded instead of environment variable
- Missing idempotency keys on payment intents

### Context Check
1. Is this server-only code or client-accessible code?
2. Are webhook endpoints properly validating Stripe signatures?
3. Are test keys guarded by environment checks (NODE_ENV)?

### NOT Vulnerable
- `STRIPE_SECRET_KEY` in server-only code (API routes, server actions)
- Publishable key (`pk_*`) in client code (expected)
- Test keys in test files or development configuration

### Files to Check
- `**/stripe*.ts`, `**/checkout*.ts`, `**/webhook*.ts`
- `pages/api/webhook*`, `app/api/webhook*`
- `.env*`, `next.config.*`

---

## CATEGORY 14: Auth Provider Security (Clerk, Auth0, NextAuth)

### Detection
- `@clerk/nextjs`, `@auth0/nextjs-auth0`, `next-auth` imports
- `CLERK_`, `AUTH0_`, `NEXTAUTH_` environment variables

### What to Search For
- Secret keys exposed to client
- Missing middleware on protected routes
- Weak or missing secrets

### Clerk Critical
- `CLERK_SECRET_KEY` in client-side code or `NEXT_PUBLIC_*`
- Missing `authMiddleware` or `clerkMiddleware` on protected routes

### Auth0 Critical
- `AUTH0_SECRET` or `AUTH0_CLIENT_SECRET` in frontend code
- `AUTH0_ISSUER_BASE_URL` mismatch with allowed callback URLs

### NextAuth Critical
- `NEXTAUTH_SECRET` exposed in client code
- `NEXTAUTH_SECRET` shorter than 32 characters
- `secret` option missing in NextAuth config
- Callbacks without proper validation

### High (All Providers)
- JWT secrets in client bundles
- Missing CSRF protection on auth endpoints
- Redirect URL validation missing (open redirect vulnerability)
- Session tokens stored in localStorage (should be httpOnly cookies)

### Context Check
1. Is auth middleware applied at the router/layout level covering all protected routes?
2. Are secrets in server-only files or potentially bundled into client code?
3. Is redirect URL validation handled by the auth provider or custom code?

### NOT Vulnerable
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in client (expected)
- Secret keys in server-only code
- Auth middleware properly applied at router level

### Files to Check
- `middleware.ts`, `middleware.js`
- `**/auth/**`, `pages/api/auth/**`, `app/api/auth/**`
- `auth.config.*`, `auth.ts`, `.env*`

---

## CATEGORY 15: AI API Security (OpenAI, Anthropic, etc.)

### Detection
- `openai`, `@anthropic-ai/sdk`, `ai` imports
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` environment variables

### What to Search For
- API keys in client code or public env vars
- Missing rate limiting on AI endpoints
- Prompt injection vulnerabilities

### Critical
- `OPENAI_API_KEY` or `sk-*` (OpenAI format) in client-side code
- `ANTHROPIC_API_KEY` in frontend files
- AI API keys in `NEXT_PUBLIC_*` variables

### High
- No rate limiting on AI endpoints (cost explosion risk)
- User input passed directly to system prompts without sanitization (prompt injection)
- Missing token/cost limits on API calls (`max_tokens` not set)

### Medium
- API keys in git history (check `.env` not in `.gitignore`)
- No error handling exposing raw API errors to users
- No input length validation before API calls

### Context Check
1. Is the AI endpoint server-only or accessible from client code?
2. Are there cost controls (max_tokens, rate limits) on AI endpoints?
3. Is user input sanitized before inclusion in prompts?
4. Are AI API errors properly caught and sanitized before returning to users?

### NOT Vulnerable
- API keys in server-only code (API routes, server actions)
- `NEXT_PUBLIC_*` variables for non-secret config (model names, etc.)
- Properly sanitized user input in prompts

### Files to Check
- `**/openai*.ts`, `**/ai/**`, `**/chat/**`
- `pages/api/ai*`, `pages/api/chat*`
- `app/api/ai*`, `app/api/chat*`
- `.env*`, `lib/ai*.ts`

---

## CATEGORY 16: Email Service Security (Resend, SendGrid, Postmark)

### Detection
- `resend`, `@sendgrid/mail`, `postmark` imports
- `RESEND_API_KEY`, `SENDGRID_API_KEY`, `POSTMARK_API_TOKEN` environment variables

### What to Search For
- API keys in client code
- User-controlled email addresses or content
- Missing rate limiting

### Critical
- `RESEND_API_KEY`, `SENDGRID_API_KEY`, or `POSTMARK_API_TOKEN` in client-side code
- Email API keys in `NEXT_PUBLIC_*` variables

### High
- User-controlled `to` address without validation (spam relay)
- User-controlled email content without sanitization (email injection via headers)
- Missing rate limiting on email endpoints

### Medium
- User-controlled `from` address (spoofing)
- No domain verification for sender addresses
- Logging full email content including sensitive data

### Context Check
1. Is the email endpoint server-only or accessible from client code?
2. Is the recipient address hardcoded or user-controlled?
3. Is there rate limiting to prevent email flooding?
4. Is email content sanitized to prevent header injection?

### NOT Vulnerable
- API keys in server-only code
- Hardcoded recipient for contact forms
- Properly validated email addresses

### Files to Check
- `**/email*.ts`, `**/send*.ts`, `**/mail*.ts`
- `pages/api/*mail*`, `app/api/*mail*`
- `lib/email*.ts`, `.env*`

---

## CATEGORY 17: Database Security (Prisma, Drizzle, Raw Connections)

### Detection
- `@prisma/client`, `drizzle-orm`, `pg`, `mysql2` imports
- `DATABASE_URL`, `POSTGRES_URL` environment variables

### What to Search For
- Connection strings in client code
- Raw SQL with user input
- Missing query safety measures

### Critical
- `DATABASE_URL` with credentials in client-side code
- Connection strings in `NEXT_PUBLIC_*` variables
- `$queryRaw` or `$executeRaw` with string interpolation (SQL injection)
- Template literals with `${userInput}` in raw SQL

### High
- Prisma `$queryRawUnsafe` usage with any user input
- Raw SQL queries built with string concatenation
- Missing connection pooling for serverless (no PgBouncer/Prisma Accelerate)

### Medium
- Prisma schema with `@db.VarChar` without explicit length limits
- No query timeouts configured
- Database errors exposed to users without sanitization

### Context Check
1. Is the raw SQL using parameterized placeholders or string interpolation?
2. Does user input actually flow into the query, or is it hardcoded/server-generated?
3. Is the database connection server-only or potentially exposed to client code?
4. Is there an ORM layer handling escaping automatically?

### NOT Vulnerable
- `DATABASE_URL` in server-only code
- Parameterized queries with `Prisma.sql` template tag
- ORM queries (Prisma/Drizzle) with proper escaping
- Raw queries with only hardcoded values

### Files to Check
- `prisma/schema.prisma`, `drizzle.config.ts`
- `**/db*.ts`, `lib/prisma.ts`, `lib/db.ts`
- `.env*`

---

## CATEGORY 18: Redis/Cache Security (Upstash, Redis)

### Detection
- `@upstash/redis`, `ioredis`, `redis` imports
- `REDIS_URL`, `UPSTASH_REDIS_REST_URL` environment variables

### What to Search For
- Redis credentials in client code
- Unencrypted sensitive data in cache
- Missing authentication

### Critical
- `UPSTASH_REDIS_REST_TOKEN` in client-side code
- `REDIS_URL` with password in frontend
- Redis connection strings in `NEXT_PUBLIC_*` variables

### High
- No authentication on Redis commands (open Redis instance)
- Storing sensitive data (tokens, PII) without encryption
- Cache keys predictable from user input (cache poisoning)

### Medium
- No TTL on cached sensitive data
- Serializing full objects with sensitive fields

### Context Check
1. Is Redis/cache used server-side only or accessible from client code?
2. Is the cached data sensitive (tokens, PII) or public/non-sensitive?
3. Are cache keys unpredictable or derived from user input?
4. Is there a TTL set on sensitive cached data?

### NOT Vulnerable
- Redis credentials in server-only code
- Encrypted values in cache
- Public/non-sensitive data cached without encryption

### Files to Check
- `**/redis*.ts`, `**/cache*.ts`
- `lib/redis.ts`, `lib/cache.ts`
- `.env*`

---

## CATEGORY 19: SMS/Communication Security (Twilio)

### Detection
- `twilio` imports
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` environment variables

### What to Search For
- Auth tokens in client code
- User-controlled phone numbers
- Missing webhook verification

### Critical
- `TWILIO_AUTH_TOKEN` in client-side code
- Account SID + Auth Token in frontend files

### High
- User-controlled phone numbers without validation (SMS pumping attack)
- No rate limiting on SMS endpoints
- Missing webhook signature validation (`validateRequest`)

### Medium
- Phone numbers logged without masking
- No verification of phone number ownership before sending

### Context Check
1. Is the SMS endpoint server-only and rate-limited?
2. Are phone numbers validated and verified before sending?
3. Is webhook signature validation applied to incoming Twilio requests?
4. Are phone numbers masked in logs?

### NOT Vulnerable
- Twilio credentials in server-only code
- Properly validated phone numbers with ownership verification
- Rate-limited SMS endpoints

### Files to Check
- `**/twilio*.ts`, `**/sms*.ts`
- `pages/api/*sms*`, `app/api/*sms*`
- `.env*`

---

## CATEGORY 20: HIPAA (Healthcare Information Portability and Accountability Act)

### Detection
- Health-related data models: `patient`, `medical`, `diagnosis`, `prescription`, `treatment`
- Healthcare terms in schemas, APIs, or variables: `PHI`, `ePHI`, `clinical`, `healthcare`
- Medical identifiers: `mrn`, `medical_record`, `insurance_id`, `health_plan`, `provider_npi`

### What to Search For
- PHI logged to console or logging systems
- Unencrypted health data storage
- Missing audit trails on health endpoints
- PHI exposed in URLs or query parameters
- Health data in error messages

### Critical
- `console.log`, `logger.*` with patient data, diagnosis, prescription, or medical records
- Health data stored without `encrypt`, `cipher`, or `aes` protection
- Patient IDs or MRNs in URL path segments or query parameters
- Patient data leaked in catch blocks or error responses

### High
- Health endpoints without audit log decorators or middleware
- HTTP (non-HTTPS) endpoints handling health data
- Health data endpoints without role-based access control checks
- No data retention/deletion patterns for health records

### Context Check
1. Is this in test code or production code?
2. Is the data actually PHI (protected health information)?
3. Is there encryption or audit logging applied elsewhere in the stack?
4. Does the application actually handle healthcare data?

### NOT Vulnerable
- Health-related variable names in test files with mock data
- Encrypted PHI with proper key management
- Audit-logged health endpoints with RBAC
- Development/staging environments with synthetic data

### Files to Check
- `**/patient*.ts`, `**/medical*.ts`, `**/health*.ts`
- `**/ehr/**`, `**/clinical/**`
- API routes handling health data
- Database schemas with health-related tables

---

## CATEGORY 21: SOC 2 (Trust Service Criteria)

> **Cross-reference:** SOC 2 overlaps with Category 4 (Authentication), Category 12 (Logging/Data Exposure), and Categories 1/2/10 (Input validation). Deduplicate findings — if an issue is already reported under those categories, reference it here rather than reporting twice.

### Detection
- Authentication systems, session management
- Audit logging infrastructure
- Access control patterns
- Change management logs

### What to Search For
- Missing access/audit logs on sensitive routes
- Weak password policies
- Missing MFA on admin routes
- Session management without timeouts
- Input validation gaps
- Missing error handling

### Critical
- Auth/sensitive routes without any audit logging (CC6.1 violation)
- Admin routes without `mfa`, `2fa`, or `totp` verification
- Sessions without `maxAge`, `expires`, or timeout configuration

### High
- Password validation accepting < 8 characters or no complexity requirements
- User input directly used without `sanitize`, `validate`, or `escape` (CC6.6 violation)
- Async operations without try/catch or global error handlers (CC7.2 violation)
- PII stored without encryption functions
- Data mutations without changelog or audit entries (CC6.2 violation)

### Context Check
1. Is audit logging handled at infrastructure level (middleware)?
2. Is MFA enforced at the auth provider level (Clerk, Auth0)?
3. Are there compensating controls not visible in application code?
4. Is this a public-facing or internal application?

### NOT Vulnerable
- Routes with audit middleware applied at router level
- Password validation with proper complexity (8+ chars, mixed case, numbers, symbols)
- MFA handled by auth provider (Clerk, Auth0, Okta)
- Input sanitization applied via validation library (Zod, Yup, Joi)
- Centralized error handling in framework configuration

### Files to Check
- `middleware.ts`, authentication handlers
- Password validation schemas
- Session configuration files
- Error handling middleware
- Audit logging utilities

---

## CATEGORY 22: PCI-DSS (Payment Card Industry Data Security Standard)

> **Cross-reference:** PCI-DSS overlaps with Category 13 (Stripe Security) for payment processing. If Stripe/Braintree findings are already reported under Category 13, reference them here rather than reporting twice. Focus this category on raw card handling, TLS configuration, and card data storage.

### Detection
- Payment processing: `card_number`, `credit_card`, `pan`, `payment`
- Card security codes: `cvv`, `cvc`, `security_code`
- Payment processor integrations: Stripe, Braintree, Square

### What to Search For
- Card numbers in logs (Req 3.2)
- Full PAN storage without tokenization (Req 3.4)
- CVV/CVC stored anywhere (Req 3.2 - never store)
- Card data in URLs (Req 4.1)
- Weak TLS configuration (Req 4.1)
- Direct card handling instead of payment processor tokens

### Critical
- Logging statements capturing card number patterns `\d{13,19}`
- Variables storing full card numbers without tokenization
- Any storage or variable containing `cvv`, `cvc`, or `security_code` values
- Card numbers in query params or URL path segments
- `TLS 1.0`, `TLS 1.1`, `SSLv3`, or weak cipher configurations
- Encryption keys hardcoded in source or config files

### High
- Raw card processing logic instead of Stripe/Braintree tokenization
- `card_number`, `pan` variables that aren't tokenized references
- Storing full card + expiry + cardholder name when not business-required

### Context Check
1. Is this actual card data or tokenized references (`pm_`, `tok_` prefixes)?
2. Is the card number regex for validation (not storage)?
3. Is this test code with test card numbers?
4. Does the application use a PCI-compliant payment processor?

### NOT Vulnerable (False Positives)
- Stripe payment method tokens (`pm_*`) or token objects (`tok_*`)
- Card number validation regex (format checking, not storing)
- Test card numbers in test files (`4242424242424242`)
- Last 4 digits only storage (`card_last4`, `last_four`)
- Masked card display (`****1234`)
- Payment processor SDK usage without raw card handling

### Files to Check
- `**/payment*.ts`, `**/checkout*.ts`, `**/billing*.ts`
- `**/stripe*.ts`, `**/braintree*.ts`
- Logging configuration files
- TLS/SSL configuration
- `.env*` for encryption keys

---

## CATEGORY 23: GDPR (General Data Protection Regulation)

### Detection
- Personal data handling: `personal_data`, `pii`, `data_subject`
- Consent management: `consent`, `opt_in`, `gdpr`
- Data subject rights: `right_to_delete`, `right_to_access`, `data_export`
- EU user detection: locale, region, or country checks for EU

### What to Search For
- Data collection without consent verification
- Missing data deletion endpoints
- Missing data export/portability endpoints
- Excessive data collection
- No data retention policies
- Third-party data sharing without consent
- Analytics/tracking without consent checks

### Critical
- Personal data collection without `consent`, `opt_in`, or `agreed` verification (Art 6)
- No data deletion capability for personal data (Art 17 - Right to Erasure). Search broadly for ANY of these patterns:
  - Route/endpoint names: `delete`, `remove`, `erase`, `purge`, `destroy`, `forget`, `wipe`, `clear`
  - Function names: `deleteUser`, `removeAccount`, `eraseUser`, `forgetMe`, `purgeData`, `destroyAccount`, `closeAccount`, `deactivateAccount`
  - Combined with: `user`, `account`, `profile`, `data`, `personal`, `member`, `customer`
  - API paths: `/delete`, `/remove`, `/erase`, `/account/close`, `/me/delete`, `/privacy/delete`
  - If ANY deletion mechanism exists (regardless of naming), it satisfies Art 17
- No data export/portability capability (Art 20 - Right to Data Portability). Search broadly for ANY of these patterns:
  - Route/endpoint names: `export`, `download`, `portability`, `extract`, `dump`, `backup`, `archive`
  - Function names: `exportData`, `downloadData`, `getUserData`, `getMyData`, `extractData`, `generateReport`, `downloadProfile`
  - Combined with: `user`, `account`, `profile`, `data`, `personal`, `member`, `customer`
  - API paths: `/export`, `/download`, `/me/data`, `/privacy/export`, `/account/data`
  - File generation: `csv`, `json`, `pdf`, `zip` exports of user data
  - If ANY export mechanism exists (regardless of naming), it satisfies Art 20
- EU user data sent to non-EU endpoints without transfer safeguards (Art 44-49)

### High
- Collecting unnecessary fields (SSN, DOB when not business-required) (Art 5)
- Personal data without `ttl`, `expiresAt`, or cleanup jobs (Art 5)
- PII sent to external APIs without consent verification (Art 44)
- Analytics or tracking initialized without consent banner check (Art 7)
- Missing incident response or breach notification patterns (Art 33)

### Medium
- No `anonymize`, `pseudonymize`, or `hash` functions for analytics data (Art 25)
- Cookie consent not verified before setting non-essential cookies

### Context Check
1. Does the application actually handle EU user data?
2. Is consent managed at a different layer (consent management platform)?
3. Are there data processing agreements with third parties?
4. Is this personal data or anonymous/aggregated data?

### NOT Vulnerable
- Consent verification before data collection
- Any working data deletion mechanism, regardless of naming convention
- Any working data export/download mechanism, regardless of naming convention
- Anonymized or pseudonymized data for analytics
- Proper data retention with automated cleanup
- Consent management platform integration
- Third-party services with DPAs in place

### Files to Check
- User registration and data collection endpoints
- Privacy/settings pages
- Account management pages (settings, profile, close account)
- Analytics initialization code
- Data export/deletion handlers (search broadly: `delete`, `remove`, `export`, `download`, `extract`, etc.)
- Cookie consent components
- Third-party integrations sending user data
- Admin panels with user management features

---

## CATEGORY 24: Memory Leaks

### Detection
- Frontend frameworks: React, Vue, Angular, Svelte with lifecycle hooks
- Event-driven patterns: `addEventListener`, `.on()`, `.subscribe()`
- Timer functions: `setInterval`, `setTimeout`
- Connection patterns: WebSocket, database connections, streams

### What to Search For
- `addEventListener` without corresponding `removeEventListener` in cleanup
- `useEffect` with timers or listeners but no cleanup return function
- `setInterval`/`setTimeout` without clearing in cleanup
- Module-scope `Map`/`Set` that grow without eviction or size limits
- WebSocket/stream/connection opened without corresponding close
- `.on()`/`.subscribe()` without `.off()`/`.unsubscribe()` in cleanup

### Actually Vulnerable
- Event listeners added in component mount without removal on unmount
- `useEffect` creating intervals/subscriptions with no cleanup return
- Module-level caches (`Map`, `Set`, `Object`) that grow unbounded
- Database connections opened per-request without pooling or closing
- WebSocket connections without close handlers

### NOT Vulnerable
- Event listeners with proper cleanup in `useEffect` return or `componentWillUnmount`
- `setInterval` with matching `clearInterval` in cleanup
- Caches with TTL, LRU eviction, or size limits
- Connection pools (e.g., Prisma client singleton)
- One-time static listeners (e.g., `process.on('uncaughtException')`)

### Context Check
1. Is there a cleanup function that removes the listener/timer?
2. Is this a module-level singleton (acceptable) or per-request allocation?
3. Does the cache have eviction or size limits?
4. Is the connection pooled or per-request?

### Files to Check
- `**/components/**/*.tsx`, `**/hooks/**/*.ts`
- `**/lib/**/*.ts`, `**/utils/**/*.ts`
- `**/services/**/*.ts`, `**/workers/**/*.ts`

---

## CATEGORY 25: N+1 Queries

### Detection
- ORM usage: `@prisma/client`, `drizzle-orm`, `typeorm`, `sequelize`, `mongoose`
- Database queries inside loops or array iteration methods
- GraphQL resolvers with per-field data fetching

### What to Search For
- ORM `findUnique`/`findFirst`/`findOne` inside `for`/`forEach`/`map` loops
- `await` database calls inside loop bodies
- GraphQL field resolvers making individual database queries without DataLoader
- Missing `include`/`select`/`populate` for relations accessed after initial query
- `fetch()` per-item in loops in server-side code

### Actually Vulnerable
- `prisma.user.findUnique()` called inside a `for` loop iterating over IDs
- `await db.query()` inside `array.map()` or `forEach()`
- GraphQL resolver fetching related records one-by-one without batching
- Fetching a list then looping to fetch each item's relations separately
- Sequential API calls per-item when a batch endpoint exists

### NOT Vulnerable
- Single queries with `include`/`select` loading relations eagerly
- Batch operations: `findMany`, `WHERE IN`, `Promise.all` with batch fetch
- GraphQL resolvers using DataLoader for batching
- Loop queries where the loop is bounded to a small known size (< 5)
- Client-side fetching in user-triggered handlers (not render loops)

### Context Check
1. Is the database call actually inside a loop or iteration?
2. Could this be replaced with a single query using `include`, `WHERE IN`, or batch fetch?
3. Is the loop bounded to a small constant or potentially unbounded?
4. Is this server-side code (performance impact) or client-side (less concern)?

### Files to Check
- `**/api/**/*.ts`, `**/routes/**/*.ts`
- `**/services/**/*.ts`, `**/resolvers/**/*.ts`
- `**/actions/**/*.ts`, `**/server/**/*.ts`
- GraphQL resolver files

---

## CATEGORY 26: Performance Problems

### Detection
- Synchronous file system operations in request handlers
- Database queries without indexes or limits
- Full library imports in client bundles
- Missing pagination on list endpoints
- Sequential independent async operations

### What to Search For
- `fs.readFileSync`/`writeFileSync` in request handlers (not config/build scripts)
- Prisma schema fields used in `where`/`orderBy` without `@@index`
- `findMany({})`/`.find({})` without `take`/`limit` clause
- `import _ from 'lodash'` (full library) in client-side code
- List/search endpoints without pagination parameters (`skip`, `take`, `page`, `limit`)
- Sequential independent `await` calls that should be `Promise.all`
- Inline object/array literals in JSX props of mapped components (causes re-renders)

### Actually Vulnerable
- `fs.readFileSync` inside an API route handler or middleware
- Database query on a frequently-filtered field with no index defined
- `findMany({})` returning entire table with no limit
- Full lodash import (`import _ from 'lodash'`) in a client-side bundle
- API endpoint returning all records with no pagination
- Three sequential `await` calls to independent services (should be parallel)

### NOT Vulnerable
- `readFileSync` in config loading at startup or build scripts
- Queries on primary keys or already-indexed fields
- `findMany` with explicit `take`/`limit` clause
- Tree-shakeable imports (`import { debounce } from 'lodash/debounce'`)
- Endpoints with cursor/offset pagination
- Sequential awaits where each depends on the previous result

### Context Check
1. Is the sync file operation in a request handler or at startup/build time?
2. Is the unindexed field actually used in production queries?
3. Is the unbounded query on a table that will remain small or could grow large?
4. Are the sequential awaits actually independent or do they depend on each other?

### Files to Check
- `**/api/**/*.ts`, `**/routes/**/*.ts`, `**/middleware/**/*.ts`
- `prisma/schema.prisma` (check `@@index` directives)
- `**/components/**/*.tsx` (check imports and JSX props)
- `**/pages/**/*.tsx`, `**/app/**/*.tsx`

---

## CATEGORY 27: Dependency Vulnerabilities / Supply Chain

### Detection
- Package manifests: `package.json`, `requirements.txt`, `Gemfile`, `go.mod`
- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- CI/CD dependency installation steps

### Active Audit Step (REQUIRED)
Run the appropriate audit command for the project's package manager. This gives authoritative CVE data — do not skip it:

```
npm audit --json          # npm
pnpm audit --json         # pnpm
yarn audit --json         # Yarn 1.x
pip-audit                 # Python
bundle audit              # Ruby
govulncheck ./...         # Go
```

Parse the output and report:
- **Critical/High severity advisories** — flag immediately, include CVE ID and affected version range
- **Moderate severity** — flag if the package is in `dependencies` (production)
- **Low severity in devDependencies** — note but mark as lower priority

### What to Search For
- Missing lockfile entirely (non-deterministic installs)
- `postinstall` scripts in dependencies doing suspicious things (network calls, file writes outside package)
- Typosquatting indicators (packages with names very similar to popular ones)
- Pinned to very old major versions of security-critical packages (e.g., `express` v3, `jsonwebtoken` v7)
- Dependencies with known CVEs in the locked version
- `npm audit` / `yarn audit` equivalent checks not present in CI
- Recently-disclosed 0-days in commonly-used packages — pay particular attention to:
  - React / react-dom (XSS issues in certain render paths)
  - Next.js (path traversal, SSRF, and auth bypass CVEs in older versions)
  - Express (prototype pollution, RegEx DoS in old versions)
  - `jsonwebtoken` (algorithm confusion, none-algorithm bypass in v8 and below)
  - `lodash` (prototype pollution — CVE-2019-10744 and related)
  - `node-fetch` / `axios` (SSRF and header injection in older versions)
  - `multer` / `formidable` (path traversal in older versions)
  - Any package pinned to a version released more than 2 major versions ago

### Actually Vulnerable
- No lockfile committed (anyone running install gets potentially different versions)
- Dependency with a `postinstall` script that downloads and executes remote code
- Package name one character off from a popular package (potential typosquat)
- Security-critical package pinned to end-of-life major version
- Known CVE in locked dependency version with no override or resolution
- `npm audit` returns Critical or High advisories for production dependencies
- Package version falls within a known vulnerable range for a disclosed CVE

### NOT Vulnerable
- Lock file present and committed
- `postinstall` scripts that run standard build steps (tsc, node-gyp)
- Well-known packages from verified publishers
- Packages on current or recent major versions
- Vulnerabilities only in devDependencies not shipped to production
- `npm audit` returns zero Critical/High findings

### Context Check
1. Is the lockfile committed to the repository?
2. Are suspicious postinstall scripts from trusted, well-known packages?
3. Is the outdated package a dev-only dependency or shipped to production?
4. Does the project have automated dependency auditing in CI?
5. Does `npm audit` show any Critical or High advisories? Report the CVE ID and affected package.

### Files to Check
- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `.github/workflows/*.yml` (check for audit steps)
- `.npmrc`, `.yarnrc.yml` (registry configuration)

---

## CATEGORY 28: Authorization & Access Control (IDOR)

### Detection
- API routes accepting resource IDs as parameters
- Database queries using user-supplied IDs
- Role/permission systems and middleware
- Admin routes and privileged operations

### What to Search For
- API routes that take resource IDs but don't verify ownership
- Missing role/permission checks on admin routes
- Sequential/predictable IDs used for resource access without auth checks
- `findUnique({ where: { id } })` without ownership filter (e.g., no `userId` in where clause)
- Missing authorization middleware (distinct from authentication)
- ORM mass assignment: `prisma.*.update({ data: req.body })` or `Model.create(req.body)` without explicit field picking

### Actually Vulnerable
- `GET /api/users/:id` returning any user's data without checking if requester owns that resource
- `DELETE /api/posts/:id` without verifying the post belongs to the authenticated user
- Admin route (`/api/admin/*`) with no role check middleware
- `prisma.order.findUnique({ where: { id: params.id } })` without `userId` filter
- Endpoints using sequential integer IDs with no authorization check
- `prisma.user.update({ where: { id }, data: req.body })` — attacker can set `isAdmin: true`, `role: "admin"`, etc.
- `User.create(req.body)` or `.update(req.body)` in any ORM without allow-listing specific fields

### NOT Vulnerable
- Routes with ownership verification (`where: { id, userId: session.userId }`)
- Admin routes protected by role-checking middleware
- Public resources intentionally accessible to all (e.g., published blog posts)
- Routes using proper ownership verification (e.g., `where: { id, userId: session.userId }`) — UUID vs integer ID does NOT matter; ownership check is what counts
- Resources scoped by tenant/organization with middleware enforcement
- Explicit field destructuring before ORM call: `const { name, email } = req.body` then using only those fields
- Using a Zod/Yup/Joi schema that strips unknown fields before the ORM call

### Context Check
1. Does the route verify the authenticated user owns or has access to the requested resource?
2. Is there authorization middleware applied at the router level?
3. Are these intentionally public endpoints?
4. Is there a tenant/org scoping mechanism in place?
5. Are IDs UUIDs? Note: UUID format alone does NOT prevent IDOR. Ownership verification is still required.

### Files to Check
- `**/api/**/*.ts`, `**/routes/**/*.ts`
- `**/middleware/**/*.ts`
- `**/actions/**/*.ts`, `**/server/**/*.ts`
- `**/controllers/**/*.ts`

---

## CATEGORY 29: File Upload Security

### Detection
- File upload libraries: `multer`, `formidable`, `busboy`, `@uploadthing/*`
- File handling: `multipart/form-data`, file write operations
- Storage patterns: local file storage, S3 uploads, cloud storage

### What to Search For
- File uploads accepting any file type (no extension or MIME type validation)
- User-controlled filenames used directly in file paths (path traversal via `../../`)
- Uploads stored in publicly accessible directories (e.g., `public/uploads/`)
- Missing file size limits on upload endpoints
- No virus/malware scanning on uploaded files
- File type checked only by extension, not by magic bytes/file signature

### Actually Vulnerable
- Upload handler with no file type restriction (`multer()` with no `fileFilter`)
- `path.join(uploadDir, req.file.originalname)` using user-supplied filename directly
- Files saved to `public/uploads/` accessible via direct URL
- No `limits` configuration on multer/formidable (unlimited file size)
- Extension-only validation (`.jpg`) without checking actual file content

### NOT Vulnerable
- File type validation checking both extension and MIME type
- Filenames replaced with generated UUIDs/hashes
- Files stored in private storage (S3 with signed URLs, not public directory)
- File size limits configured on upload middleware
- Upload middleware with proper `fileFilter` configuration

### Context Check
1. Is the filename sanitized or replaced before storage?
2. Is there file type validation beyond just extension?
3. Are uploaded files stored in a private or public location?
4. Are file size limits configured?

### Files to Check
- `**/upload/**/*.ts`, `**/file/**/*.ts`
- `**/api/**/*.ts` (routes handling multipart)
- Multer/formidable configuration files
- Storage utility files

---

## CATEGORY 30: Input Validation & ReDoS

### Detection
- File system operations with user input
- Object merge/assign patterns with external data
- Regular expressions in validation or parsing
- Request body handling configuration
- Template literals with dynamic content

### What to Search For
- Path traversal: `../` in user input passed to file system operations (`fs.readFile`, `path.join`)
- Prototype pollution: `__proto__`, `constructor.prototype` in object merge/spread/assign
- ReDoS: Regex with nested quantifiers (e.g., `(a+)+`, `(a|a)*`, `(.*a){x}`)
- Missing request body size limits on Express/Fastify
- `Object.assign` or spread with untrusted input without property filtering
- Template literal injection in non-SQL contexts (log forging, header injection)

### Actually Vulnerable
- `fs.readFile(path.join(baseDir, req.query.file))` without sanitizing `../` sequences
- `Object.assign(config, req.body)` allowing `__proto__` pollution
- Regex like `/^(a+)+$/` used to validate user input (catastrophic backtracking)
- Express app with no `express.json({ limit: '...' })` body size configuration
- `lodash.merge(defaults, userInput)` with unsanitized user input

### NOT Vulnerable
- File paths validated against an allowlist or using `path.resolve` with base dir check
- Object merge with explicit property picking (`{ name, email } = req.body`)
- Simple regex without nested quantifiers
- Body parser with explicit size limits configured
- Input validated through schema validation (Zod, Joi, Yup)

### Context Check
1. Does user input flow into file system operations?
2. Is object merging done with explicit property selection or raw input?
3. Does the regex have nested quantifiers that could cause backtracking?
4. Is there a body size limit configured on the HTTP framework?

### Files to Check
- `**/api/**/*.ts`, `**/routes/**/*.ts`
- `**/middleware/**/*.ts`, `**/server*.ts`
- `**/validation/**/*.ts`, `**/utils/**/*.ts`
- Express/Fastify app configuration files

---

## CATEGORY 31: CI/CD Pipeline Security

### Detection
- GitHub Actions: `.github/workflows/*.yml`
- GitLab CI: `.gitlab-ci.yml`
- Other CI: `Jenkinsfile`, `.circleci/config.yml`, `azure-pipelines.yml`

### What to Search For
- Secrets hardcoded in workflow files (not using `${{ secrets.* }}`)
- `pull_request_target` trigger with checkout of PR code (script injection vector)
- Workflow `permissions` not scoped (defaults to write-all)
- Expression injection in `run:` steps (e.g., `${{ github.event.issue.title }}` in shell)
- Third-party actions pinned to branch tags instead of commit SHA
- Self-hosted runners without isolation

### Actually Vulnerable
- API key or token as plain string in workflow YAML (not `${{ secrets.KEY }}`)
- Workflow with `pull_request_target` that checks out PR branch and runs PR code
- No `permissions:` key in workflow (inherits overly broad defaults)
- `run: echo ${{ github.event.comment.body }}` (arbitrary code injection via comment)
- `uses: actions/checkout@main` instead of `uses: actions/checkout@SHA`
- Self-hosted runner used for public repository workflows

### NOT Vulnerable
- Secrets referenced via `${{ secrets.* }}` syntax
- `pull_request` trigger (safe, runs in context of PR fork)
- Explicit `permissions:` with minimal scopes (e.g., `contents: read`)
- GitHub context values used in `with:` inputs (not shell `run:`)
- Actions pinned to full SHA (`uses: actions/checkout@abc123...`)
- Self-hosted runners for private repos with proper isolation

### Context Check
1. Is this a public or private repository?
2. Does the workflow use `pull_request_target` with code checkout?
3. Are GitHub context values used in shell `run:` commands or action `with:` inputs?
4. Are third-party actions pinned to commit SHAs?

### Files to Check
- `.github/workflows/*.yml`
- `.gitlab-ci.yml`, `Jenkinsfile`
- `.circleci/config.yml`
- CI/CD configuration in `package.json` scripts

---

## CATEGORY 32: Security Headers

### Detection
- Web frameworks: Next.js, Express, Fastify, Koa
- Header configuration: `next.config.js`, `helmet` middleware, `_headers` files
- Response header setting patterns

### What to Search For
- Missing `Content-Security-Policy` header
- Missing `Strict-Transport-Security` (HSTS) header
- Missing `X-Frame-Options` or `frame-ancestors` CSP directive
- Missing `X-Content-Type-Options: nosniff`
- Missing `Referrer-Policy` header
- Overly permissive CSP (`unsafe-inline`, `unsafe-eval`, wildcard `*` sources)

### Actually Vulnerable
- No CSP header configured anywhere (no `next.config.js` headers, no helmet, no `_headers`)
- No HSTS header on production deployment
- No clickjacking protection (missing both `X-Frame-Options` and CSP `frame-ancestors`)
- CSP with `unsafe-inline` and `unsafe-eval` (defeats purpose of CSP)
- CSP with wildcard sources (`*.example.com` or `*`)
- Missing `X-Content-Type-Options` allowing MIME sniffing

### NOT Vulnerable
- CSP configured in `next.config.js` headers, Express `helmet()`, or `_headers` file
- HSTS configured at infrastructure level (Cloudflare, Vercel, load balancer)
- `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'` set
- CSP with nonce-based inline scripts (not blanket `unsafe-inline`)
- Strict `Referrer-Policy` configured

### Context Check
1. Is CSP configured at application level or infrastructure level?
2. Is HSTS handled by the hosting platform (Vercel, Cloudflare)?
3. Are `unsafe-inline`/`unsafe-eval` required for the framework (some need it with nonces)?
4. Is this an API-only service (some headers less relevant)?

### Files to Check
- `next.config.js`, `next.config.ts` (check `headers()` function)
- `**/middleware*.ts` (check response header setting)
- Express/Fastify app setup files (check for `helmet()`)
- `public/_headers`, `vercel.json`, `netlify.toml`
- `**/server*.ts`, `**/app*.ts`

---

## CATEGORY 33: Unused Dependencies & Package Bloat

### Detection
- `package.json` with `dependencies` and `devDependencies` sections
- Source files across the project that import or require packages

### Active Check Step
For each package listed under `dependencies` (not devDependencies), grep the entire codebase for any import or require of that package:

```
import ... from 'package-name'
require('package-name')
import('package-name')
```

If zero hits are found in source files (excluding `node_modules/`), the package is a candidate for removal.

### What to Search For
- Packages in `dependencies` with no corresponding import/require in any source file
- Large packages with lightweight alternatives:
  - `moment` (330KB) → `date-fns`, `dayjs`, or native `Intl.DateTimeFormat`
  - `lodash` → individual `lodash/function` imports or native JS equivalents
  - `request` (deprecated) → `fetch` (built into Node 18+) or `axios`
  - `node-fetch` → native `fetch` (Node 18+ has it built in)
  - `bluebird` → native `Promise`
- Duplicate functionality packages (e.g., both `axios` AND `node-fetch` installed)
- Build/dev tools listed under `dependencies` instead of `devDependencies`:
  - `eslint`, `prettier`, `typescript`, `jest`, `vitest`, `webpack`, `vite`, `esbuild`
  - `@types/*` packages (always devDependencies)
  - Linting configs, test frameworks, build plugins

### Actually Vulnerable (Flag These)
- Package in `dependencies` with zero import hits in any source file
- `moment` used for simple date formatting when native `Intl` would work
- `lodash` imported as the full library (`import _ from 'lodash'`) and only 1-2 functions used
- Deprecated packages (`request`, `node-fetch` on Node 18+, `unirest`)
- `devDependencies` correctly named tools accidentally placed under `dependencies`
- Both `axios` and `node-fetch` (or similar) installed — pick one

### NOT Vulnerable
- Packages legitimately imported somewhere in source code
- `devDependencies` that are build tools correctly placed
- Packages used only in config files (e.g., `tailwindcss` required by `tailwind.config.js`)
- Packages that are peer dependencies of other installed packages (transitively required)
- Packages used in scripts (e.g., `dotenv` loaded via `node -r dotenv/config`)

### Context Check
1. Search for `import` AND `require` of the package name across all non-node_modules source files
2. Check config files — some packages are loaded there, not in src
3. Is the package a CLI tool invoked in npm scripts (not imported in code)?
4. Is it a peer dependency required by another installed package?
5. Is `devDependencies` placement correct vs `dependencies`?

### Files to Check
- `package.json` (scan every entry under `dependencies`)
- `**/src/**/*.{ts,tsx,js,jsx}`, `**/app/**/*.{ts,tsx}`, `**/pages/**/*.{ts,tsx}`
- Config files: `tailwind.config.*`, `next.config.*`, `jest.config.*`, `vite.config.*`

---

## FINAL REPORT FORMAT

```markdown
# Security Audit Report

## Summary
- **Overall Risk:** [Critical/High/Medium/Low]
- **Findings:** X Critical, X High, X Medium, X Low

## Critical Findings

### 1. [Title]
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

$ARGUMENTS
