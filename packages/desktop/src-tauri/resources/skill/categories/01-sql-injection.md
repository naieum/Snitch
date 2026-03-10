## CATEGORY 1: SQL Injection

### Detection
- Raw SQL usage: `pg`, `mysql2`, `better-sqlite3`, `knex` imports
- Query builder or ORM raw methods: `$queryRaw`, `$executeRaw`, `sql.raw`, `knex.raw`
- Database connection patterns without an ORM

### What to Search For
- String concatenation in SQL queries
- Template literal interpolation in queries
- Format string interpolation in queries

### Actually Vulnerable
- Direct string concatenation building SQL with user input
- Template literals inserting variables directly into SQL strings
- Python format strings with user variables in SQL

### NOT Vulnerable
- Parameterized queries with placeholders ($1, ?, :name)
- ORM methods that handle escaping (Prisma, TypeORM, Sequelize)
- Queries in comments or documentation
- Queries with only hardcoded values

### Context Check
1. Does user input actually flow into this query?
2. Is there validation/sanitization before this line?
3. Is this in test code or production code?

### Files to Check
- `**/db*.ts`, `**/query*.ts`, `**/sql*.ts`
- `**/repository*.ts`, `**/model*.ts`
- Database migration files, raw query utilities
