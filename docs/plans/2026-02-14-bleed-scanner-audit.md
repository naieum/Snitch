# bleed Scanner Ground-Up Audit

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all bugs in bleed-cli so it runs correctly, produces accurate scan results, and leverages its full feature set (semantic analysis, cross-file correlation).

**Architecture:** bleed-cli is a Node.js CLI scanner (`bin/bleed.js` -> `src/scanner.js`) that pattern-matches against `src/signatures.json`, then optionally enhances findings with AST-based semantic analysis (`src/semantic-analyzer.js`), cross-file correlation (`src/cross-file-analyzer.js`), and user feedback filtering (`src/feedback-system.js`). The UI is `src/ui.js` (blessed TUI + fallback console).

**Tech Stack:** Node.js, Commander.js, @babel/parser, @babel/traverse, blessed, glob

---

## Phase 1: Stabilize (Make scanner.js load and run)

### Task 1: Remove duplicate LEGACY_PATTERNS declaration

**Files:**
- Modify: `bleed-cli/src/scanner.js:15`

**Step 1: Read the file to confirm current state**

Run: `node -e "require('./bleed-cli/src/scanner')" 2>&1 | head -5`
Expected: SyntaxError about LEGACY_PATTERNS redeclaration

**Step 2: Delete line 15**

Remove `const LEGACY_PATTERNS = [];` on line 15. The real declaration with actual patterns is on line 45.

**Step 3: Verify the file parses**

Run: `node -e "try { require('./bleed-cli/src/scanner'); console.log('OK') } catch(e) { console.log(e.message) }"`
Expected: Will still fail (more bugs), but NOT with "LEGACY_PATTERNS has already been declared"

**Step 4: Commit**

```
git add bleed-cli/src/scanner.js
git commit -m "fix(bleed): remove duplicate LEGACY_PATTERNS const declaration"
```

---

### Task 2: Fix broken brace structure in scan loop

**Files:**
- Modify: `bleed-cli/src/scanner.js:353-423`

**Context:** The scan loop has mismatched braces caused by debug code inserted mid-loop. Lines 365-387 contain debug `console.log` statements with extra/orphan closing braces that break the `for (const pattern ...)` loop nesting.

**Step 1: Replace the entire scan loop block**

Replace lines 353-422 (the comment `// Enhanced scanning with all patterns` through the closing brace of the category loop) with this corrected version:

```javascript
      // Enhanced scanning with all patterns
      for (const category of ALL_PATTERNS) {
        for (const pattern of category.patterns) {
          let matches;

          if (pattern instanceof RegExp) {
            matches = content.match(pattern);
          } else {
            matches = content.match(pattern);
          }

          if (matches) {
            for (const match of matches) {
              const index = content.indexOf(match);

              // Skip if in safe context
              if (this.isInSafeContext(content, index)) continue;

              // Skip if in test/example file
              if (this.isTestOrExample(filePath, content)) continue;

              // Enhanced context analysis
              const contextScore = this.threatAnalyzer.analyzeContext(filePath, content, index);
              const threatScore = this.threatAnalyzer.calculateThreatScore(
                category.name.toLowerCase().replace(/\s+/g, '_'),
                { weight: 0.5 },
                contextScore
              );

              const finding = {
                severity: this.adjustSeverity(category.severity, threatScore),
                category: category.name,
                pattern: pattern.toString().slice(0, 50) + '...',
                file: filePath,
                line: this.getLineNumber(content, index),
                evidence: match.slice(0, 100),
                match: match,
                threatScore: threatScore,
                contextScore: contextScore
              };

              this.findings.push(finding);
              this.ui.displayFinding(finding, this.findings.length);
            }
          }
        }
      }
```

This removes:
- Debug `console.log` on line 366
- Debug block lines 370-377 (test-evil debug check with orphan brace)
- Debug block lines 379-386 (wallet.js debug check)
- All orphan closing braces (lines 368, 377)

**Step 2: Verify syntax**

Run: `node -e "try { require('./bleed-cli/src/scanner'); console.log('OK') } catch(e) { console.log(e.message) }"`
Expected: Will still fail (fileFindings bug), but no SyntaxError

**Step 3: Commit**

```
git add bleed-cli/src/scanner.js
git commit -m "fix(bleed): repair broken brace structure in scan loop, remove debug logs"
```

---

### Task 3: Fix undefined `fileFindings` variable

**Files:**
- Modify: `bleed-cli/src/scanner.js:444-447`

**Context:** Lines 444-446 reference `fileFindings` which is never declared. The semantic analysis block tries to enhance per-file findings but has no local variable to work with.

**Step 1: Fix the semantic analysis block**

