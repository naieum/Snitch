## CATEGORY 19: SMS/Communication Security (Twilio)

### Detection
- `twilio` imports
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` environment variables

### What to Search For
- Auth tokens in client code
- User-controlled phone numbers
- Missing webhook verification

### Critical
- `TWILIO_AUTH_TOKEN` in client-side code
- Account SID + Auth Token in frontend files

### High
- User-controlled phone numbers without validation (SMS pumping attack)
- No rate limiting on SMS endpoints
- Missing webhook signature validation (`validateRequest`)

### Medium
- Phone numbers logged without masking
- No verification of phone number ownership before sending

### Context Check
1. Is the SMS endpoint server-only and rate-limited?
2. Are phone numbers validated and verified before sending?
3. Is webhook signature validation applied to incoming Twilio requests?
4. Are phone numbers masked in logs?

### NOT Vulnerable
- Twilio credentials in server-only code
- Properly validated phone numbers with ownership verification
- Rate-limited SMS endpoints

### Files to Check
- `**/twilio*.ts`, `**/sms*.ts`
- `pages/api/*sms*`, `app/api/*sms*`
- `.env*`
