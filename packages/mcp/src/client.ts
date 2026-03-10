export interface Rule {
  id: string;
  title: string;
  description?: string;
  severity?: string;
  language?: string;
  framework?: string;
  filePattern?: string;
  pattern?: string;
  goodExample?: string;
  badExample?: string;
}

export interface Match {
  ruleId: string;
  title: string;
  severity: string;
  description?: string;
  line?: number;
}

export interface Memory {
  id: string;
  content: string;
  context?: string;
  source?: string;
  createdAt?: string;
}

export interface Library {
  id: string;
  name: string;
  description?: string;
  version?: string;
}

export interface DocChunk {
  id: string;
  title: string;
  content: string;
  url?: string;
  tokenCount?: number;
}

export interface RulesResponse {
  rules: Rule[];
}

export interface MatchesResponse {
  matches: Match[];
}

export interface MemoriesResponse {
  memories: Memory[];
}

export interface AddMemoryResponse {
  id: string;
}

export interface SubscriptionStatusResponse {
  tier: "skill" | "mcp" | "bundle" | "free";
  rulesAvailable: number;
  categoriesAvailable: number;
  skillPurchased: boolean;
}

export interface SearchResponse {
  libraries: Library[];
}

export interface ContextResponse {
  chunks: DocChunk[];
}

export class SnitchClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Snitch API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Snitch API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getRules(opts: {
    projectId?: string;
    language?: string;
    framework?: string;
    filePattern?: string;
    query?: string;
  }): Promise<RulesResponse> {
    const params: Record<string, string> = {};
    if (opts.projectId !== undefined) params.projectId = opts.projectId;
    if (opts.language !== undefined) params.language = opts.language;
    if (opts.framework !== undefined) params.framework = opts.framework;
    if (opts.filePattern !== undefined) params.filePattern = opts.filePattern;
    if (opts.query !== undefined) params.query = opts.query;
    return this.get<RulesResponse>("/api/search", params);
  }

  async searchRules(query: string, topK?: number): Promise<RulesResponse> {
    const params: Record<string, string> = { query };
    if (topK !== undefined) params.topK = String(topK);
    return this.get<RulesResponse>("/api/search", params);
  }

  async checkPattern(
    code: string,
    language?: string,
    filePath?: string
  ): Promise<MatchesResponse> {
    const body: Record<string, unknown> = { code };
    if (language !== undefined) body.language = language;
    if (filePath !== undefined) body.filePath = filePath;
    return this.post<MatchesResponse>("/api/check-pattern", body);
  }

  async addMemory(
    projectId: string,
    content: string,
    context?: string
  ): Promise<AddMemoryResponse> {
    const body: Record<string, unknown> = { projectId, content };
    if (context !== undefined) body.context = context;
    return this.post<AddMemoryResponse>("/api/memories", body);
  }

  async getMemories(projectId: string, query?: string): Promise<MemoriesResponse> {
    const params: Record<string, string> = { projectId };
    if (query !== undefined) params.query = query;
    return this.get<MemoriesResponse>("/api/memories", params);
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    return this.get<SubscriptionStatusResponse>("/api/subscription/status", {});
  }
}

export class JeremyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Jeremy API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async search(libraryName: string, query?: string): Promise<SearchResponse> {
    const params: Record<string, string> = { libraryName };
    if (query !== undefined) {
      params.query = query;
    }
    return this.get<SearchResponse>("/api/search", params);
  }

  async getContext(
    libraryId: string,
    query: string,
    options?: { topK?: number; maxTokens?: number }
  ): Promise<ContextResponse> {
    const params: Record<string, string> = { libraryId, query };
    if (options?.topK !== undefined) {
      params.topK = String(options.topK);
    }
    if (options?.maxTokens !== undefined) {
      params.maxTokens = String(options.maxTokens);
    }
    return this.get<ContextResponse>("/api/context", params);
  }

  async queryByName(
    libraryName: string,
    query: string,
    options?: { topK?: number; maxTokens?: number }
  ): Promise<ContextResponse & { libraryId?: string }> {
    const searchResult = await this.search(libraryName);
    if (!searchResult.libraries || searchResult.libraries.length === 0) {
      return { chunks: [] };
    }
    const library = searchResult.libraries[0];
    const context = await this.getContext(library.id, query, options);
    return { ...context, libraryId: library.id };
  }
}
