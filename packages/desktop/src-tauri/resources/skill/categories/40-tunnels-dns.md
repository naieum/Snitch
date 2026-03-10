## CATEGORY 40: Infrastructure Tunneling & DNS Security (ngrok / Cloudflare / Resolvers)

> **Cross-reference:** Category 3 covers general hardcoded secrets. Category 11 covers broad cloud misconfiguration. Category 31 covers CI/CD pipeline secrets. This category focuses specifically on tunnel credential exposure, Cloudflare Workers secret management, and DNS resolver security.

### Detection

**Tunnel tooling:**
- ngrok: `ngrok` binary references, `.ngrok2/` or `.ngrok/` directories, `NGROK_AUTHTOKEN` env var
- cloudflared: `cloudflared` binary references, `.cloudflared/` directory, `TUNNEL_TOKEN` env var, `cert.pem`
- Quick tunnels: `trycloudflare.com` URLs (ephemeral tunnels, commonly abused for C2)

**Cloudflare Workers / Wrangler:**
- Config files: `wrangler.toml`, `wrangler.jsonc`, `wrangler.json`
- Local dev secrets: `.dev.vars`, `.wrangler/` directory
- API tokens: `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`, `CF_ACCOUNT_ID`

**DNS / Resolvers:**
- Hardcoded resolver IPs: `1.1.1.1`, `1.0.0.1`, `8.8.8.8`, `8.8.4.4`, `9.9.9.9`
- Node.js DNS: `dns.setServers()`, `dns.resolve()` with hardcoded IPs
- Plaintext DNS: `dns://`, port `53` references without DoH/DoT
- Deprecated: `cloudflared proxy-dns` (removed Feb 2026 — vulnerable DNS library)

### What to Search For

**ngrok patterns:**
- `authtoken` in YAML/JSON/TOML config files
- Hardcoded `*.ngrok.io`, `*.ngrok.app`, `*.ngrok-free.app` URLs in source code
- `ngrok http`, `ngrok tcp`, `ngrok tls`, `ngrok start` in scripts or Dockerfiles
- `--authtoken` flag in shell commands
- `.ngrok2/ngrok.yml` or `.ngrok/config.yml` committed to git

**cloudflared patterns:**
- `TUNNEL_TOKEN` or `--token` hardcoded in scripts, docker-compose, or config
- `.cloudflared/credentials.json` or `.cloudflared/cert.pem` in repo
- `noTLSVerify: true` or `--no-tls-verify` in tunnel ingress config
- `proxy-dns` command usage (deprecated and removed)
- `trycloudflare.com` URLs in production code

**Wrangler / Miniflare patterns:**
- Sensitive keys in `[vars]` section of `wrangler.toml` (API_KEY, SECRET, TOKEN, PASSWORD, DATABASE_URL)
- `.dev.vars` tracked in git (should be in .gitignore)
- `.wrangler/` directory committed (build artifacts, may contain secrets)
- `api_token` field in wrangler config
- `compatibility_date` older than 12 months (missing security patches)
- Secrets passed via `miniflare --binding` command line

**DNS patterns:**
- Hardcoded resolver IPs in code or config without env var override
- `dns.setServers()` with literal IP arrays
- Plaintext DNS (port 53) without DoH/DoT fallback
- `dnsRebindingProtection: false` or similar bypass flags
- DNSSEC explicitly disabled
- `resolv.conf` modifications in Dockerfiles or scripts
- `--dns` flag in Docker with hardcoded IPs

### Critical
- ngrok authtoken in any tracked file (credential leak — attacker can hijack your tunnels)
- cloudflared tunnel token or credentials JSON committed to git
- Cloudflare API token (`CF_API_TOKEN`, `CLOUDFLARE_API_TOKEN`) hardcoded in source
- Plaintext secrets in `wrangler.toml` `[vars]` section (API keys, passwords, connection strings)
- `.dev.vars` or `.wrangler/` directory tracked in git

### High
- Hardcoded ngrok/cloudflared tunnel URLs in production code or config
- `trycloudflare.com` URLs in non-dev context (common C2 indicator)
- `--no-tls-verify` or `noTLSVerify: true` in tunnel config (disables TLS validation)
- `proxy-dns` usage (deprecated, vulnerable DNS library)
- `TUNNEL_TOKEN=` inline in docker-compose files
- Hardcoded DNS resolver IPs without configurable override
- DNS rebinding protection explicitly disabled

### Medium
- ngrok or cloudflared invocation in production scripts or Dockerfiles (dev tool shipped to prod)
- `compatibility_date` in wrangler config older than 12 months
- Plaintext DNS resolution (port 53) without DoH/DoT fallback
- Non-configurable resolver (hardcoded with no env var fallback)
- DNSSEC explicitly disabled in configuration
- Secrets passed via miniflare command-line flags

### Context Check
1. Is this a dev-only context (test file, local script, `.dev.` prefix) or production code?
2. Is the ngrok/cloudflared usage in a Dockerfile or deploy script (production risk) vs a local dev script?
3. Are tunnel credentials referenced by path (safe if file not committed) or embedded inline (dangerous)?
4. For wrangler vars — is the value a real secret or a non-sensitive config value like `APP_NAME`?
5. For DNS resolvers — is the IP configurable via env var, or truly hardcoded?
6. Is `.dev.vars` / `.ngrok2/` / `.cloudflared/` / `.wrangler/` in .gitignore?

### NOT Vulnerable
- ngrok in development-only scripts with proper .gitignore for `.ngrok2/`
- `NGROK_AUTHTOKEN` referenced via `process.env` without inline value
- cloudflared tunnel config referencing credentials file path (file itself not committed)
- Wrangler secrets managed via `wrangler secret put` (encrypted server-side)
- `.dev.vars` present but properly .gitignored
- `compatibility_date` within last 12 months
- DNS resolver configurable via environment variable with sensible default
- System default resolver usage (inherits OS configuration)
- DNS-over-HTTPS or DNS-over-TLS configured

### Files to Check
- `**/.ngrok2/**`, `**/.ngrok/**`, `**/ngrok.yml`, `**/ngrok.conf`
- `**/.cloudflared/**`, `**/cloudflared.yml`, `**/cloudflared.yaml`, `**/tunnel.yml`
- `**/wrangler.toml`, `**/wrangler.jsonc`, `**/wrangler.json`
- `**/.dev.vars`, `**/.wrangler/**`
- `**/docker-compose*.{yml,yaml}`, `**/Dockerfile*`
- `**/.github/workflows/*.{yml,yaml}`
- `**/dns*.{ts,js}`, `**/resolver*.{ts,js}`, `**/network*.{ts,js}`
- `**/.resolv.conf`, `**/resolv.conf`
- `**/.env*`
