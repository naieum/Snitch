# General Coding Rules

We write code that people trust with their security. That's not nothing.

## Core Principles

**Be clear over clever.** Someone's going to debug this at midnight. Make their life easier. If you need three lines of comments to explain what the code does, the code should probably be simpler.

**Make it real.** Every finding we report has to be provable. We're not pattern-matching robots. If we can't show you the line number, we can't report it. This discipline keeps us honest.

**Default to safe.** Security auditing isn't the place to be creative with edge cases or clever optimizations. When you don't know what something does, lean toward being cautious.

## Code Organization

- **One job per function.** If your function name has "and" in it, split it.
- **Small modules.** A category file should be readable in one sitting. If it's massive, it probably does too much.
- **Consistent naming.** Use clear, descriptive names. `checkForSQLInjection` not `checkStuff1`.

## Comments

Write comments for the *why*, not the what. The code already tells you what it does. We need to know why you did it this way instead of that way.

```typescript
// Bad
// Increment counter
counter++;

// Good
// Skip the first finding if it's in a test file since false positives there are less critical
if (!isTestFile(filepath)) {
  findings.push(finding);
}
```

## TypeScript Specifics

- **Use strict types.** No `any` without a damn good reason. If you've got `any`, add a comment explaining why.
- **Export only what needs exporting.** Keep internals internal.
- **Use const by default.** Only use `let` when you know you're mutating. Never `var`.

## Testing

You're writing code that reviews code. Test your own tests. Seriously.

- Write tests for the detection logic, not just the happy path
- Test edge cases: empty files, comments that look like code, patterns in strings
- If a finding is high-confidence, prove it with a test

## Error Handling

Don't silently fail. If something goes wrong:

1. Log it (but don't expose sensitive info)
2. Tell the user what happened
3. Give them a path forward

We're not going to hide problems in our own tool. That would be embarrassing.
