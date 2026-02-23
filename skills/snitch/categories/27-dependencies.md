## CATEGORY 27: Dependency Vulnerabilities / Supply Chain

### Detection
- Package manifests: `package.json`, `requirements.txt`, `Gemfile`, `go.mod`
- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- CI/CD dependency installation steps

### Active Audit Step (REQUIRED)
Run the appropriate audit command for the project's package manager. This gives authoritative CVE data — do not skip it:

```
npm audit --json          # npm
pnpm audit --json         # pnpm
yarn audit --json         # Yarn 1.x
pip-audit                 # Python
bundle audit              # Ruby
govulncheck ./...         # Go
```

Parse the output and report:
- **Critical/High severity advisories** — flag immediately, include CVE ID and affected version range
- **Moderate severity** — flag if the package is in `dependencies` (production)
- **Low severity in devDependencies** — note but mark as lower priority

### What to Search For
- Missing lockfile entirely (non-deterministic installs)
- `postinstall` scripts in dependencies doing suspicious things (network calls, file writes outside package)
- Typosquatting indicators (packages with names very similar to popular ones)
- Pinned to very old major versions of security-critical packages (e.g., `express` v3, `jsonwebtoken` v7)
- Dependencies with known CVEs in the locked version
- `npm audit` / `yarn audit` equivalent checks not present in CI
- Recently-disclosed 0-days in commonly-used packages — pay particular attention to:
  - React / react-dom (XSS issues in certain render paths)
  - Next.js (path traversal, SSRF, and auth bypass CVEs in older versions)
  - Express (prototype pollution, RegEx DoS in old versions)
  - `jsonwebtoken` (algorithm confusion, none-algorithm bypass in v8 and below)
  - `lodash` (prototype pollution — CVE-2019-10744 and related)
  - `node-fetch` / `axios` (SSRF and header injection in older versions)
  - `multer` / `formidable` (path traversal in older versions)
  - Any package pinned to a version released more than 2 major versions ago

### Actually Vulnerable
- No lockfile committed (anyone running install gets potentially different versions)
- Dependency with a `postinstall` script that downloads and executes remote code
- Package name one character off from a popular package (potential typosquat)
- Security-critical package pinned to end-of-life major version
- Known CVE in locked dependency version with no override or resolution
- `npm audit` returns Critical or High advisories for production dependencies
- Package version falls within a known vulnerable range for a disclosed CVE

### NOT Vulnerable
- Lock file present and committed
- `postinstall` scripts that run standard build steps (tsc, node-gyp)
- Well-known packages from verified publishers
- Packages on current or recent major versions
- Vulnerabilities only in devDependencies not shipped to production
- `npm audit` returns zero Critical/High findings

### Context Check
1. Is the lockfile committed to the repository?
2. Are suspicious postinstall scripts from trusted, well-known packages?
3. Is the outdated package a dev-only dependency or shipped to production?
4. Does the project have automated dependency auditing in CI?
5. Does `npm audit` show any Critical or High advisories? Report the CVE ID and affected package.

### Files to Check
- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `.github/workflows/*.yml` (check for audit steps)
- `.npmrc`, `.yarnrc.yml` (registry configuration)
