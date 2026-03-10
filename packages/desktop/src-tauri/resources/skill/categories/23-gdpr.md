## CATEGORY 23: GDPR (General Data Protection Regulation)

### Detection
- Personal data handling: `personal_data`, `pii`, `data_subject`
- Consent management: `consent`, `opt_in`, `gdpr`
- Data subject rights: `right_to_delete`, `right_to_access`, `data_export`
- EU user detection: locale, region, or country checks for EU

### What to Search For
- Data collection without consent verification
- Missing data deletion endpoints
- Missing data export/portability endpoints
- Excessive data collection
- No data retention policies
- Third-party data sharing without consent
- Analytics/tracking without consent checks

### Critical
- Personal data collection without `consent`, `opt_in`, or `agreed` verification (Art 6)
- No data deletion capability for personal data (Art 17 - Right to Erasure). Search broadly for ANY of these patterns:
  - Route/endpoint names: `delete`, `remove`, `erase`, `purge`, `destroy`, `forget`, `wipe`, `clear`
  - Function names: `deleteUser`, `removeAccount`, `eraseUser`, `forgetMe`, `purgeData`, `destroyAccount`, `closeAccount`, `deactivateAccount`
  - Combined with: `user`, `account`, `profile`, `data`, `personal`, `member`, `customer`
  - API paths: `/delete`, `/remove`, `/erase`, `/account/close`, `/me/delete`, `/privacy/delete`
  - If ANY deletion mechanism exists (regardless of naming), it satisfies Art 17
- No data export/portability capability (Art 20 - Right to Data Portability). Search broadly for ANY of these patterns:
  - Route/endpoint names: `export`, `download`, `portability`, `extract`, `dump`, `backup`, `archive`
  - Function names: `exportData`, `downloadData`, `getUserData`, `getMyData`, `extractData`, `generateReport`, `downloadProfile`
  - Combined with: `user`, `account`, `profile`, `data`, `personal`, `member`, `customer`
  - API paths: `/export`, `/download`, `/me/data`, `/privacy/export`, `/account/data`
  - File generation: `csv`, `json`, `pdf`, `zip` exports of user data
  - If ANY export mechanism exists (regardless of naming), it satisfies Art 20
- EU user data sent to non-EU endpoints without transfer safeguards (Art 44-49)

### High
- Collecting unnecessary fields (SSN, DOB when not business-required) (Art 5)
- Personal data without `ttl`, `expiresAt`, or cleanup jobs (Art 5)
- PII sent to external APIs without consent verification (Art 44)
- Analytics or tracking initialized without consent banner check (Art 7)
- Missing incident response or breach notification patterns (Art 33)

### Medium
- No `anonymize`, `pseudonymize`, or `hash` functions for analytics data (Art 25)
- Cookie consent not verified before setting non-essential cookies

### Context Check
1. Does the application actually handle EU user data?
2. Is consent managed at a different layer (consent management platform)?
3. Are there data processing agreements with third parties?
4. Is this personal data or anonymous/aggregated data?

### NOT Vulnerable
- Consent verification before data collection
- Any working data deletion mechanism, regardless of naming convention
- Any working data export/download mechanism, regardless of naming convention
- Anonymized or pseudonymized data for analytics
- Proper data retention with automated cleanup
- Consent management platform integration
- Third-party services with DPAs in place

### Files to Check
- User registration and data collection endpoints
- Privacy/settings pages
- Account management pages (settings, profile, close account)
- Analytics initialization code
- Data export/deletion handlers (search broadly: `delete`, `remove`, `export`, `download`, `extract`, etc.)
- Cookie consent components
- Third-party integrations sending user data
- Admin panels with user management features
