## CATEGORY 41: License Compliance

> **Cross-reference:** Category 33 covers unused dependencies and package bloat. This category focuses on the legal compliance of dependency licenses in your project, identifying copyleft contamination, incompatible licenses, and missing license declarations.

### Detection

**Package manifest files:**
- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `Gemfile`, `Gemfile.lock`
- `requirements.txt`, `Pipfile`, `pyproject.toml`, `poetry.lock`
- `go.mod`, `go.sum`
- `Cargo.toml`, `Cargo.lock`
- `pom.xml`, `build.gradle`

**License metadata:**
- `license` field in `package.json`
- `LICENSE`, `LICENSE.md`, `LICENSE.txt` files in project root
- SPDX identifiers in package metadata

### What to Search For

**Read the project's license first:**
- Check `LICENSE` file and `package.json` `license` field
- Determine if the project is proprietary, MIT, Apache-2.0, GPL, etc.

**For each production dependency (`dependencies`, not `devDependencies`):**
1. Check the dependency's `license` field in its `package.json` (inside `node_modules/` or in the lockfile)
2. Classify the license:

| License | Type | Risk in Proprietary |
|---------|------|---------------------|
| MIT | Permissive | None |
| ISC | Permissive | None |
| BSD-2-Clause | Permissive | None |
| BSD-3-Clause | Permissive | None |
| Apache-2.0 | Permissive | Low (patent clause) |
| 0BSD | Permissive | None |
| Unlicense | Permissive | None |
| CC0-1.0 | Permissive | None |
| MPL-2.0 | Weak Copyleft | Medium (file-level) |
| LGPL-2.1 | Weak Copyleft | Medium (linking) |
| LGPL-3.0 | Weak Copyleft | Medium (linking) |
| GPL-2.0 | Strong Copyleft | **High** |
| GPL-3.0 | Strong Copyleft | **High** |
| AGPL-3.0 | Network Copyleft | **Critical** |
| SSPL-1.0 | Source-available | **Critical** |
| BSL-1.1 | Source-available | High (time-delayed) |
| CC-BY-SA-4.0 | Copyleft | High |
| (none) | Unknown | Medium |

### Actually Vulnerable (Flag These)

**Critical:**
- AGPL-3.0 dependency in a proprietary/commercial project — AGPL requires source disclosure for network use
- SSPL-1.0 dependency (MongoDB Server License) in any SaaS product — requires open-sourcing your entire service stack
- No `license` field in project's own `package.json` — legal ambiguity

**High:**
- GPL-2.0 or GPL-3.0 dependency in a proprietary project — viral copyleft may require open-sourcing your code
- BSL-1.1 dependency without verifying the "Additional Use Grant" and "Change Date" — may restrict commercial use
- Multiple conflicting copyleft licenses (e.g., GPL-2.0-only + Apache-2.0 are incompatible)

**Medium:**
- LGPL dependency statically linked (bundled/webpack'd) instead of dynamically linked — triggers copyleft obligations
- MPL-2.0 dependency with modifications to the MPL-licensed files — must release modified files
- Dependencies with no license declared (`UNLICENSED` or missing field) — legally unusable
- `CC-BY-NC` (NonCommercial) licensed dependency in a commercial project

**Low:**
- Apache-2.0 dependency without proper NOTICE file attribution
- Large number of distinct license types (>10) — compliance tracking burden

### NOT Vulnerable (Skip These)
- MIT, ISC, BSD, 0BSD, Unlicense, CC0 dependencies in any project type
- GPL dependencies in a GPL-licensed project (compatible)
- Dev-only dependencies (`devDependencies`) — not distributed, no license obligation
- Packages with dual licensing where one option is permissive

### Context Checks
- Is the project proprietary/commercial or open-source? (check LICENSE file)
- Is the dependency in `dependencies` (distributed) or `devDependencies` (not distributed)?
- For LGPL: is the dependency dynamically linked (separate module) or statically bundled?
- For BSL: what is the "Change Date" and "Additional Use Grant"?
- Are there any `NOTICE` or `ATTRIBUTION` files that need updating?

### Files to Check
- `package.json` — project license + all dependency licenses
- `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` — resolved dependency metadata
- `LICENSE`, `LICENSE.md`, `LICENSE.txt` — project license declaration
- `NOTICE`, `ATTRIBUTION` — third-party attribution requirements
- `node_modules/*/package.json` — individual dependency license fields (sample high-risk ones)
