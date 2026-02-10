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

["project-name]    |\n+------------------------------------------------------------+\n| What would you like to scan?                               |\n|                                                            |\n| [1] Quick Scan (Recommended)                               |\n| [2] Web Security                                           |\n| [3] Secrets & Authentication                              |\n| [4] Modern Stack                                           |\n| [5] Compliance (HIPAA/SOC2/PCI/GDPR)                        |\n| [6] Full System Scan                                       |\n| [7] Custom Selection                                       |\n| [8] Scan Changed Files Only (--diff)                       |\n| [0] Exit                                                   |\n|                                                            |\n| Enter your choice (0-8):                                   |\n+------------------------------------------------------------+\n```\n\n**Quick Scan** uses smart detection to scan only relevant categories based on your tech stack. **Custom Selection** lets you pick specific categories by number or name (e.g., \"1 3 5\" or \"sql injection secrets auth\").\n\n**Command Line Options:** You can also use arguments to bypass the menu:\n\n```bash\n/security --categories=1,2,3,13    # Scan specific categories\n/security --diff                   # Scan only changed files\n```\n\nAfter selecting, Claude will:\n1. Search for security patterns in selected categories\n2. Read the actual code to verify findings\n3. Check context (test file? sanitization? environment guards?)\n4. Report only confirmed issues with evidence\n\n## Output Format"]

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
/plugin install bridge@naieum-bridge
```

Then restart Claude Code.

["project-name]    |\n+------------------------------------------------------------+\n| What would you like to scan?                               |\n|                                                            |\n| [1] Quick Scan (Recommended)                               |\n| [2] Web Security                                           |\n| [3] Secrets & Authentication                              |\n| [4] Modern Stack                                           |\n| [5] Compliance (HIPAA/SOC2/PCI/GDPR)                        |\n| [6] Full System Scan                                       |\n| [7] Custom Selection                                       |\n| [8] Scan Changed Files Only (--diff)                       |\n| [0] Exit                                                   |\n|                                                            |\n| Enter your choice (0-8):                                   |\n+------------------------------------------------------------+\n```\n\n**Quick Scan** uses smart detection to scan only relevant categories based on your tech stack. **Custom Selection** lets you pick specific categories by number or name (e.g., \"1 3 5\" or \"sql injection secrets auth\").\n\n**Command Line Options:** You can also use arguments to bypass the menu:\n\n```bash\n/security --categories=1,2,3,13    # Scan specific categories\n/security --diff                   # Scan only changed files\n```\n\nAfter selecting, Claude will:\n1. Search for security patterns in selected categories\n2. Read the actual code to verify findings\n3. Check context (test file? sanitization? environment guards?)\n4. Report only confirmed issues with evidence\n\n## Output Format"]

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

["project-name]    |\n+------------------------------------------------------------+\n| What would you like to scan?                               |\n|                                                            |\n| [1] Quick Scan (Recommended)                               |\n| [2] Web Security                                           |\n| [3] Secrets & Authentication                              |\n| [4] Modern Stack                                           |\n| [5] Compliance (HIPAA/SOC2/PCI/GDPR)                        |\n| [6] Full System Scan                                       |\n| [7] Custom Selection                                       |\n| [8] Scan Changed Files Only (--diff)                       |\n| [0] Exit                                                   |\n|                                                            |\n| Enter your choice (0-8):                                   |\n+------------------------------------------------------------+\n```\n\n**Quick Scan** uses smart detection to scan only relevant categories based on your tech stack. **Custom Selection** lets you pick specific categories by number or name (e.g., \"1 3 5\" or \"sql injection secrets auth\").\n\n**Command Line Options:** You can also use arguments to bypass the menu:\n\n```bash\n/security --categories=1,2,3,13    # Scan specific categories\n/security --diff                   # Scan only changed files\n```\n\nAfter selecting, Claude will:\n1. Search for security patterns in selected categories\n2. Read the actual code to verify findings\n3. Check context (test file? sanitization? environment guards?)\n4. Report only confirmed issues with evidence\n\n## Output Format"]

## License

MIT
