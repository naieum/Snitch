## CATEGORY 37: Infrastructure Monitoring & Observability

> **Maps to Upstash Trust Center controls:** "Infrastructure performance monitored", "Log management utilized", "Intrusion detection system utilized", "Vulnerability and system monitoring procedures established"

### Detection
- APM/monitoring packages: `@sentry/node`, `@datadog/datadog-api-client`, `dd-trace`, `newrelic`, `@elastic/apm-node`
- Metrics packages: `prom-client`, `@opentelemetry/*`, `hot-shots` (StatsD)
- Logging packages: `winston`, `pino`, `bunyan` (structured), vs raw `console.log`
- Alerting integrations: PagerDuty, OpsGenie, Slack webhook for alerts

### What to Search For
- APM/monitoring integration (Datadog, New Relic, Sentry, Grafana, Prometheus)
- Structured logging vs raw `console.log` in production
- Alert/notification configuration (PagerDuty, OpsGenie, Slack webhooks for alerts)
- Metric collection (StatsD, Prometheus client, custom metrics)
- Error tracking integration (Sentry DSN, Bugsnag, Rollbar)
- Uptime/health check endpoint existence
- Log levels configured (not all debug in production)
- Distributed tracing (OpenTelemetry, Jaeger, Zipkin)

### Critical
- No error tracking or APM integration in a production application (no Sentry, Datadog, New Relic, or equivalent)
- No structured logging library — production code relies entirely on `console.log` / `console.error`

### High
- No alerting integration — errors captured but no notification channel (PagerDuty, OpsGenie, Slack)
- No metric collection for application performance (no Prometheus, StatsD, or cloud metrics)
- Log level set to `debug` or `trace` in production configuration
- No distributed tracing in a microservices architecture

### Medium
- Structured logging library installed but no log correlation IDs (request tracing across services)
- Error tracking DSN hardcoded instead of environment variable
- No custom application metrics beyond default framework metrics

### Context Check
1. Is this a production application or a prototype/hobby project?
2. Is monitoring handled at infrastructure level (cloud provider monitoring, Vercel analytics)?
3. Does the structured logging library produce JSON or plain text?
4. Are alerts routed to an on-call system or just logged?

### NOT Vulnerable
- Sentry, Datadog, or New Relic properly configured with DSN from environment variables
- Structured logging with `winston` or `pino` producing JSON output
- AlertManager, PagerDuty, or OpsGenie integration for critical errors
- OpenTelemetry or equivalent distributed tracing configured
- Prometheus metrics endpoint exposed for scraping
- Log levels properly configured per environment (debug in dev, info/warn in prod)

### Files to Check
- `**/instrument*.{ts,js}`, `**/tracing*.{ts,js}`, `**/telemetry*.{ts,js}`
- `**/logger*.{ts,js}`, `**/logging*.{ts,js}`
- `**/sentry*.{ts,js}`, `**/datadog*.{ts,js}`, `**/newrelic*.{ts,js}`
- `**/metrics*.{ts,js}`, `**/monitoring*.{ts,js}`
- `.env*` (check for `SENTRY_DSN`, `DD_API_KEY`, `NEW_RELIC_LICENSE_KEY`)
