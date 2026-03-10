# Skill Development Guidelines

Adding a new security category to Snitch is how the tool actually gets better. This guide walks you through it.

## Before You Code

**Does this finding matter?**

Not every security pattern is worth checking. Ask yourself:
- Can actual harm come from this? (Not just theoretical harm. Real harm.)
- Is it specific enough that we won't report 500 false positives?
- Can we actually verify it's real? (File read, line number, proof.)

If you're unsure, bring it up. That's what the community is for.

## Category Structure

Each category lives in `skills/snitch/categories/`. The filename is the pattern: `XX-name.md` where XX is the category number.

```
categories/
  07-rate-limiting.md
  13-stripe.md
  15-ai-apis.md
```

## Category File Format

```markdown
# Category 7: Rate Limiting

## What We're Looking For

Endpoints without rate limiting are dinner bells for bots. Someone can try a million passwords, scrape your entire database, or just tank your infrastructure.

## How We Check

- Scans for middleware setup (express-rate-limit, etc.)
- Checks endpoint decorators/annotations
- Looks for fallback mechanisms
- Verifies limits are actually applied to sensitive endpoints (login, password reset, file uploads)

## What We're NOT Checking

- Internal service-to-service calls (different threat model)
- Endpoints behind authentication already (usually fine)
- Rate limiting on static assets (handled by CDN)

## Common Issues

1. **Limits too loose.** 1000 requests per minute isn't a limit, it's permission.
2. **Only on some endpoints.** If you rate limit login but not password reset, that's not helpful.
3. **Key collisions.** Rate limiting by IP when requests come through a proxy means legitimate users get blocked.

## Pattern Examples

### Good
- Express: `rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })` on login
- Framework-agnostic: Custom middleware checking request count in Redis

### Bad
- No rate limiting at all on sensitive endpoints
- Rate limiting only on public endpoints
- Limits stored in memory (lost on restart)

## Implementation Details

[Include specific detection code examples]

## References

- CWE-770: Allocation of Resources Without Limits or Throttling
- OWASP: API1:2023 Broken Object Level Authorization
- CVSS v4.0: Network/Adjacent attack vector

## False Positive Prevention

Common reasons this might NOT be a finding:
- Endpoint is behind authentication with per-user rate limiting
- API is internal-only (check for documentation or env check)
- Rate limiting is on the CDN or gateway (check infrastructure as code)
```

## Writing the Detection Logic

Your category file gets converted to instructions for the audit. Keep these principles:

**Be specific about what files to check.**
- Don't scan everything. Tell Claude: "Check middleware setup, auth handlers, main route files"
- Exclude test files, fixtures, node_modules (we handle this automatically)

**Give examples of what's dangerous.**
```
An endpoint that accepts user passwords should have:
1. Rate limiting middleware applied
2. Max 5 attempts per 15 minutes per IP
3. Progressive backoff (delays between attempts get longer)

Check for middleware declarations and endpoint setup.
```

**Call out false positives.**
```
You might see rate limiting in:
- Test files (ignore)
- Comments about future rate limiting (that's not real)
- Rate limiting on the wrong endpoints (report it, it's a finding)
```

## Finding Tags

Every finding needs these fields. They go in the report and feed into your GRC tools.

```
- **CWE:** [CWE number and description]
- **OWASP Top 10:2025:** [Which one(s)]
- **CVSS 4.0:** [Score and reasoning]
- **Severity:** Critical / High / Medium / Low
- **File:** [exact path]
- **Line:** [exact line]
- **Code:** [minimal quote proving the issue]
- **Fix:** [how to actually fix this]
```

## Validation Signals (Quick Scan)

Quick Scan can now emit **Validation Signals** (`VS-001` to `VS-006`) in addition to findings.
These are assurance checks, not replacements for findings.

Rules:
- No evidence, no signal.
- Every signal must include file path and line.
- Use only: `pass`, `warn`, `fail`.
- If a signal confirms a real vulnerability, report it as a normal finding too.

## Testing Your Category

Before submitting:

1. **Run it on a real project.** Preferably one you know well. Do the findings make sense?
2. **Check for false positives.** Run it on a project that *doesn't* have the vulnerability. Do you get noise?
3. **Verify the fix works.** Apply your suggested fix, run the audit again, confirm the finding goes away.

## Tone & Language

Match the README. We're talking to developers, not compliance officers.

Bad:
> Insufficient rate limiting implementation detected. Remediation required per OWASP standards.

Good:
> This endpoint accepts passwords but has no rate limiting. Someone can try a million passwords and eventually get in. Apply rate limiting—5 attempts per 15 minutes should do it.

## Submission Checklist

- [ ] Category file is clear and specific
- [ ] Detection logic is testable
- [ ] False positive scenarios are called out
- [ ] CWE/OWASP/CVSS tags are accurate
- [ ] Tested on real projects (positive and negative cases)
- [ ] Examples use actual framework code
- [ ] Tone matches the rest of Snitch

New categories make this tool better. Don't overthink it.
