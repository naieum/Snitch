# Contributing to Snitch

Thanks for wanting to make Snitch better.

## How Snitch works

Snitch is a skill file (`SKILL.md`) that guides AI coding assistants through security audits. The 39 scan categories live as individual files under `categories/`. There's no runtime, no build step, no dependencies — just markdown that tells the AI what to look for and how to verify it.

## Repository structure

```
skills/snitch/
  SKILL.md              # Core framework (menu, execution flow, report format)
  categories/           # 39 individual category guidance files
    01-sql-injection.md
    ...
    39-token-lifetimes.md

agents/skills/snitch/   # Mirror of skills/snitch/ (keep in sync)
```

## Adding or editing a category

1. Edit the file in `skills/snitch/categories/`
2. Copy the same change to `agents/skills/snitch/categories/`
3. If adding a new category, update the file listing and menu in `SKILL.md` (both copies)
4. Test by running `/snitch` and selecting your category against a real codebase

## What makes a good category file

- **Detection** — what imports, packages, or patterns indicate this tech is in use
- **What to Search For** — specific grep patterns and file globs
- **Actually Vulnerable** — concrete examples of real issues
- **NOT Vulnerable** — common false positives to skip
- **Context Check** — questions to ask before reporting a finding
- **Files to Check** — glob patterns for relevant files

## Submitting a PR

- Keep `skills/snitch/` and `agents/skills/snitch/` in sync
- Test your changes with an actual scan
- One category per PR unless they're closely related

## Reporting false positives

If Snitch reports something that isn't a real vulnerability, open a [False Positive issue](https://github.com/naieum/Snitch/issues/new?template=false_positive.md). These are the most valuable bug reports — they make Snitch smarter for everyone.
