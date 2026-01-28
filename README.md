# Bridge - Security Audit Plugin for Claude Code

A Claude Code plugin that runs comprehensive security audits on your codebase. Just type `/security` and it'll check your app against 21 security categories.

## What it checks

### 1. Authentication & Sessions
- Password requirements (12+ chars, complexity, breach checking)
- Session management (JWT tokens, secure cookies, expiration)
- API key security (hashed storage, timing-safe comparison)
- Hardcoded credentials in code

### 2. Authorization
- Row Level Security (RLS) on database tables
- Role-based access control
- IDOR vulnerabilities (Insecure Direct Object Reference)
- Privilege escalation paths

### 3. Rate Limiting & Brute Force
- Database-backed rate limiting (not in-memory)
- Progressive account lockout
- IP blocking after repeated violations

### 4. Input Validation & Injection
- SQL injection (string concatenation in queries)
- Command injection (shell execution with user input)
- XSS (unescaped output, raw HTML rendering)
- Schema validation (Zod or similar)

### 5. CSRF Protection
- Double-submit cookie pattern
- Constant-time token comparison
- Secure cookie attributes

### 6. Security Headers
- HSTS, X-Frame-Options, X-Content-Type-Options
- Content-Security-Policy directives
- Permissions-Policy

### 7. SSRF Prevention
- Blocks cloud metadata endpoints (169.254.169.254)
- Blocks localhost/loopback and private IPs
- HTTPS enforcement

### 8. Webhook Security
- HMAC-SHA256 signatures
- Timing-safe signature verification

### 9. Secret Management
- .gitignore excludes sensitive files
- No secrets in git history
- No hardcoded API keys, tokens, passwords

### 10. Data Exposure
- Sensitive data in logs
- Verbose error messages in production
- Debug endpoints exposed

### 11. Cryptography
- No weak hashing (MD5, SHA1 for passwords)
- Secure random number generation
- HTTPS enforcement

### 12. Database Security
- SECURITY DEFINER functions with proper search_path
- Connection pooling
- Encryption at rest/in transit

### 13. Bot Prevention
- CAPTCHA/Turnstile on public forms
- Server-side token validation

### 14. Audit Logging
- Security events logged with severity
- Retention policy (90+ days)

### 15. Dangerous Code Patterns
- Dynamic code execution (eval, Function constructor)
- Shell commands without proper escaping
- Raw HTML injection without sanitization
- Unsafe deserialization in Python
- GitHub Actions workflow injection via untrusted inputs

### 16. AWS Security
- IAM policies with overly permissive `*` actions/resources
- S3 buckets with public access or missing BlockPublicAccess
- Security groups with `0.0.0.0/0` on sensitive ports
- Hardcoded `AKIA*` access keys in code
- Lambda environment variables containing secrets
- CloudFormation/Terraform with public resources or missing encryption

### 17. Google Cloud Security
- IAM bindings with `allUsers` or `allAuthenticatedUsers`
- GCS buckets with public ACLs
- Service account `.json` key files in repo
- Firewall rules with `0.0.0.0/0` ingress
- Cloud SQL with public IP or no SSL

### 18. Vercel Security
- Secrets exposed in `NEXT_PUBLIC_*` environment variables
- Missing security headers in vercel.json
- Production secrets accessible in preview/development
- Secrets in edge runtime code

### 19. Azure Security
- Overly permissive RBAC (`Owner` at subscription level)
- Storage accounts with public blob access
- NSGs with `0.0.0.0/0` on sensitive ports
- Secrets in code vs Key Vault references
- App Service with HTTPS-only disabled or FTP enabled
- Connection strings and SAS tokens in code

### 20. Cloudflare Security
- Secrets in Worker code vs Workers Secrets/KV
- Missing security headers in `_headers` file
- Hardcoded API tokens with overly permissive scopes
- Secrets in `wrangler.toml`

### 21. Firebase Security
- Firestore rules with `allow read, write: if true`
- Storage rules without auth checks
- Firebase API keys without restrictions
- Service account keys in repo
- Cloud Functions without auth validation
- Realtime Database rules with `.read`/`.write` set to `true`

## Installation

### From GitHub (private repo)

```bash
claude plugins add naieum/Bridge
```

### From local directory

If you've cloned the repo:

```bash
claude plugins add /path/to/Bridge
```

## Usage

Once installed, just run:

```
/security
```

Claude will scan your codebase category by category and report any issues it finds. It won't make changes without asking first.

## How it works

The plugin adds a `/security` skill that tells Claude how to systematically audit your code. It uses read-only tools (Grep, Glob, Read) to examine your files and reports findings as it goes.

Each category gets checked one at a time with a summary of what was found. At the end, you get the full picture and can decide what to fix.

## License

MIT
