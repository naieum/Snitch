## CATEGORY 30: Input Validation & ReDoS

### Detection
- File system operations with user input
- Object merge/assign patterns with external data
- Regular expressions in validation or parsing
- Request body handling configuration
- Template literals with dynamic content

### What to Search For
- Path traversal: `../` in user input passed to file system operations (`fs.readFile`, `path.join`)
- Prototype pollution: `__proto__`, `constructor.prototype` in object merge/spread/assign
- ReDoS: Regex with nested quantifiers (e.g., `(a+)+`, `(a|a)*`, `(.*a){x}`)
- Missing request body size limits on Express/Fastify
- `Object.assign` or spread with untrusted input without property filtering
- Template literal injection in non-SQL contexts (log forging, header injection)

### Actually Vulnerable
- `fs.readFile(path.join(baseDir, req.query.file))` without sanitizing `../` sequences
- `Object.assign(config, req.body)` allowing `__proto__` pollution
- Regex like `/^(a+)+$/` used to validate user input (catastrophic backtracking)
- Express app with no `express.json({ limit: '...' })` body size configuration
- `lodash.merge(defaults, userInput)` with unsanitized user input

### NOT Vulnerable
- File paths validated against an allowlist or using `path.resolve` with base dir check
- Object merge with explicit property picking (`{ name, email } = req.body`)
- Simple regex without nested quantifiers
- Body parser with explicit size limits configured
- Input validated through schema validation (Zod, Joi, Yup)

### Context Check
1. Does user input flow into file system operations?
2. Is object merging done with explicit property selection or raw input?
3. Does the regex have nested quantifiers that could cause backtracking?
4. Is there a body size limit configured on the HTTP framework?

### Files to Check
- `**/api/**/*.ts`, `**/routes/**/*.ts`
- `**/middleware/**/*.ts`, `**/server*.ts`
- `**/validation/**/*.ts`, `**/utils/**/*.ts`
- Express/Fastify app configuration files
