## CATEGORY 22: PCI-DSS (Payment Card Industry Data Security Standard)

> **Cross-reference:** PCI-DSS overlaps with Category 13 (Stripe Security) for payment processing. If Stripe/Braintree findings are already reported under Category 13, reference them here rather than reporting twice. Focus this category on raw card handling, TLS configuration, and card data storage.

### Detection
- Payment processing: `card_number`, `credit_card`, `pan`, `payment`
- Card security codes: `cvv`, `cvc`, `security_code`
- Payment processor integrations: Stripe, Braintree, Square

### What to Search For
- Card numbers in logs (Req 3.2)
- Full PAN storage without tokenization (Req 3.4)
- CVV/CVC stored anywhere (Req 3.2 - never store)
- Card data in URLs (Req 4.1)
- Weak TLS configuration (Req 4.1)
- Direct card handling instead of payment processor tokens

### Critical
- Logging statements capturing card number patterns `\d{13,19}`
- Variables storing full card numbers without tokenization
- Any storage or variable containing `cvv`, `cvc`, or `security_code` values
- Card numbers in query params or URL path segments
- `TLS 1.0`, `TLS 1.1`, `SSLv3`, or weak cipher configurations
- Encryption keys hardcoded in source or config files

### High
- Raw card processing logic instead of Stripe/Braintree tokenization
- `card_number`, `pan` variables that aren't tokenized references
- Storing full card + expiry + cardholder name when not business-required

### Context Check
1. Is this actual card data or tokenized references (`pm_`, `tok_` prefixes)?
2. Is the card number regex for validation (not storage)?
3. Is this test code with test card numbers?
4. Does the application use a PCI-compliant payment processor?

### NOT Vulnerable (False Positives)
- Stripe payment method tokens (`pm_*`) or token objects (`tok_*`)
- Card number validation regex (format checking, not storing)
- Test card numbers in test files (`4242424242424242`)
- Last 4 digits only storage (`card_last4`, `last_four`)
- Masked card display (`****1234`)
- Payment processor SDK usage without raw card handling

### Files to Check
- `**/payment*.ts`, `**/checkout*.ts`, `**/billing*.ts`
- `**/stripe*.ts`, `**/braintree*.ts`
- Logging configuration files
- TLS/SSL configuration
- `.env*` for encryption keys
