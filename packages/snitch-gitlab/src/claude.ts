/**
 * Claude API client — sends code + methodology to Claude for analysis
 * Reused from snitch-action with identical Claude logic.
 */

interface Finding {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  file: string;
  line?: number;
  evidence: string;
  risk: string;
  fix: string;
  cwe?: string;
  owasp?: string;
}

interface AuditResult {
  findings: Finding[];
  summary: string;
}

export async function analyzeWithClaude(
  apiKey: string,
  model: string,
  methodology: string,
  changedFiles: Array<{ path: string; content: string; patch: string }>
): Promise<AuditResult> {
  const fileContext = changedFiles
    .map(
      (f) =>
        `### File: ${f.path}\n\`\`\`\n${f.content.slice(0, 8000)}\n\`\`\`\n\nDiff:\n\`\`\`diff\n${f.patch.slice(0, 4000)}\n\`\`\``
    )
    .join("\n\n---\n\n");

  const prompt = `You are performing a security audit on a merge request. Use the methodology below to analyze the changed files and report findings.

IMPORTANT: Return your response as valid JSON matching this schema:
{
  "findings": [
    {
      "title": "Finding title",
      "severity": "Critical|High|Medium|Low",
      "file": "path/to/file.ts",
      "line": 47,
      "evidence": "the exact code snippet",
      "risk": "what could happen",
      "fix": "how to fix it",
      "cwe": "CWE-89",
      "owasp": "A05 Injection"
    }
  ],
  "summary": "Brief 1-2 sentence summary of findings"
}

If no issues are found, return: {"findings": [], "summary": "No security issues found in the changed files."}

---

${methodology}

---

## CHANGED FILES

${fileContext}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${error}`);
  }

  const result = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const text = result.content[0]?.text ?? "";

  // Extract JSON from response (may be wrapped in markdown code fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { findings: [], summary: "Could not parse audit response." };
  }

  try {
    return JSON.parse(jsonMatch[0]) as AuditResult;
  } catch {
    return { findings: [], summary: "Could not parse audit response as JSON." };
  }
}
