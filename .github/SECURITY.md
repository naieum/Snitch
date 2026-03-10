# Security Policy

## Reporting a vulnerability

If you find a security issue in Snitch itself (not a finding from a scan), please email **security@snitch.live** instead of opening a public issue.

We'll respond within 48 hours and work with you on a fix before any public disclosure.

## Scope

This policy covers vulnerabilities in Snitch's skill files that could cause:

- The AI to execute unintended actions (prompt injection in category files)
- Secrets or sensitive data to be exposed in scan output despite redaction rules
- The AI to modify files during the scan phase (violating read-only mode)

## Out of scope

- Findings produced by Snitch scans (those are features, not bugs)
- Issues in the AI coding assistants themselves (Claude Code, Gemini CLI, etc.)
