## CATEGORY 39: Token & Session Lifetime Analysis

> **Cross-reference:** Category 4 covers auth mechanism security (weak JWT secrets, open redirects). Category 14 covers provider misconfiguration. Category 21 flags *missing* timeouts for SOC 2 compliance. This category evaluates whether *configured* lifetimes are reasonable for the application's use case, whether refresh flows exist, and whether logout actually invalidates tokens.

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
- Same duration for all token types (copy-paste pattern — access, refresh, and API tokens all set to `'1h'`)
- Hardcoded magic numbers with no explanatory comment or env var (e.g., `expiresIn: 86400` with no context)

### Medium
- Tutorial-default `'1h'` or `'7d'` with no evidence of deliberate choice (no comment, no env var, no docs)
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
- `expiresIn: '1h'` with an explanatory comment like `// 1 hour access, refresh handles long sessions`
- Logout endpoint that calls `session.destroy()`, deletes refresh token from DB, or adds JWT to server-side blocklist

### Files to Check
- `**/auth*.{ts,js}`, `**/session*.{ts,js}`, `**/login*.{ts,js}`
- `**/logout*.{ts,js}`, `**/refresh*.{ts,js}`, `**/token*.{ts,js}`
- `**/api/auth/**`, `**/middleware*.{ts,js}`
- `.env*`, `**/config/**`
