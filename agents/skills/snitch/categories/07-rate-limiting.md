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