Replace lines 443-447:
```javascript
      // Enhanced semantic analysis
      if (this.options.enableSemanticAnalysis) {
        const semanticFindings = await this.semanticAnalyzer.analyzeFile(filePath, content, fileFindings);
        fileFindings = fileFindings.map(finding => this.mergeSemanticAnalysis(finding, semanticFindings));
      }
```

With:
```javascript
      // Enhanced semantic analysis
      if (this.options.enableSemanticAnalysis) {
        const fileFindings = this.findings.filter(f => f.file === filePath);
        const enhancedFindings = await this.semanticAnalyzer.analyzeFile(filePath, content, fileFindings);
        // Replace file's findings with semantically enhanced versions
        this.findings = this.findings.filter(f => f.file !== filePath).concat(enhancedFindings);
      }
```

**Why this works:** `analyzeFile` already returns enhanced findings (it calls `enhanceFindingsWithSemantics` internally and returns the mapped array). We don't need `mergeSemanticAnalysis` at all since the semantic analyzer already does the merge.

**Step 2: Verify scanner loads**

Run: `node -e "require('./bleed-cli/src/scanner'); console.log('Scanner loaded OK')"`
Expected: `Scanner loaded OK`

**Step 3: Smoke test — scan test-evil/**

Run: `cd bleed-cli && node bin/bleed.js scan ../test-evil/ --quiet --output json 2>&1 | head -30`
Expected: JSON output with findings (not a crash). The scanner should now actually run.

**Step 4: Commit**

```
git add bleed-cli/src/scanner.js
git commit -m "fix(bleed): resolve undefined fileFindings, wire up semantic analysis correctly"
```

---

### Task 4: Remove dead `mergeSemanticAnalysis` method

**Files:**
- Modify: `bleed-cli/src/scanner.js:454-477` (line numbers approximate after prior edits)

**Step 1: Delete the `mergeSemanticAnalysis` method**

Remove the entire method (it's no longer called after Task 3):
```javascript
  /**
   * Merge semantic analysis into findings
   */
  mergeSemanticAnalysis(finding, semanticFindings) {
    ...
  }
```

**Step 2: Verify scanner still loads**

Run: `node -e "require('./bleed-cli/src/scanner'); console.log('OK')"`
Expected: `OK`

**Step 3: Commit**

```
git add bleed-cli/src/scanner.js
git commit -m "refactor(bleed): remove unused mergeSemanticAnalysis method"
```

---

## Phase 2: Validate (Fix semantic analysis, add tests)

### Task 5: Fix `isInTestCode` — check line containment, not just presence

**Files:**
- Modify: `bleed-cli/src/semantic-analyzer.js:329-341`

**Context:** `isInTestCode` currently returns true if ANY test function or test import exists anywhere in the file. It should check if the finding's line is WITHIN a test function body.

**Step 1: Replace `isInTestCode`**

```javascript
  isInTestCode(analysis, line) {
    // Check if line is inside a test function body
    const testFunctions = analysis.functions.filter(fn =>
      fn.name && /test|spec|it|describe|before|after/i.test(fn.name)
    );

    const insideTestFn = testFunctions.some(fn => {
      const fnStart = fn.line;
      const fnEnd = fn.body?.loc?.end?.line;
      return fnEnd ? (line >= fnStart && line <= fnEnd) : false;
    });

    if (insideTestFn) return true;

    // Fallback: check if file imports test libraries
    const testImports = analysis.imports.filter(imp =>
      /jest|mocha|chai|vitest|@testing-library/i.test(imp.source)
    );

    return testImports.length > 0;
  }
```

**Step 2: Commit**

```
git add bleed-cli/src/semantic-analyzer.js
git commit -m "fix(bleed): isInTestCode now checks line containment within test functions"
```

---

### Task 6: Fix `involvesUserInput` — getFindingContext returns object, not string

**Files:**
- Modify: `bleed-cli/src/semantic-analyzer.js:346-351`

**Context:** `getFindingContext` (line 373) returns `{ functions: [...], calls: [...] }` but `involvesUserInput` calls `.includes()` on it, which is a string method.

**Step 1: Replace `involvesUserInput`**

```javascript
  involvesUserInput(analysis, finding) {
    const userInputVars = analysis.dataFlow.userInputSources.map(src => src.source);
    if (userInputVars.length === 0) return false;

    // Check if any nearby function calls reference user input variables
    const nearbyCalls = analysis.calls.filter(call =>
      Math.abs(call.line - finding.line) <= 3
    );

    const nearbyCallNames = nearbyCalls.map(c => c.name);
    const nearbyCallArgs = nearbyCalls.flatMap(c =>
      (c.args || []).map(arg => arg.name || arg.value || '').filter(Boolean)
    );
    const allNearbyTokens = [...nearbyCallNames, ...nearbyCallArgs];

    return userInputVars.some(input => {
      const parts = input.split('.');
      return parts.some(part => allNearbyTokens.some(token => token.includes(part)));
    });
  }
