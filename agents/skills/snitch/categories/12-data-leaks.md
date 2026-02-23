## CATEGORY 12: Logging and Data Exposure

### Detection
- Logging libraries: `winston`, `pino`, `morgan`, `bunyan`, `console.log`
- Error handling: `catch` blocks, error middleware, error boundary components
- Debug configuration: `DEBUG=*`, `NODE_ENV` checks

### What to Search For
- Sensitive data in logs
- Stack traces to clients
- Debug mode in production
- Verbose error responses

### Actually Vulnerable
- Passwords or tokens in log statements
- Stack traces returned in API responses
- Debug enabled in production config

### NOT Vulnerable
- Logging without sensitive data
- Development-only verbose errors
- Redacted logging
- Error tracking with PII filtering

### Context Check
1. Does the log statement include sensitive data (passwords, tokens, PII)?
2. Is verbose error output guarded by a NODE_ENV check?
3. Is this a development/debug log or production logging?

### Files to Check
- `**/logger*.ts`, `**/logging*.ts`
- `**/error*.ts`, `**/middleware*.ts`
- Error boundary components, API error handlers
