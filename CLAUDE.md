# SAP - Security Audit Plugin

This is a **security scanning tool** repository. The codebase intentionally references dangerous code patterns as detection targets, not as vulnerable code.

## Important Context for Editing

- **`bleed-cli/src/scanner.js`**, **`bleed-cli/src/signatures.json`**, and **`bleed-cli/src/semantic-analyzer.js`** contain pattern definitions (regexes, function name lists, substring matches) used to *detect* malicious code. These files will trigger Claude's built-in security warnings on first edit per session — this is expected and can be safely acknowledged.

- **`test-evil/`** contains intentionally malicious test fixtures. Do not edit these files. They exist to validate that the scanner correctly detects threats.

- **`skills/security/SKILL.md`** is the Bridge audit skill. It guides Claude through security audits of other projects.

## Report Generation

When writing security audit reports, **do not reproduce dangerous pattern strings verbatim**. Instead:
- Reference findings by file path and line number
- Describe the pattern type (e.g., "uses dynamic code evaluation" or "shell command with user input")
- Quote only the minimal non-triggering portion of the code, or describe it

This prevents report output from being blocked by security hooks that scan for dangerous substrings.
