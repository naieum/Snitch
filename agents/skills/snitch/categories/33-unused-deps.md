## CATEGORY 33: Unused Dependencies & Package Bloat

### Detection
- `package.json` with `dependencies` and `devDependencies` sections
- Source files across the project that import or require packages

### Active Check Step
For each package listed under `dependencies` (not devDependencies), grep the entire codebase for any import or require of that package:

```
import ... from 'package-name'
require('package-name')
import('package-name')
```

If zero hits are found in source files (excluding `node_modules/`), the package is a candidate for removal.

### What to Search For
- Packages in `dependencies` with no corresponding import/require in any source file
- Large packages with lightweight alternatives:
  - `moment` (330KB) → `date-fns`, `dayjs`, or native `Intl.DateTimeFormat`
  - `lodash` → individual `lodash/function` imports or native JS equivalents
  - `request` (deprecated) → `fetch` (built into Node 18+) or `axios`
  - `node-fetch` → native `fetch` (Node 18+ has it built in)
  - `bluebird` → native `Promise`
- Duplicate functionality packages (e.g., both `axios` AND `node-fetch` installed)
- Build/dev tools listed under `dependencies` instead of `devDependencies`:
  - `eslint`, `prettier`, `typescript`, `jest`, `vitest`, `webpack`, `vite`, `esbuild`
  - `@types/*` packages (always devDependencies)
  - Linting configs, test frameworks, build plugins

### Actually Vulnerable (Flag These)
- Package in `dependencies` with zero import hits in any source file
- `moment` used for simple date formatting when native `Intl` would work
- `lodash` imported as the full library (`import _ from 'lodash'`) and only 1-2 functions used
- Deprecated packages (`request`, `node-fetch` on Node 18+, `unirest`)
- `devDependencies` correctly named tools accidentally placed under `dependencies`
- Both `axios` and `node-fetch` (or similar) installed — pick one

### NOT Vulnerable
- Packages legitimately imported somewhere in source code
- `devDependencies` that are build tools correctly placed
- Packages used only in config files (e.g., `tailwindcss` required by `tailwind.config.js`)
- Packages that are peer dependencies of other installed packages (transitively required)
- Packages used in scripts (e.g., `dotenv` loaded via `node -r dotenv/config`)

### Context Check
1. Search for `import` AND `require` of the package name across all non-node_modules source files
2. Check config files — some packages are loaded there, not in src
3. Is the package a CLI tool invoked in npm scripts (not imported in code)?
4. Is it a peer dependency required by another installed package?
5. Is `devDependencies` placement correct vs `dependencies`?

### Files to Check
- `package.json` (scan every entry under `dependencies`)
- `**/src/**/*.{ts,tsx,js,jsx}`, `**/app/**/*.{ts,tsx}`, `**/pages/**/*.{ts,tsx}`
- Config files: `tailwind.config.*`, `next.config.*`, `jest.config.*`, `vite.config.*`
