## CATEGORY 14: Auth Provider Security (Clerk, Auth0, NextAuth)

### Detection
- `@clerk/nextjs`, `@auth0/nextjs-auth0`, `next-auth` imports
- `CLERK_`, `AUTH0_`, `NEXTAUTH_` environment variables

### What to Search For
- Secret keys exposed to client
- Missing middleware on protected routes
- Weak or missing secrets

### Clerk Critical
- `CLERK_SECRET_KEY` in client-side code or `NEXT_PUBLIC_*`
- Missing `authMiddleware` or `clerkMiddleware` on protected routes

### Auth0 Critical
- `AUTH0_SECRET` or `AUTH0_CLIENT_SECRET` in frontend code
- `AUTH0_ISSUER_BASE_URL` mismatch with allowed callback URLs

### NextAuth Critical
- `NEXTAUTH_SECRET` exposed in client code
- `NEXTAUTH_SECRET` shorter than 32 characters
- `secret` option missing in NextAuth config
- Callbacks without proper validation

### High (All Providers)
- JWT secrets in client bundles
- Missing CSRF protection on auth endpoints
- Redirect URL validation missing (open redirect vulnerability)
- Session tokens stored in localStorage (should be httpOnly cookies)

### Context Check
1. Is auth middleware applied at the router/layout level covering all protected routes?
2. Are secrets in server-only files or potentially bundled into client code?
3. Is redirect URL validation handled by the auth provider or custom code?

### NOT Vulnerable
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in client (expected)
- Secret keys in server-only code
- Auth middleware properly applied at router level

### Files to Check
- `middleware.ts`, `middleware.js`
- `**/auth/**`, `pages/api/auth/**`, `app/api/auth/**`
- `auth.config.*`, `auth.ts`, `.env*`
