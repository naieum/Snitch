## CATEGORY 20: HIPAA (Healthcare Information Portability and Accountability Act)

### Detection
- Health-related data models: `patient`, `medical`, `diagnosis`, `prescription`, `treatment`
- Healthcare terms in schemas, APIs, or variables: `PHI`, `ePHI`, `clinical`, `healthcare`
- Medical identifiers: `mrn`, `medical_record`, `insurance_id`, `health_plan`, `provider_npi`

### What to Search For
- PHI logged to console or logging systems
- Unencrypted health data storage
- Missing audit trails on health endpoints
- PHI exposed in URLs or query parameters
- Health data in error messages

### Critical
- `console.log`, `logger.*` with patient data, diagnosis, prescription, or medical records
- Health data stored without `encrypt`, `cipher`, or `aes` protection
- Patient IDs or MRNs in URL path segments or query parameters
- Patient data leaked in catch blocks or error responses

### High
- Health endpoints without audit log decorators or middleware
- HTTP (non-HTTPS) endpoints handling health data
- Health data endpoints without role-based access control checks
- No data retention/deletion patterns for health records

### Context Check
1. Is this in test code or production code?
2. Is the data actually PHI (protected health information)?
3. Is there encryption or audit logging applied elsewhere in the stack?
4. Does the application actually handle healthcare data?

### NOT Vulnerable
- Health-related variable names in test files with mock data
- Encrypted PHI with proper key management
- Audit-logged health endpoints with RBAC
- Development/staging environments with synthetic data

### Files to Check
- `**/patient*.ts`, `**/medical*.ts`, `**/health*.ts`
- `**/ehr/**`, `**/clinical/**`
- API routes handling health data
- Database schemas with health-related tables
