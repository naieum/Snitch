## CATEGORY 15: AI API Security (OpenAI, Anthropic, etc.)

### Detection
- `openai`, `@anthropic-ai/sdk`, `ai` imports
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` environment variables

### What to Search For
- API keys in client code or public env vars
- Missing rate limiting on AI endpoints
- Prompt injection vulnerabilities

### Critical
- `OPENAI_API_KEY` or `sk-*` (OpenAI format) in client-side code
- `ANTHROPIC_API_KEY` in frontend files
- AI API keys in `NEXT_PUBLIC_*` variables

### High
- No rate limiting on AI endpoints (cost explosion risk)
- User input passed directly to system prompts without sanitization (prompt injection)
- Missing token/cost limits on API calls (`max_tokens` not set)

### Medium
- API keys in git history (check `.env` not in `.gitignore`)
- No error handling exposing raw API errors to users
- No input length validation before API calls

### Context Check
1. Is the AI endpoint server-only or accessible from client code?
2. Are there cost controls (max_tokens, rate limits) on AI endpoints?
3. Is user input sanitized before inclusion in prompts?
4. Are AI API errors properly caught and sanitized before returning to users?

### NOT Vulnerable
- API keys in server-only code (API routes, server actions)
- `NEXT_PUBLIC_*` variables for non-secret config (model names, etc.)
- Properly sanitized user input in prompts

### Files to Check
- `**/openai*.ts`, `**/ai/**`, `**/chat/**`
- `pages/api/ai*`, `pages/api/chat*`
- `app/api/ai*`, `app/api/chat*`
- `.env*`, `lib/ai*.ts`
