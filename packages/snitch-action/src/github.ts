/**
 * GitHub API helpers — post PR comments and set check status
 */

import * as github from "@actions/github";

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

export async function getChangedFiles(
  token: string
): Promise<Array<{ path: string; content: string; patch: string }>> {
  const octokit = github.getOctokit(token);
  const { context } = github;

  if (!context.payload.pull_request) {
    throw new Error("This action only works on pull_request events");
  }

  const prNumber = context.payload.pull_request.number;

  const { data: files } = await octokit.rest.pulls.listFiles({
    ...context.repo,
    pull_number: prNumber,
    per_page: 100,
  });

  const changedFiles: Array<{ path: string; content: string; patch: string }> =
    [];

  for (const file of files) {
    // Skip deleted files, binary files, and lockfiles
    if (file.status === "removed") continue;
    if (!file.filename.match(/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/))
      continue;

    try {
      const { data: content } = await octokit.rest.repos.getContent({
        ...context.repo,
        path: file.filename,
        ref: context.payload.pull_request.head.sha,
      });

      if ("content" in content && content.encoding === "base64") {
        changedFiles.push({
          path: file.filename,
          content: Buffer.from(content.content, "base64").toString("utf-8"),
          patch: file.patch ?? "",
        });
      }
    } catch {
      // Skip files we can't read
    }
  }

  return changedFiles;
}

export async function postComment(
  token: string,
  findings: Finding[],
  summary: string,
  scanType: string,
  fileCount: number
): Promise<string> {
  const octokit = github.getOctokit(token);
  const { context } = github;

  if (!context.payload.pull_request) {
    throw new Error("This action only works on pull_request events");
  }

  const prNumber = context.payload.pull_request.number;
  const totalFindings = findings.length;

  // Group findings by severity
  const critical = findings.filter((f) => f.severity === "Critical");
  const high = findings.filter((f) => f.severity === "High");
  const medium = findings.filter((f) => f.severity === "Medium");
  const low = findings.filter((f) => f.severity === "Low");

  let body = `## Snitch Security Scan\n`;
  body += `**${totalFindings} finding${totalFindings !== 1 ? "s" : ""}** in ${fileCount} changed file${fileCount !== 1 ? "s" : ""} | ${scanType} scan\n\n`;

  if (totalFindings === 0) {
    body += `No security issues found. ${summary}\n`;
  } else {
    const sections: Array<{ label: string; items: Finding[] }> = [
      { label: "Critical", items: critical },
      { label: "High", items: high },
      { label: "Medium", items: medium },
      { label: "Low", items: low },
    ];

    for (const section of sections) {
      if (section.items.length === 0) continue;
      body += `### ${section.label} (${section.items.length})\n`;
      for (const f of section.items) {
        const location = f.line ? `${f.file}:${f.line}` : f.file;
        const tags = [f.cwe, f.owasp].filter(Boolean).join(" | ");
        body += `- **${f.title}** in \`${location}\` — ${f.risk}${tags ? ` (${tags})` : ""}\n`;
      }
      body += "\n";
    }
  }

  body += `\n*Powered by [Snitch](https://snitch.live)*`;

  // Find and update existing Snitch comment, or create new one
  const { data: comments } = await octokit.rest.issues.listComments({
    ...context.repo,
    issue_number: prNumber,
    per_page: 100,
  });

  const existingComment = comments.find(
    (c) =>
      c.user?.login === "github-actions[bot]" &&
      c.body?.startsWith("## Snitch Security Scan")
  );

  let commentUrl: string;

  if (existingComment) {
    const { data: updated } = await octokit.rest.issues.updateComment({
      ...context.repo,
      comment_id: existingComment.id,
      body,
    });
    commentUrl = updated.html_url;
  } else {
    const { data: created } = await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: prNumber,
      body,
    });
    commentUrl = created.html_url;
  }

  return commentUrl;
}

export async function setCheckStatus(
  token: string,
  findings: Finding[],
  failOn: string
): Promise<void> {
  const octokit = github.getOctokit(token);
  const { context } = github;

  if (!context.payload.pull_request) return;

  // "none" means never fail regardless of findings
  if (failOn.toLowerCase() === "none") {
    await octokit.rest.repos.createCommitStatus({
      ...context.repo,
      sha: context.payload.pull_request.head.sha,
      state: "success",
      context: "Snitch Security Scan",
      description: `${findings.length} finding(s) — fail-on disabled`,
      target_url: `https://snitch.live`,
    });
    return;
  }

  const severityOrder = ["critical", "high", "medium", "low"];
  const failIndex = severityOrder.indexOf(failOn.toLowerCase());

  const hasFailing = failIndex !== -1 && findings.some((f) => {
    const fIndex = severityOrder.indexOf(f.severity.toLowerCase());
    return fIndex <= failIndex && fIndex !== -1;
  });

  await octokit.rest.repos.createCommitStatus({
    ...context.repo,
    sha: context.payload.pull_request.head.sha,
    state: hasFailing ? "failure" : "success",
    context: "Snitch Security Scan",
    description: hasFailing
      ? `${findings.length} finding(s) — ${failOn}+ severity detected`
      : `${findings.length} finding(s) — all below ${failOn} threshold`,
    target_url: `https://snitch.live`,
  });
}
