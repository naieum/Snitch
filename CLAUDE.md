# Snitch - Security Audit Plugin

This repository contains **Snitch**, a Claude Code security audit plugin.

## Important Context for Editing

- **`skills/snitch/SKILL.md`** is the Snitch audit skill. It guides Claude through security audits of other projects.

## Report Generation

When writing security audit reports, **do not reproduce dangerous pattern strings verbatim**. Instead:
- Reference findings by file path and line number
- Describe the pattern type (e.g., "uses dynamic code evaluation" or "shell command with user input")
- Quote only the minimal non-triggering portion of the code, or describe it

This prevents report output from being blocked by security hooks that scan for dangerous substrings.
