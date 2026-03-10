## CATEGORY 26: Performance Problems

### Detection
- Synchronous file system operations in request handlers
- Database queries without indexes or limits
- Full library imports in client bundles
- Missing pagination on list endpoints
- Sequential independent async operations

### What to Search For
- `fs.readFileSync`/`writeFileSync` in request handlers (not config/build scripts)
- Prisma schema fields used in `where`/`orderBy` without `@@index`
- `findMany({})`/`.find({})` without `take`/`limit` clause
- `import _ from 'lodash'` (full library) in client-side code
- List/search endpoints without pagination parameters (`skip`, `take`, `page`, `limit`)
- Sequential independent `await` calls that should be `Promise.all`
- Inline object/array literals in JSX props of mapped components (causes re-renders)

### Actually Vulnerable
- `fs.readFileSync` inside an API route handler or middleware
- Database query on a frequently-filtered field with no index defined
- `findMany({})` returning entire table with no limit
- Full lodash import (`import _ from 'lodash'`) in a client-side bundle
- API endpoint returning all records with no pagination
- Three sequential `await` calls to independent services (should be parallel)

### NOT Vulnerable
- `readFileSync` in config loading at startup or build scripts
- Queries on primary keys or already-indexed fields
- `findMany` with explicit `take`/`limit` clause
- Tree-shakeable imports (`import { debounce } from 'lodash/debounce'`)
- Endpoints with cursor/offset pagination
- Sequential awaits where each depends on the previous result

### Context Check
1. Is the sync file operation in a request handler or at startup/build time?
2. Is the unindexed field actually used in production queries?
3. Is the unbounded query on a table that will remain small or could grow large?
4. Are the sequential awaits actually independent or do they depend on each other?

### Files to Check
- `**/api/**/*.ts`, `**/routes/**/*.ts`, `**/middleware/**/*.ts`
- `prisma/schema.prisma` (check `@@index` directives)
- `**/components/**/*.tsx` (check imports and JSX props)
- `**/pages/**/*.tsx`, `**/app/**/*.tsx`
