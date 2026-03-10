## CATEGORY 17: Database Security (Prisma, Drizzle, Raw Connections)

### Detection
- `@prisma/client`, `drizzle-orm`, `pg`, `mysql2` imports
- `DATABASE_URL`, `POSTGRES_URL` environment variables

### What to Search For
- Connection strings in client code
- Raw SQL with user input
- Missing query safety measures

### Critical
- `DATABASE_URL` with credentials in client-side code
- Connection strings in `NEXT_PUBLIC_*` variables
- `$queryRaw` or `$executeRaw` with string interpolation (SQL injection)
- Template literals with `${userInput}` in raw SQL

### High
- Prisma `$queryRawUnsafe` usage with any user input
- Raw SQL queries built with string concatenation
- Missing connection pooling for serverless (no PgBouncer/Prisma Accelerate)

### Medium
- Prisma schema with `@db.VarChar` without explicit length limits
- No query timeouts configured
- Database errors exposed to users without sanitization

### Context Check
1. Is the raw SQL using parameterized placeholders or string interpolation?
2. Does user input actually flow into the query, or is it hardcoded/server-generated?
3. Is the database connection server-only or potentially exposed to client code?
4. Is there an ORM layer handling escaping automatically?

### NOT Vulnerable
- `DATABASE_URL` in server-only code
- Parameterized queries with `Prisma.sql` template tag
- ORM queries (Prisma/Drizzle) with proper escaping
- Raw queries with only hardcoded values

### Files to Check
- `prisma/schema.prisma`, `drizzle.config.ts`
- `**/db*.ts`, `lib/prisma.ts`, `lib/db.ts`
- `.env*`
