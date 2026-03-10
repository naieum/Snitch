/**
 * GitLab API helpers — post MR comments and set pipeline status
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

const GITLAB_API = process.env.CI_API_V4_URL || "https://gitlab.com/api/v4";
const PROJECT_ID = process.env.CI_PROJECT_ID;
const MR_IID = process.env.CI_MERGE_REQUEST_IID;
const GITLAB_TOKEN = process.env.GITLAB_TOKEN || process.env.CI_JOB_TOKEN;

async function gitlabFetch(path: string, options: RequestInit = {}): Promise<Response> {
  if (!GITLAB_TOKEN) {
    throw new Error("GITLAB_TOKEN or CI_JOB_TOKEN not found");
  }

  return fetch(`${GITLAB_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "PRIVATE-TOKEN": GITLAB_TOKEN,
      ...options.headers,
    },
  });
}

export async function getChangedFiles(): Promise<
  Array<{ path: string; content: string; patch: string }>
> {
  if (!PROJECT_ID || !MR_IID) {
    throw new Error(
      "CI_PROJECT_ID and CI_MERGE_REQUEST_IID must be set. Run this in a merge request pipeline."
    );
  }

  const res = await gitlabFetch(
    `/projects/${PROJECT_ID}/merge_requests/${MR_IID}/diffs`
  );

  if (!res.ok) {
    throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
  }

  const diffs = (await res.json()) as Array<{
    new_path: string;
    deleted_file: boolean;
    diff: string;
  }>;

  const changedFiles: Array<{ path: string; content: string; patch: string }> = [];

  for (const diff of diffs) {
    if (diff.deleted_file) continue;
    if (!diff.new_path.match(/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/)) continue;

    try {
      const ref = process.env.CI_COMMIT_SHA || "HEAD";
      const fileRes = await gitlabFetch(
        `/projects/${PROJECT_ID}/repository/files/${encodeURIComponent(diff.new_path)}/raw?ref=${ref}`
      );

      if (fileRes.ok) {
        const content = await fileRes.text();
        changedFiles.push({
          path: diff.new_path,
          content,
          patch: diff.diff,
        });
      }
    } catch {
      // Skip files we can't read
    }
  }

  return changedFiles;
}

export async function postComment(
  findings: Finding[],
  summary: string,
  scanType: string,
  fileCount: number
): Promise<string> {
  if (!PROJECT_ID || !MR_IID) {
    throw new Error("CI_PROJECT_ID and CI_MERGE_REQUEST_IID must be set");
  }

  const totalFindings = findings.length;

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
  const listRes = await gitlabFetch(
    `/projects/${PROJECT_ID}/merge_requests/${MR_IID}/notes?per_page=100`
  );
  if (!listRes.ok) throw new Error(`Failed to list MR notes: ${listRes.status}`);

  const notes = (await listRes.json()) as Array<{
    id: number;
    body: string;
    system: boolean;
  }>;

  const existing = notes.find(
    (n) => !n.system && n.body.startsWith("## Snitch Security Scan")
  );

  if (existing) {
    const updateRes = await gitlabFetch(
      `/projects/${PROJECT_ID}/merge_requests/${MR_IID}/notes/${existing.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ body }),
      }
    );
    if (!updateRes.ok) throw new Error(`Failed to update MR note: ${updateRes.status}`);
    return `${process.env.CI_PROJECT_URL}/-/merge_requests/${MR_IID}#note_${existing.id}`;
  } else {
    const createRes = await gitlabFetch(
      `/projects/${PROJECT_ID}/merge_requests/${MR_IID}/notes`,
      {
        method: "POST",
        body: JSON.stringify({ body }),
      }
    );
    if (!createRes.ok) throw new Error(`Failed to create MR note: ${createRes.status}`);
    const created = (await createRes.json()) as { id: number };
    return `${process.env.CI_PROJECT_URL}/-/merge_requests/${MR_IID}#note_${created.id}`;
  }
}

export async function setCommitStatus(
  findings: Finding[],
  failOn: string
): Promise<void> {
  if (!PROJECT_ID) return;

  const sha = process.env.CI_COMMIT_SHA;
  if (!sha) return;

  if (failOn.toLowerCase() === "none") {
    const statusRes = await gitlabFetch(`/projects/${PROJECT_ID}/statuses/${sha}`, {
      method: "POST",
      body: JSON.stringify({
        state: "success",
        name: "Snitch Security Scan",
        description: `${findings.length} finding(s) — fail-on disabled`,
        target_url: "https://snitch.live",
      }),
    });
    if (!statusRes.ok) throw new Error(`Failed to set commit status: ${statusRes.status}`);
    return;
  }

  const severityOrder = ["critical", "high", "medium", "low"];
  const failIndex = severityOrder.indexOf(failOn.toLowerCase());

  const hasFailing =
    failIndex !== -1 &&
    findings.some((f) => {
      const fIndex = severityOrder.indexOf(f.severity.toLowerCase());
      return fIndex <= failIndex && fIndex !== -1;
    });

  const statusRes = await gitlabFetch(`/projects/${PROJECT_ID}/statuses/${sha}`, {
    method: "POST",
    body: JSON.stringify({
      state: hasFailing ? "failed" : "success",
      name: "Snitch Security Scan",
      description: hasFailing
        ? `${findings.length} finding(s) — ${failOn}+ severity detected`
        : `${findings.length} finding(s) — all below ${failOn} threshold`,
      target_url: "https://snitch.live",
    }),
  });
  if (!statusRes.ok) throw new Error(`Failed to set commit status: ${statusRes.status}`);
}
