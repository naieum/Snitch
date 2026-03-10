## CATEGORY 38: Data Classification & Lifecycle

> **Maps to Upstash Trust Center controls:** "Data classification policy established", "Data retention procedures established", "Customer data deleted upon leaving", "Data encryption utilized"
>
> **Cross-reference:** Overlaps with Category 23 (GDPR) for data deletion/export and Category 20 (HIPAA) for PHI handling. Only flag here for classification labeling, retention TTLs, and lifecycle management not covered by those categories.

### Detection
- Data model definitions: Prisma schema, Drizzle schema, Mongoose models, TypeORM entities
- TTL/expiry patterns: `expiresAt`, `ttl`, `retentionDays`, `deleteAfter`
- Cleanup/purge jobs: `cron`, `node-cron`, `@upstash/qstash`, scheduled functions
- PII markers: `@sensitive`, `@pii`, `@classified`, data classification decorators

### What to Search For
- Data classification labels/markers on models or schemas
- Data retention TTLs / cleanup jobs / cron for purging old data
- Customer data export endpoints (data portability)
- Customer data deletion cascades (account deletion completeness)
- PII field markers/decorators in schemas
- Sensitive data segregation (separate tables/collections for PII)
- Data anonymization/pseudonymization functions

### Critical
- User/customer data with no deletion mechanism — account deletion leaves orphan records in related tables
- PII stored alongside non-sensitive data with no field-level encryption or access segregation

### High
- No data retention policy — no TTL, `expiresAt`, or cleanup job for any user-generated data
- No data classification markers on schemas containing PII fields (email, phone, address, SSN, DOB)
- Account deletion endpoint exists but does not cascade to all related tables (partial deletion)
- Sensitive data (tokens, keys, PII) stored in same table/collection as public data with no access differentiation

### Medium
- No anonymization or pseudonymization functions for analytics data derived from PII
- Data retention TTLs defined but no automated cleanup job to enforce them
- No customer data export/portability endpoint (beyond GDPR scope — general best practice)

### Context Check
1. Does the application store PII (email, phone, address, financial data)?
2. Is there a data retention policy defined (even informally in docs)?
3. Does account deletion cascade to all related tables and external services?
4. Are PII fields identifiable in schemas (labeled, commented, or in separate models)?

### NOT Vulnerable
- Schemas with explicit PII markers or comments identifying sensitive fields
- Automated cleanup jobs (cron, scheduled function) purging expired data
- Account deletion that cascades to all related records (ON DELETE CASCADE or application-level)
- Separate encrypted tables/collections for PII with restricted access
- Data anonymization applied before analytics processing
- Data export endpoint returning user's data in portable format

### Files to Check
- `prisma/schema.prisma`, `**/schema*.{ts,js}`, `**/models/**/*.{ts,js}`
- `**/cron*.{ts,js}`, `**/jobs/**/*.{ts,js}`, `**/cleanup*.{ts,js}`
- `**/delete*account*.{ts,js}`, `**/account*delete*.{ts,js}`
- `**/anonymize*.{ts,js}`, `**/pseudonymize*.{ts,js}`
- `**/export*data*.{ts,js}`, `**/data*export*.{ts,js}`
