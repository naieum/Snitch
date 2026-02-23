## CATEGORY 36: Business Continuity & Disaster Recovery

> **Maps to Upstash Trust Center controls:** "Continuity and Disaster Recovery plans established", "Continuity and disaster recovery plans tested", "Backup processes established", "Infrastructure performance monitored"

### Detection
- Health check endpoints: `/health`, `/ready`, `/live`, `/healthz`, `/readyz`, `/livez`
- Process signal handlers: `SIGTERM`, `SIGINT`, `process.on('beforeExit')`
- Circuit breaker libraries: `opossum`, `cockatiel`, custom circuit breaker patterns
- Retry/backoff patterns: `retry`, `exponential-backoff`, `p-retry`
- IaC backup configs: Terraform `aws_db_instance` with `backup_retention_period`, RDS snapshots

### What to Search For
- Health check / readiness / liveness endpoints
- Graceful shutdown handlers (`SIGTERM`, `SIGINT`, `process.on('beforeExit')`)
- Circuit breaker patterns (library-based or custom state machines)
- Retry logic with exponential backoff
- Database connection pool failover / reconnect logic
- Backup configuration in IaC (Terraform backup resources, RDS snapshots, etc.)
- Multi-region / multi-AZ deployment configs
- Queue dead-letter configs (DLQ)
- Error recovery / fallback patterns

### Critical
- No health check endpoint found in any server entry point (no `/health`, `/ready`, or equivalent)
- No graceful shutdown handler — server does not listen for `SIGTERM` or `SIGINT`
- Database connections with no reconnect logic and no connection pool (single connection, crash on disconnect)

### High
- No circuit breaker or retry pattern for external service calls (API, database, cache)
- No dead-letter queue configuration for async message processing
- No backup configuration in IaC for production databases
- Missing connection pool failover (single-host connection string with no fallback)

### Medium
- Health endpoint returns 200 without actually checking downstream dependencies
- Retry logic without exponential backoff (fixed delay or no delay)
- No multi-AZ or multi-region configuration in IaC

### Context Check
1. Does the application have a health check endpoint that verifies actual service health?
2. Does the server handle `SIGTERM` gracefully (drain connections, close pools)?
3. Are external service calls wrapped in circuit breakers or retry logic?
4. Is there backup configuration for production data stores?

### NOT Vulnerable
- Health endpoints that check database and cache connectivity before returning 200
- Graceful shutdown draining in-flight requests before exit
- Circuit breaker libraries wrapping external API calls
- Retry with exponential backoff and jitter
- IaC with automated backup and point-in-time recovery configured
- Kubernetes liveness/readiness probes defined in deployment manifests

### Files to Check
- `**/server*.{ts,js}`, `**/app*.{ts,js}`, `**/index*.{ts,js}` (entry points)
- `**/health*.{ts,js}`, `**/ready*.{ts,js}`
- `**/*.tf`, `**/docker-compose*.yml`, `**/k8s/**/*.yml`
- `**/queue*.{ts,js}`, `**/worker*.{ts,js}`
