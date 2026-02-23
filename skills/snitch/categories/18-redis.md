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
