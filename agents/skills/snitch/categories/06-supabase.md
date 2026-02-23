## CATEGORY 6: Supabase Security

### Detection
- `@supabase/supabase-js`, `@supabase/ssr` imports
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` environment variables
- Supabase migration files in `supabase/migrations/`

### What to Search For
- Tables without RLS in migrations
- Service role key in client code
- Service role in NEXT_PUBLIC variables
- RLS policies using just true

### Actually Vulnerable
- CREATE TABLE without matching RLS enablement
- Service role key passed to client-side code
- Service role key in public environment variables
- RLS policies that allow everything

### NOT Vulnerable
- Tables with RLS enabled and real policies
- Service role in server-only code
- Anon key in client code (expected)
- Intentionally public tables

### Context Check
1. Does each table have matching RLS?
2. Do RLS policies actually restrict access?
3. Is service role key server-side only?

### Files to Check
- `supabase/migrations/**`, `supabase/seed.sql`
- `lib/supabase*.ts`, `utils/supabase*.ts`
- `.env*`, `next.config.*`
