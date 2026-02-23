## CATEGORY 16: Email Service Security (Resend, SendGrid, Postmark)

### Detection
- `resend`, `@sendgrid/mail`, `postmark` imports
- `RESEND_API_KEY`, `SENDGRID_API_KEY`, `POSTMARK_API_TOKEN` environment variables

### What to Search For
- API keys in client code
- User-controlled email addresses or content
- Missing rate limiting

### Critical
- `RESEND_API_KEY`, `SENDGRID_API_KEY`, or `POSTMARK_API_TOKEN` in client-side code
- Email API keys in `NEXT_PUBLIC_*` variables

### High
- User-controlled `to` address without validation (spam relay)
- User-controlled email content without sanitization (email injection via headers)
- Missing rate limiting on email endpoints

### Medium
- User-controlled `from` address (spoofing)
- No domain verification for sender addresses
- Logging full email content including sensitive data

### Context Check
1. Is the email endpoint server-only or accessible from client code?
2. Is the recipient address hardcoded or user-controlled?
3. Is there rate limiting to prevent email flooding?
4. Is email content sanitized to prevent header injection?

### NOT Vulnerable
- API keys in server-only code
- Hardcoded recipient for contact forms
- Properly validated email addresses

### Files to Check
- `**/email*.ts`, `**/send*.ts`, `**/mail*.ts`
- `pages/api/*mail*`, `app/api/*mail*`
- `lib/email*.ts`, `.env*`