```

**Step 2: Commit**

```
git add bleed-cli/src/semantic-analyzer.js
git commit -m "fix(bleed): involvesUserInput now correctly inspects nearby AST calls"
```

---

### Task 7: Fix `isInExportedFunction` — check line range, not just ordering

**Files:**
- Modify: `bleed-cli/src/semantic-analyzer.js:356-360`

**Context:** Current logic just checks if any function and any export have lines <= finding line. It should check if the finding is inside a function that is also exported.

**Step 1: Replace `isInExportedFunction`**

```javascript
  isInExportedFunction(analysis, line) {
    // Check if finding is inside any function
    const containingFn = analysis.functions.find(fn => {
      const fnStart = fn.line;
      const fnEnd = fn.body?.loc?.end?.line;
      return fnEnd ? (line >= fnStart && line <= fnEnd) : false;
    });

    if (!containingFn) return false;

    // Check if that function is exported (by name or by line proximity)
    return analysis.exports.some(exp =>
      exp.name === containingFn.name ||
      exp.line === containingFn.line ||
      Math.abs(exp.line - containingFn.line) <= 1
    );
  }
```

**Step 2: Commit**

```
git add bleed-cli/src/semantic-analyzer.js
git commit -m "fix(bleed): isInExportedFunction checks containment, not just ordering"
```

---

### Task 8: Fix duplicate `CallExpression` visitor in `analyzeDataFlow`

**Files:**
- Modify: `bleed-cli/src/semantic-analyzer.js:264-291`

**Context:** `analyzeDataFlow` has two `CallExpression` handlers in the same `traverse()` call (lines 264 and 279). In a Babel traverse visitor object, duplicate keys mean the second overwrites the first — so external network calls are never detected.

**Step 1: Merge the two CallExpression handlers**

Replace lines 249-292 (the full `traverse` call in `analyzeDataFlow`):

```javascript
    traverse(ast, {
      // Identify potential user input sources
      MemberExpression: (path) => {
        const obj = path.node.object;
        const prop = path.node.property;

        if (obj.name === 'req' || obj.name === 'request') {
          dataFlow.userInputSources.push({
            source: `${obj.name}.${prop.name}`,
            line: path.node.loc?.start?.line
          });
        }
      },

      // Identify external network calls AND sensitive operations
      CallExpression: (path) => {
        const callee = path.node.callee;
        const functionName = callee.name || callee.property?.name;

        const networkFunctions = ['fetch', 'axios', 'request', 'http', 'https', 'ws', 'websocket'];
        if (networkFunctions.includes(functionName)) {
          dataFlow.externalCalls.push({
            function: functionName,
            line: path.node.loc?.start?.line,
            args: path.node.arguments.length
          });
        }

        const sensitiveFunctions = ['eval', 'Function', 'exec', 'spawn', 'child_process'];
        if (sensitiveFunctions.includes(functionName)) {
          dataFlow.sensitiveOperations.push({
            function: functionName,
            line: path.node.loc?.start?.line,
            args: path.node.arguments
          });
        }
      }
    });
