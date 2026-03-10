import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SnitchClient, JeremyClient } from "./client.js";
import { budgetChunks, formatRule, formatMatch, formatMemory } from "./format.js";

export function registerTools(
  server: McpServer,
  snitchClient: SnitchClient,
  jeremyClient: JeremyClient
): void {
  server.tool(
    "get-rules",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter rules by project ID"),
      language: z
        .string()
        .optional()
        .describe("Filter rules by language (e.g. 'javascript', 'python')"),
      framework: z
        .string()
        .optional()
        .describe("Filter rules by framework (e.g. 'react', 'express')"),
      filePattern: z
        .string()
        .optional()
        .describe("Filter rules by file pattern (e.g. '*.tsx', 'src/**/*.js')"),
      query: z
        .string()
        .optional()
        .describe("Search query to find relevant rules"),
    },
    async ({ projectId, language, framework, filePattern, query }) => {
      const result = await snitchClient.getRules({
        projectId,
        language,
        framework,
        filePattern,
        query,
      });

      if (!result.rules || result.rules.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No rules found matching the given criteria.",
            },
          ],
        };
      }

      const text = result.rules.map(formatRule).join("\n\n---\n\n");
      return {
        content: [{ type: "text", text }],
      };
    }
  );

  server.tool(
    "search-rules",
    {
      query: z
        .string()
        .describe("Search query to find relevant security rules"),
      topK: z
        .number()
        .optional()
        .describe("Maximum number of results to return"),
    },
    async ({ query, topK }) => {
      const result = await snitchClient.searchRules(query, topK);

      if (!result.rules || result.rules.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No rules found matching "${query}".`,
            },
          ],
        };
      }

      const chunks = result.rules.map((rule) => ({
        id: rule.id,
        title: rule.title,
        content: formatRule(rule),
      }));
      const budget = 3000;
      return {
        content: [{ type: "text", text: budgetChunks(chunks, budget) }],
      };
    }
  );

  server.tool(
    "check-pattern",
    {
      code: z
        .string()
        .describe("The code snippet to check for security patterns"),
      language: z
        .string()
        .optional()
        .describe("The programming language of the code"),
      filePath: z
        .string()
        .optional()
        .describe("The file path for context-aware pattern matching"),
    },
    async ({ code, language, filePath }) => {
      const result = await snitchClient.checkPattern(code, language, filePath);

      if (!result.matches || result.matches.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No security patterns matched in the provided code.",
            },
          ],
        };
      }

      const text = result.matches.map(formatMatch).join("\n\n");
      return {
        content: [{ type: "text", text }],
      };
    }
  );

  server.tool(
    "add-memory",
    {
      projectId: z
        .string()
        .describe("The project ID to associate the memory with"),
      content: z
        .string()
        .describe("The memory content to store"),
      context: z
        .string()
        .optional()
        .describe("Optional context for the memory (e.g. file path, category)"),
    },
    async ({ projectId, content, context }) => {
      const result = await snitchClient.addMemory(projectId, content, context);
      return {
        content: [
          {
            type: "text",
            text: `Memory saved (id: ${result.id}).`,
          },
        ],
      };
    }
  );

  server.tool(
    "get-memories",
    {
      projectId: z
        .string()
        .describe("The project ID to retrieve memories for"),
      query: z
        .string()
        .optional()
        .describe("Optional search query to filter memories"),
    },
    async ({ projectId, query }) => {
      const result = await snitchClient.getMemories(projectId, query);

      if (!result.memories || result.memories.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No memories found for project "${projectId}".`,
            },
          ],
        };
      }

      const text = result.memories.map(formatMemory).join("\n\n---\n\n");
      return {
        content: [{ type: "text", text }],
      };
    }
  );

  server.tool(
    "get-subscription-status",
    {},
    async () => {
      const result = await snitchClient.getSubscriptionStatus();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.tool(
    "lookup-docs",
    {
      libraryName: z
        .string()
        .describe(
          "The name of the library to look up (e.g. 'react', 'lodash')"
        ),
      query: z
        .string()
        .describe("The question or topic to look up in the documentation"),
      maxTokens: z
        .number()
        .optional()
        .describe("Maximum tokens in response (default 3000)"),
    },
    async ({ libraryName, query, maxTokens }) => {
      const budget = maxTokens ?? 3000;
      const result = await jeremyClient.queryByName(libraryName, query, {
        topK: 5,
        maxTokens: budget,
      });

      if (!result.chunks || result.chunks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No documentation found for "${query}" in library "${libraryName}".`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: budgetChunks(result.chunks, budget),
          },
        ],
      };
    }
  );

  server.tool(
    "query-docs",
    {
      libraryId: z
        .string()
        .describe("The library ID returned by resolve-library-id"),
      query: z
        .string()
        .describe("The question or topic to look up in the documentation"),
      topic: z
        .string()
        .optional()
        .describe("Optional topic to narrow the search (e.g. 'hooks', 'api')"),
      maxTokens: z
        .number()
        .optional()
        .describe("Maximum tokens in response (default 3000)"),
    },
    async ({ libraryId, query, topic, maxTokens }) => {
      const fullQuery = topic ? `${topic}: ${query}` : query;
      const budget = maxTokens ?? 3000;
      const result = await jeremyClient.getContext(libraryId, fullQuery, {
        topK: 5,
        maxTokens: budget,
      });

      if (!result.chunks || result.chunks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No documentation found for "${query}" in library "${libraryId}".`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: budgetChunks(result.chunks, budget),
          },
        ],
      };
    }
  );
}
