## CATEGORY 3: Hardcoded Secrets

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