```

**Step 2: Commit**

```
git add bleed-cli/src/semantic-analyzer.js
git commit -m "fix(bleed): merge duplicate CallExpression visitors in analyzeDataFlow"
```

---

### Task 9: Run test suite and verify semantic tests pass

**Files:**
- Run: `bleed-cli/test/test-suite.js`

**Step 1: Run the test suite**

Run: `cd bleed-cli && node test/test-suite.js 2>&1`
Expected: The 3 previously-failing semantic tests should now pass (or at least improve). The feedback tests should still pass.

Note: The `runSemanticTest` method (test-suite.js:255-263) passes empty findings `[]` to `analyzeFile`, which returns them enhanced. With empty input, `result.length` will be 0 so `passed` will be false. This is a test design issue — the test checks if "something is found" but semantic analysis enhances existing findings, it doesn't discover new ones.

**Step 2: If semantic tests still fail due to empty-findings test design**

The test is wrong, not the code. The semantic analyzer enhances findings it's given — passing `[]` will always return `[]`. Note this but don't modify the test yet. The important verification is:

Run: `cd bleed-cli && node bin/bleed.js scan ../test-evil/ --quiet --output json 2>&1`

This should produce actual findings from `test-evil/wallet.js` and `test-evil/advanced-agentic-threats.js`.

**Step 3: Commit test results**

```
git add bleed-cli/test-data/test-results.json
git commit -m "test(bleed): update test results after semantic analysis fixes"
```

---

### Task 10: Verify bleed scans test-evil correctly

**Step 1: Run bleed against test-evil**

Run: `cd bleed-cli && node bin/bleed.js scan ../test-evil/ --quiet --output json 2>&1`

Expected: Findings from both `wallet.js` and `advanced-agentic-threats.js`. The `isTestOrExample` fix from earlier should ensure test-evil paths are NOT suppressed.

**Step 2: Run bleed against its own source**

Run: `cd bleed-cli && node bin/bleed.js scan src/ --quiet --output json 2>&1`

Expected: Some findings (the scanner source contains patterns it scans for), but with appropriate context weighting since these are detection patterns, not malicious code.

**Step 3: Document results**

Note the number of findings and their severities for each scan. No commit needed — this is validation only.

---

## Phase 3: Extend (Re-enable cross-file analysis)

### Task 11: Re-enable CrossFileAnalyzer in scanner.js

**Files:**
- Modify: `bleed-cli/src/scanner.js:11` (uncomment require)
- Modify: `bleed-cli/src/scanner.js:231` (uncomment initialization)

**Step 1: Uncomment the require**

Change line 11 from:
```javascript
// const CrossFileAnalyzer = require('./cross-file-analyzer'); // Temporarily disabled
```
To:
```javascript
const CrossFileAnalyzer = require('./cross-file-analyzer');
```

**Step 2: Uncomment initialization in constructor**

Change line 231 from:
```javascript
    // this.crossFileAnalyzer = new CrossFileAnalyzer(); // Temporarily disabled
```
To:
```javascript
    this.crossFileAnalyzer = new CrossFileAnalyzer();
```

**Step 3: Verify scanner loads**

Run: `node -e "require('./bleed-cli/src/scanner'); console.log('OK')"`
Expected: `OK`

**Step 4: Test cross-file scanning**

Run: `cd bleed-cli && node bin/bleed.js scan ../test-evil/ --quiet --output json 2>&1`

Expected: Findings should include correlation data (the `correlations` array on findings should be populated for multi-file threats).

**Step 5: Commit**

```
git add bleed-cli/src/scanner.js
git commit -m "feat(bleed): re-enable cross-file correlation analysis"
```

---

### Task 12: Final verification — full scan of test-evil and self-scan

**Step 1: Scan test-evil with all features**

Run: `cd bleed-cli && node bin/bleed.js scan ../test-evil/ --output json 2>&1`

Check:
- [ ] Findings from `wallet.js` (crypto drainer, credential exfiltration, backdoor)
- [ ] Findings from `advanced-agentic-threats.js` (prompt injection, obfuscation, privilege escalation)
- [ ] Findings NOT suppressed by `isTestOrExample`
- [ ] Cross-file correlations present (if threats span files)
- [ ] Exit code is 2 (critical findings)

**Step 2: Self-scan**

Run: `cd bleed-cli && node bin/bleed.js scan src/ --output json 2>&1`

Check:
- [ ] Scanner source files produce findings (expected — they contain detection patterns)
- [ ] Context scoring treats detection patterns appropriately
- [ ] No crashes

**Step 3: Scan test-data**

Run: `cd bleed-cli && node bin/bleed.js scan test-data/semantic-test.js --output json 2>&1`

Check:
- [ ] `test-data/` is treated as test code — findings suppressed or low severity
- [ ] Semantic analysis marks the `describe`/`it` block as test code

If all checks pass, the audit is complete.

---

## Bug Registry (Reference)

| # | File | Line(s) | Bug | Phase |
|---|------|---------|-----|-------|
| 1 | scanner.js | 15,45 | Duplicate `const LEGACY_PATTERNS` | 1 |
| 2 | scanner.js | 353-422 | Mismatched braces in scan loop | 1 |
| 3 | scanner.js | 444-446 | Undefined `fileFindings` | 1 |
| 4 | scanner.js | 366,371-386 | Debug `console.log` in production | 1 |
| 5 | scanner.js | 454-477 | Dead `mergeSemanticAnalysis` method | 1 |
| 6 | semantic-analyzer.js | 329-341 | `isInTestCode` checks file, not line | 2 |
| 7 | semantic-analyzer.js | 346-351 | `involvesUserInput` calls `.includes()` on object | 2 |
| 8 | semantic-analyzer.js | 356-360 | `isInExportedFunction` checks ordering, not containment | 2 |
| 9 | semantic-analyzer.js | 264,279 | Duplicate `CallExpression` visitor (second overwrites first) | 2 |
| 10 | scanner.js | 11,231 | CrossFileAnalyzer disabled | 3 |
