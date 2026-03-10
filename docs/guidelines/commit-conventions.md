# Commit Conventions

Clear commits make for clean history. When you're trying to find what broke something, bad commits are worse than useless—they're actively harmful.

## Format

```
<type>: <subject>

<body>

<footer>
```

### Type

- **feat** — New audit category, new detection pattern, new feature
- **fix** — Bug in detection logic, false positive, broken finding
- **refactor** — Code cleanup that doesn't change behavior
- **test** — Test additions or fixes
- **docs** — Documentation updates, README changes
- **chore** — Dependencies, build stuff, no code changes

Keep it lowercase.

### Subject

- **One line, 50 characters max.** If you can't describe it in one line, you're probably doing too much in one commit.
- **Present tense.** "Add SQL injection detection" not "Added SQL injection detection"
- **No period at the end.**
- **Be specific.** "Fix category 7" tells me nothing. "Fix race condition in rate limit detection" tells me what actually changed.

### Body

Only if needed. Explain *why* you did this, not *what* you did (the diff shows that).

```
Add timeout handling for expensive regex patterns

Some security checks involve complex regex that can hang on pathological
input. Added 1-second timeout to prevent audit process from stalling
on large files.
```

### Footer

Link to issues if relevant:

```
Fixes #123
Relates to #456
```

## Examples

Good:
```
feat: add detection for hardcoded ngrok tokens in wrangler.toml

The new tunnel & DNS category needs to catch dev credentials that slip into
production. Checks wrangler.toml for pattern matching ngrok auth tokens.
```

Bad:
```
update stuff
```

```
feat: add a new thing for detection
```

## When to Commit

- **After each logical change.** One feature, one commit (or a few if it's complex).
- **Before switching tasks.** Don't leave uncommitted changes sitting around.
- **Run a diff scan first.** `--diff` mode catches security findings you just introduced. Don't be that person.

## No Squashing Historicalnical commits

We keep history clean so when you're investigating "when did this start failing?", you can actually find it.
