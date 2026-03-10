## CATEGORY 35: Security Governance Certifications (ISO 27001 / FedRAMP / CMMC)

> **Cross-reference:** Overlaps with Category 21 (SOC 2) for audit logs and Category 11 (Cloud Security) for IAM/cloud config. Only flag here for ISO 27001 / FedRAMP / CMMC specific gaps — not for general cloud or logging issues already covered by those categories.

### Detection
- Keywords in code/config: `iso27001`, `fedramp`, `cmmc`, `govcloud`, `cui`, `nist800`, `ato`
- `.gov` or `.mil` domains in config/env variables
- `us-gov-*` AWS regions, Azure Government endpoints, GovCloud references
- DoD contract or classification comments (`// CUI`, `// FOUO`, `// CONTROLLED`)
- SSP (System Security Plan) or POA&M references in docs

### What to Search For
- CUI handling: files processing `cui`, `controlled unclassified`, `fouo` without encryption wrapper
- FedRAMP boundary: API calls to non-GovCloud endpoints where federal data context exists
- Audit completeness: privileged operations (user deletion, role change, key rotation) missing audit log entries
- Access control: admin/privileged routes missing MFA enforcement or role-based check
- Data classification: sensitive handlers with no classification labeling
- Incident response: no error/event hooks that could feed a SIEM or alerting system
- CMMC Level 2: multi-factor auth not enforced for privileged accounts, no session timeout
- ISO 27001 A.10: sensitive data stored without encryption at rest
- ISO 27001 A.15: third-party/vendor access not documented or restricted

### Critical
- CUI data transmitted without TLS or stored unencrypted (CMMC L2 AC.2.006)
- Federal data processed outside FedRAMP-authorized boundary (non-GovCloud endpoint)
- No audit log on privileged operations (ISO 27001 A.12.4, CMMC AU.2.041)

### High
- Admin endpoints with no MFA enforcement (ISO 27001 A.9.4, CMMC IA.3.083)
- Missing data retention or deletion policy for sensitive records (ISO 27001 A.8.3)
- No incident response hook or alerting mechanism (ISO 27001 A.16, FedRAMP IR controls)
- Session timeout not enforced for privileged sessions (CMMC AC.2.007)

### Medium
- No data classification labels on sensitive model or handler files
- Third-party/vendor data processors not documented or access-controlled (ISO 27001 A.15)
- Encryption-at-rest not documented for sensitive databases

### Context Check
1. Is this application under a government contract, FedRAMP ATO, or CMMC certification scope?
2. Are CUI markers in comments indicating awareness, or actual unprotected sensitive data?
3. Is the audit log gap in production code or test scaffolding?

### NOT Vulnerable (False Positives)
- `govcloud` string in comments discussing migration plans (not actual endpoints)
- CUI labels in documentation/markdown files (not in code handling data)
- Missing audit logs in test helpers or fixtures

### Files to Check
- `**/admin*.{ts,js}`, `**/privileged*.{ts,js}`
- `.env*` files with `GOV`, `FEDERAL`, `CUI` vars
- `**/models/*.{ts,js}` for data classification
- `**/routes/**`, `**/api/**` for access control enforcement
