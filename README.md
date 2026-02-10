# Bridge - Security Audit Plugin for Claude Code

A Claude Code plugin that runs evidence-based security audits. Unlike automated scanners that flood you with false positives, Bridge uses Claude's reasoning to understand context and only report real issues.

## The Problem with Automated Scanners

Traditional security scanners pattern-match without understanding context. They see `api_key = "..."` and flag it, even if it's:
- In a comment explaining what NOT to do
- A test placeholder value
- A detection pattern in a security tool

Result: 500 findings, 499 false positives. Alert fatigue. Real issues get missed.

## How Bridge is Different

Bridge gives Claude the security knowledge (what patterns to look for) but requires evidence for every claim:

1. **Must read actual files** - No finding without calling Read/Grep first
2. **Must quote exact code** - Show the vulnerable line with file:line reference
3. **Must check context** - Is this test code? Is there sanitization nearby?
4. **Must verify claims** - If the code doesn't match, retract the finding

## What it Checks

### 23 Security Categories

**Core Security**
1. **SQL Injection** - String concatenation in queries
2. **XSS** - Unsafe HTML rendering
3. **Hardcoded Secrets** - API keys, passwords in code
4. **Authentication** - Missing auth, weak JWT, insecure sessions
5. **SSRF** - User-controlled URLs in fetch/request
6. **Rate Limiting** - Unprotected auth endpoints
7. **CORS** - Misconfigured cross-origin settings
8. **Cryptography** - Weak hashing, predictable random
9. **Dangerous Patterns** - Code evaluation, command injection
10. **Cloud Security** - AWS/GCP/Azure misconfigurations
11. **Data Exposure** - Secrets in logs, verbose errors

**Modern Stack Security**
12. **Supabase** - Missing RLS, service role key exposure, wide-open policies
13. **Stripe** - Secret key exposure, missing webhook signature verification
14. **Auth Providers** - Clerk, Auth0, NextAuth secret exposure, missing middleware
15. **AI APIs** - OpenAI/Anthropic key exposure, prompt injection, missing rate limits
16. **Email Services** - Resend, SendGrid, Postmark key exposure, spam relay prevention
17. **Database** - Prisma/Drizzle raw query injection, connection string exposure
18. **Redis/Upstash** - Token exposure, unencrypted sensitive data in cache
19. **Twilio** - Auth token exposure, SMS pumping prevention, webhook verification

**Compliance**
20. **HIPAA** - PHI exposure in logs, unencrypted health data, missing audit trails
21. **SOC 2** - Missing audit logs, weak passwords, no MFA on admin routes
22. **PCI-DSS** - Card data in logs, raw PAN storage, CVV retention, weak TLS
23. **GDPR** - Missing consent, no data deletion/export endpoints, excessive data collection

## Installation

In Claude Code, run:

```
/plugin marketplace add naieum/Bridge
/plugin install bridge@naieum-Bridge
```

Then restart Claude Code.

> **Note:** If updating from a previous version, uninstall first with `/plugin uninstall bridge@naieum-Bridge`, then reinstall.

## Usage

```
/security
```

You'll see an interactive menu with options:
- **Quick Scan** - Smart detection selects relevant categories
- **Web Security** - SQLi, XSS, CORS, SSRF, dangerous patterns
- **Secrets & Auth** - Hardcoded secrets, authentication, rate limiting
- **Modern Stack** - Stripe, auth providers, AI APIs, email, database, etc.
- **Compliance** - HIPAA, SOC 2, PCI-DSS, GDPR
- **Full System** - All 23 categories
- **Custom Selection** - Pick by number or name
- **Scan Changed Files** - Git diff mode

**Quick Scan** uses smart detection to scan only relevant categories based on your tech stack. **Custom Selection** lets you pick categories by number or name (e.g., "1 3 5" or "sql injection secrets auth").

**Command Line Options:** You can also use arguments to bypass the menu:

```bash
/security --categories=1,2,3,13    # Scan specific categories
/security --diff                   # Scan only changed files
```

After selecting, Claude will:
1. Search for security patterns in selected categories
2. Read the actual code to verify findings
3. Check context (test file? sanitization? environment guards?)
4. Report only confirmed issues with evidence

## Output Format

Every finding includes:
- **File and line number** - Exact location
- **Code snippet** - The actual vulnerable code
- **Why it's vulnerable** - Context explanation
- **How to fix** - Specific remediation

## Anti-Hallucination Rules

The skill enforces these rules to prevent false claims:

1. No findings without reading the actual file first
2. No summary claims like "found 47 issues" without evidence
3. Every finding must quote the exact code
4. Context check required (test file? mitigations nearby?)

## Version History

- **2.2.0** - Added interactive scan selection menu with smart detection
- **2.1.0** - Added HIPAA, SOC 2, PCI-DSS, and GDPR compliance categories (20-23)
- **2.0.0** - Complete rewrite with anti-hallucination rules and context-aware analysis
- **1.0.0** - Initial release with 21 security categories

## License

MIT
