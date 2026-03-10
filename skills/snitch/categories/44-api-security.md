## CATEGORY 44: API Security

### Detection
- OpenAPI/Swagger specification files (`openapi.yaml`, `swagger.json`)
- API route handlers (Express, Fastify, Next.js API routes, Flask, Django REST)
- GraphQL schemas and resolvers
- REST API middleware and controllers

### What to Search For
- OpenAPI/Swagger specs: endpoints without `security` schemes defined
- Missing authentication middleware on sensitive endpoints (CRUD operations)
- Excessive data exposure (returning full database objects instead of DTOs/projections)
- Mass assignment (accepting arbitrary fields from request body directly into database updates)
- Missing rate limiting on expensive operations (search, export, report generation)
- Broken function-level authorization (admin endpoints accessible without role check)
- GraphQL: introspection enabled in production, no query depth or complexity limits
- Missing pagination on list endpoints (unbounded result sets)
- Inconsistent error responses (stack traces or internal details in some endpoints)
- Missing request validation schemas (no zod, joi, yup, or equivalent validation)
- API versioning issues (no version prefix, breaking changes without version bump)
- Missing CORS restrictions on API endpoints

### Actually Vulnerable
- API endpoint with no authentication middleware that performs database writes
- Route handler that spreads request body directly into a database update (`...req.body`)
- List endpoint returning all records with no `limit` or pagination
- Admin-only operation (delete user, change role) with no role/permission check
- GraphQL server with introspection enabled and no query depth limit in production
- Error handler returning full stack trace or database error messages to client
- OpenAPI spec with endpoints missing `security` field (no auth required)
- API that returns full user objects including `passwordHash`, `internalId`, or `stripeCustomerId`

### NOT Vulnerable
- Authentication middleware applied to all routes (or explicit public route allowlist)
- DTO/projection pattern — only selected fields returned from queries
- Request validation with schema library (zod, joi, yup, class-validator)
- Pagination enforced with maximum page size
- Role-based access control middleware on admin routes
- GraphQL depth and complexity limits configured
- Error handler that returns generic messages with correlation IDs
- API versioning with `/api/v1/` prefix

### Context Check
1. Is authentication middleware applied globally or per-route? Are there intentionally public endpoints?
2. Are database objects transformed before being returned (DTO pattern)?
3. Is request body validated before being used in database operations?
4. Are list endpoints paginated with a maximum page size?
5. Are admin operations protected by role/permission checks?
6. Is GraphQL introspection disabled in production?

### Files to Check
- `openapi.yaml`, `openapi.json`, `swagger.yaml`, `swagger.json`
- `**/routes/**`, `**/api/**`, `**/controllers/**`, `**/handlers/**`
- `**/middleware/**` (auth, validation, rate limiting)
- `**/graphql/**`, `**/schema/**`, `**/resolvers/**`
- `**/dto/**`, `**/serializers/**`
