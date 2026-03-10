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
