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
