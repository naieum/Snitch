```
   _____ _   ____________________  __
  / ___// | / /  _/_  __/ ____/ / / /
  \__ \/  |/ // /  / / / /   / /_/ /
 ___/ / /|  // /  / / / /___/ __  /
/____/_/ |_/___/ /_/  \____/_/ /_/
                                v2
```

A security audit plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Codex CLI](https://github.com/openai/codex), [OpenCode](https://github.com/opencode-ai/opencode), [Antigravity](https://github.com/neplextech/antigravity), and [Cursor](https://www.cursor.com/).

---

I tell ya, security scanners get no respect. No respect at all. You run one on your codebase and it comes back with 500 findings. Five hundred! I haven't read 500 of anything in my life. My doctor sends me one page of test results and I need a nap.

And the findings? Half of them are `YOUR_API_KEY_HERE` in a comment somebody wrote two years ago. The scanner sees the word "key" and loses its mind. It's like a smoke detector that goes off every time you make toast. After a while you just take the batteries out. Now your house burns down. Great system.

Here's the thing though — that was fine when humans wrote all the code. You knew what was in there because you put it there. But now? Your AI wrote 80% of the app in three weeks. You didn't read most of it. I didn't read most of it. Nobody read most of it. We just watched it go and said "looks good" like we were approving a restaurant check we didn't look at.

Snitch is different. It makes your AI actually *prove* every finding with real code from your actual project. No file read? No finding. Can't quote the exact line? No finding. Didn't check if there's a fix two lines above? No finding. It's like a cop that needs a warrant. Remember those?

The result is a report where everything in it is real. Your AI builds the app, Snitch reviews the app, you ship it without waking up at 3am wondering if your users' passwords are in a log file somewhere. They might be. But at least now you'll know.

## Install

### Claude Code

```
/plugin marketplace add naieum/Snitch
/plugin install snitch@naieum-Snitch
```

Two commands. My last relationship took more effort than that and was way less useful.

### Gemini CLI

```bash
gemini extensions install https://github.com/naieum/Snitch.git
```

### Codex CLI

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/agents/skills/snitch ~/.codex/skills/snitch
```

That's a global install. If you want it for just one project, use `.agents/skills/snitch` instead.

### OpenCode

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch ~/.config/opencode/skills/snitch
```

Single project: `.opencode/skills/snitch`.

### Antigravity

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch ~/.gemini/antigravity/skills/snitch
```

Single project: `.agent/skills/snitch`.

### Cursor

```bash
git clone https://github.com/naieum/Snitch.git
cp -r Snitch/skills/snitch .cursor/skills/snitch
```

Project-level only.

---

<details>
<summary>Updating / Uninstalling</summary>

**Claude Code:**
```
/plugin marketplace update naieum-Snitch
/plugin uninstall snitch@naieum-Snitch
```

**Gemini CLI:**
```bash
gemini extensions update snitch
gemini extensions uninstall snitch
```

**Codex CLI:**
```bash
rm -rf ~/.codex/skills/snitch
```

**OpenCode:**
```bash
rm -rf ~/.config/opencode/skills/snitch
```

**Antigravity:**
```bash
rm -rf ~/.gemini/antigravity/skills/snitch
```

**Cursor:**
```bash
rm -rf .cursor/skills/snitch
```

</details>

## Usage

```
/snitch
```

That's it. You get a menu. Pick what you want to check. It's like a deli counter but instead of cold cuts you're picking which parts of your app might be leaking customer data.

**Quick Scan** is the move. It reads your `package.json`, figures out you're using Prisma and Stripe and NextAuth, and only checks the stuff that matters. It's not going to audit your Twilio setup if you don't have a phone number anywhere in the project. Smart like that.

You can also skip the menu entirely:

```
/snitch --categories=1,2,3,13
/snitch --diff
```

`--diff` is the one you want before every commit. Takes 30 seconds, catches the stuff that sneaks in when you're shipping fast and not paying attention. Which is always.

### After the Scan

Snitch gives you options:

- **Run another scan** — go back, check more stuff
- **Fix one by one** — walk through each finding, say yes or no
- **Fix all** — let it patch everything at once
- **Done** — you're out

## What's New

**Recent additions** that make Snitch better:

- **Category 40: Tunnels & DNS** — ngrok tokens, cloudflared credentials, dev tunnels in production. If you're using tunneling tools and forgot to clean up credentials, we catch it now.
- **Session & Token Lifetime Checks** — Tokens that don't expire, logout that doesn't actually log you out, session confusion. We check if your auth actually works the way you think it does.
- **Expanded AI API Coverage (Category 15)** — More patterns for catching API keys from Claude, GPT, Gemini, and other AI services scattered through your codebase.

Check back regularly. We add new categories when we find new patterns that matter.

## What It Checks

40 categories. That's not a typo. Let me break it down so it doesn't sound like a college syllabus.

**The Scary Stuff** — SQL injection (someone runs database commands through your app), XSS (someone puts a script on your page that steals cookies), hardcoded secrets (your API keys are just... sitting there in the code), broken login flows, your server fetching URLs it shouldn't, and nobody put rate limits on anything so bots can try a million passwords.

**Your Services** — Supabase row-level security (is the data actually locked down or can anyone grab it?), Stripe keys and webhooks, auth providers like Clerk and Auth0 (did you actually set them up right?), AI API keys floating around, email services that could get turned into spam cannons, database connection strings in the open, Redis passwords, Twilio tokens.

**Session & Token Lifetimes** — This is the new one. Your login tokens — do they expire? Do they expire at the right time? Does logging out actually log you out, or does it just clear a cookie while the token's still good for another six hours? You'd be surprised how many apps get this wrong.

**Compliance** — HIPAA (patient data in your logs is a federal problem), SOC 2 (no audit trail means no audit trail), PCI-DSS (you're storing credit card numbers? in *this* economy?), GDPR (can your European users actually delete their data or is that button decorative?).

**Performance** — Memory leaks (event listeners that never get cleaned up), N+1 queries (your ORM is hitting the database 200 times when it could hit it once), and code that blocks the whole server while it reads a file.

**Tunnels & DNS** — ngrok authtokens committed to git, cloudflared tunnel credentials exposed, dev tunnels shipped to production, plaintext secrets in `wrangler.toml`, `.dev.vars` tracked in version control, hardcoded DNS resolvers, missing DNS-over-HTTPS. If you're tunneling to localhost and forgot to clean it up, Snitch will find it.

**The Rest** — Vulnerable npm packages, users accessing each other's data, file uploads with no validation, inputs that crash your regex engine, CI/CD pipelines with secrets in plain text, missing security headers, dead dependencies making your bundle enormous, crypto compliance, governance certifications, disaster recovery, monitoring, and data lifecycle.

## How It Works

It's not some pattern-matching robot that sees the word "password" and panics. For every category, Snitch knows what to look for, what's actually dangerous versus what just looks suspicious, and what to check before sounding the alarm. Is this test code? Is there input validation right above it? Is this running on the server or could it end up in the browser?

Every finding comes with the file, the line number, the actual code, why it's a problem, and how to fix it. Findings are tagged with CWE, OWASP Top 10:2025, and CVSS 4.0 references so your GRC tools can ingest them directly. If it can't prove it, it doesn't report it. I wish my mechanic worked like that.

## Contributors

- [Jhean-François Fournier-Noël (@JF10R)](https://github.com/JF10R) — CWE, OWASP Top 10:2025, and CVSS 4.0 standards tagging on findings

## License

MIT
