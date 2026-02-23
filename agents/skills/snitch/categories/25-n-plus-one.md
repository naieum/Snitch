## CATEGORY 25: N+1 Queries

### Detection
- ORM usage: `@prisma/client`, `drizzle-orm`, `typeorm`, `sequelize`, `mongoose`
- Database queries inside loops or array iteration methods
- GraphQL resolvers with per-field data fetching

### What to Search For
- ORM `findUnique`/`findFirst`/`findOne` inside `for`/`forEach`/`map` loops
- `await` database calls inside loop bodies
- GraphQL field resolvers making individual database queries without DataLoader
- Missing `include`/`select`/`populate` for relations accessed after initial query
- `fetch()` per-item in loops in server-side code

### Actually Vulnerable
- `prisma.user.findUnique()` called inside a `for` loop iterating over IDs
- `await db.query()` inside `array.map()` or `forEach()`
- GraphQL resolver fetching related records one-by-one without batching
- Fetching a list then looping to fetch each item's relations separately
- Sequential API calls per-item when a batch endpoint exists

### NOT Vulnerable
- Single queries with `include`/`select` loading relations eagerly
- Batch operations: `findMany`, `WHERE IN`, `Promise.all` with batch fetch
- GraphQL resolvers using DataLoader for batching
- Loop queries where the loop is bounded to a small known size (< 5)
- Client-side fetching in user-triggered handlers (not render loops)

### Context Check
1. Is the database call actually inside a loop or iteration?
2. Could this be replaced with a single query using `include`, `WHERE IN`, or batch fetch?
3. Is the loop bounded to a small constant or potentially unbounded?
4. Is this server-side code (performance impact) or client-side (less concern)?

### Files to Check
- `**/api/**/*.ts`, `**/routes/**/*.ts`
- `**/services/**/*.ts`, `**/resolvers/**/*.ts`
- `**/actions/**/*.ts`, `**/server/**/*.ts`
- GraphQL resolver files
