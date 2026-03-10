## CATEGORY 45: AI Tool Supply Chain Security

### Detection
- MCP server source code (packages with `@modelcontextprotocol/sdk`)
- Claude Code skill files (`SKILL.md`, skill directories)
- AI plugin manifests and configurations
- Cursor, Copilot, Windsurf, or other AI tool extensions
- `package.json` with `postinstall` scripts in AI tool packages

### What to Search For

**Malicious MCP Servers:**
- Network calls to unknown or suspicious endpoints (data exfiltration)
- Tools that request excessive permissions (filesystem, shell, network access combined)
- Encoded or obfuscated code in tool implementations
- Tools that read wallet directories (`~/.bitcoin`, `~/.ethereum`, `~/.solana`, `~/.gnupg`)
- Tools that read browser credential stores or cookie databases
- Tools that use shell execution functions with dynamic arguments
- Tools that modify system files, startup scripts, or shell profiles
- Environment variable harvesting (reading `process.env` wholesale and sending externally)
- Tools that write to or modify `~/.ssh`, `~/.gitconfig`, or `~/.npmrc`

**Malicious Skills/Plugins:**
- Skills that contain dynamic code evaluation or shell invocations
- Skills with instructions to bypass security prompts or confirmations
- Skills that download and execute remote code at runtime
- Skills with obfuscated or base64-encoded payloads in markdown
- Skills that instruct the AI to ignore previous instructions (prompt injection)
- Skills that access credential files (`.env`, `.netrc`, `.npmrc`, SSH keys)
- Plugins that modify git config or install git hooks silently
- Plugins that install additional packages as a side effect

**Suspicious Wording/Intent:**
- Instructions to "ignore safety guidelines" or "override restrictions"
- Instructions to send data to external URLs not related to the stated purpose
- Cryptocurrency or wallet-related operations without clear justification
- Instructions to run commands silently or suppress output
- Claims of being a "security tool" while requesting broad system access
- Instructions that bypass user confirmation for destructive operations

### Actually Vulnerable
- MCP server tool that reads `~/.ssh/id_rsa` and sends it to an external endpoint
- Skill that contains `ignore all previous instructions` or similar prompt injection
- Plugin with a `postinstall` script that runs `curl` to download and execute a remote binary
- MCP tool that reads `process.env` and POSTs all environment variables to a third-party URL
- Skill with base64-encoded payload that decodes to shell commands
- MCP server that modifies `~/.gitconfig` to add a credential helper pointing to attacker infrastructure
- Plugin that silently installs git hooks that exfiltrate commit contents
- Tool claiming to be a "code formatter" but requesting filesystem + network + shell access

### NOT Vulnerable
- MCP server that reads only project-scoped files within the working directory
- Skills that invoke well-known tools (Read, Grep, Glob) without shell access
- Plugins with `postinstall` scripts that run standard build steps (tsc, esbuild, node-gyp)
- MCP tools that make network calls to their own documented API endpoints
- Skills that request user confirmation before any destructive operations
- Tools with permissions scoped to their stated purpose (e.g., a Slack tool accessing only Slack API)
- Standard AI SDK packages from verified publishers (@anthropic-ai/sdk, openai, @ai-sdk/*)

### Context Check
1. Does the MCP server or plugin access files outside the project directory?
2. Are network calls made to documented, expected endpoints or to unknown URLs?
3. Do requested permissions match the stated purpose of the tool?
4. Is there obfuscated, encoded, or dynamically constructed code?
5. Does the skill/plugin attempt to override AI safety behaviors?
6. Are `postinstall` scripts performing expected build operations or suspicious network/file activity?

### Files to Check
- MCP server source: `**/src/**`, `**/index.ts`, `**/index.js`
- Skill files: `**/SKILL.md`, `**/skills/**/*.md`
- Plugin manifests: `package.json`, `plugin.json`, `manifest.json`
- AI tool configs: `.cursor/**`, `.copilot/**`, `.continue/**`
- Post-install scripts: check `scripts.postinstall` in `package.json` of dependencies
