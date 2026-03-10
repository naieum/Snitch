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

### Reachability Analysis

After finding CVEs via `npm audit` or equivalent, perform a reachability check to reduce noise:

1. **Read the advisory** to identify the vulnerable function/export in the affected package
2. **Search the project's imports** for that package (`import ... from 'package-name'` or `require('package-name')`)
3. **Trace whether the specific vulnerable function** is imported and called in the project
4. **If not reachable** → downgrade finding to Informational severity with note "(unreachable)"
5. **If reachable** → keep original severity and show the call chain

Example finding with reachability:
```
## Finding: CVE-2024-XXXXX in lodash@4.17.20
- **Vulnerable function:** lodash.template() (prototype pollution)
- **Reachable:** YES — imported in src/email/render.ts:3, called at line 47
- **Severity:** High (reachable)
```

vs:

```
## Finding: CVE-2024-YYYYY in axios@0.21.1
- **Vulnerable function:** axios.interceptors (SSRF via redirect)
- **Reachable:** NO — project imports axios but never uses interceptors
- **Severity:** Informational (unreachable)
```

### Supply Chain Behavior Analysis

In addition to CVE checks, analyze dependency behavior for supply chain threats:

- **Typosquatting detection:** Check for packages within edit-distance 1 of popular packages (e.g., `lodassh` instead of `lodash`, `expres` instead of `express`). Flag any suspiciously-named packages.
- **Suspicious install scripts:** Flag `preinstall`/`postinstall` scripts in dependencies that run network commands (`curl`, `wget`), download binaries, or execute encoded commands. Standard build steps (`tsc`, `node-gyp`, `esbuild`) are NOT suspicious.
- **Obfuscated code:** Flag dependencies containing base64-encoded strings longer than 100 characters, dynamic code evaluation on decoded content, or hex-encoded payloads.
- **Package age:** Flag dependencies published less than 7 days ago with very few downloads — these may be newly-published malicious packages.
- **Permission overreach:** Flag packages that access filesystem, network, or child_process when their stated purpose does not require it (e.g., a "color formatting" library making HTTP requests).
