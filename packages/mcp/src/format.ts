import { DocChunk, Rule, Match, Memory } from "./client.js";

export function formatChunk(chunk: DocChunk): string {
  const header = chunk.title ? `## ${chunk.title}\n` : "";
  return `${header}${chunk.content}`;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateToTokens(text: string, budget: number): string {
  const charBudget = budget * 4;
  if (text.length <= charBudget) return text;

  const truncated = text.slice(0, charBudget);

  // Try to break at sentence boundary
  const lastSentence = truncated.search(/[.!?]\s[^.!?]*$/);
  if (lastSentence > charBudget * 0.5) {
    return truncated.slice(0, lastSentence + 1) + "\n\n[truncated]";
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > charBudget * 0.5) {
    return truncated.slice(0, lastSpace) + "\n\n[truncated]";
  }

  return truncated + "\n\n[truncated]";
}

export function budgetChunks(chunks: DocChunk[], maxTokens: number = 3000): string {
  const parts: string[] = [];
  let remaining = maxTokens;

  for (const chunk of chunks) {
    const formatted = formatChunk(chunk);
    const cost = estimateTokens(formatted);

    if (cost <= remaining) {
      parts.push(formatted);
      remaining -= cost;
    } else if (remaining > 50) {
      parts.push(truncateToTokens(formatted, remaining));
      break;
    } else {
      break;
    }
  }

  return parts.join("\n\n");
}

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "\u{1F6D1}",
  high: "\u{1F534}",
  medium: "\u{1F7E1}",
  low: "\u{1F535}",
  info: "\u{2139}\u{FE0F}",
};

export function formatRule(rule: Rule): string {
  const emoji = SEVERITY_EMOJI[rule.severity?.toLowerCase() ?? ""] ?? "";
  const severity = rule.severity ? ` [${rule.severity}]` : "";
  const lines: string[] = [];

  lines.push(`${emoji} **${rule.title}**${severity}`);

  if (rule.description) lines.push(rule.description);

  const meta: string[] = [];
  if (rule.language) meta.push(`Language: ${rule.language}`);
  if (rule.framework) meta.push(`Framework: ${rule.framework}`);
  if (rule.filePattern) meta.push(`Files: ${rule.filePattern}`);
  if (meta.length > 0) lines.push(meta.join(" | "));

  if (rule.pattern) lines.push(`Pattern: \`${rule.pattern}\``);

  if (rule.badExample) {
    lines.push(`Bad:\n\`\`\`\n${rule.badExample}\n\`\`\``);
  }
  if (rule.goodExample) {
    lines.push(`Good:\n\`\`\`\n${rule.goodExample}\n\`\`\``);
  }

  return lines.join("\n");
}

export function formatMatch(match: Match): string {
  const emoji = SEVERITY_EMOJI[match.severity?.toLowerCase() ?? ""] ?? "";
  const location = match.line !== undefined ? ` (line ${match.line})` : "";
  const lines: string[] = [];

  lines.push(`${emoji} **${match.title}** [${match.severity}]${location}`);
  if (match.description) lines.push(match.description);

  return lines.join("\n");
}

export function formatMemory(memory: Memory): string {
  const lines: string[] = [];

  lines.push(`**Memory** (${memory.id})`);
  lines.push(memory.content);
  if (memory.context) lines.push(`Context: ${memory.context}`);
  if (memory.source) lines.push(`Source: ${memory.source}`);
  if (memory.createdAt) lines.push(`Created: ${memory.createdAt}`);

  return lines.join("\n");
}
