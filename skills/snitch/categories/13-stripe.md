## CATEGORY 13: Stripe Security

### Detection
- `stripe` or `@stripe/stripe-js` imports
- `STRIPE_` environment variables

### What to Search For
- Secret keys in client code or public env vars
- Webhook endpoints without signature verification
- Test keys in production without env guards

### Critical
- `STRIPE_SECRET_KEY` or `sk_live_*` in client-side code
- `STRIPE_SECRET_KEY` in `NEXT_PUBLIC_*` variables
- Webhook endpoint missing `stripe.webhooks.constructEvent` verification

### High
- Test keys (`sk_test_*`) in production code without environment guards
- Missing `STRIPE_WEBHOOK_SECRET` verification in webhook handlers
- Hardcoded price IDs that should be environment variables

### Medium
- Publishable key (`pk_*`) hardcoded instead of environment variable
- Missing idempotency keys on payment intents

### Context Check
1. Is this server-only code or client-accessible code?
2. Are webhook endpoints properly validating Stripe signatures?
3. Are test keys guarded by environment checks (NODE_ENV)?

### NOT Vulnerable
- `STRIPE_SECRET_KEY` in server-only code (API routes, server actions)
- Publishable key (`pk_*`) in client code (expected)
- Test keys in test files or development configuration

### Files to Check
- `**/stripe*.ts`, `**/checkout*.ts`, `**/webhook*.ts`
- `pages/api/webhook*`, `app/api/webhook*`
- `.env*`, `next.config.*`
