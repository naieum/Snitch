## CATEGORY 31: CI/CD Pipeline Security

### Detection
- GitHub Actions: `.github/workflows/*.yml`
- GitLab CI: `.gitlab-ci.yml`
- Other CI: `Jenkinsfile`, `.circleci/config.yml`, `azure-pipelines.yml`

### What to Search For
- Secrets hardcoded in workflow files (not using `${{ secrets.* }}`)
- `pull_request_target` trigger with checkout of PR code (script injection vector)
- Workflow `permissions` not scoped (defaults to write-all)
- Expression injection in `run:` steps (e.g., `${{ github.event.issue.title }}` in shell)
- Third-party actions pinned to branch tags instead of commit SHA
- Self-hosted runners without isolation

### Actually Vulnerable
- API key or token as plain string in workflow YAML (not `${{ secrets.KEY }}`)
- Workflow with `pull_request_target` that checks out PR branch and runs PR code
- No `permissions:` key in workflow (inherits overly broad defaults)
- `run: echo ${{ github.event.comment.body }}` (arbitrary code injection via comment)
- `uses: actions/checkout@main` instead of `uses: actions/checkout@SHA`
- Self-hosted runner used for public repository workflows

### NOT Vulnerable
- Secrets referenced via `${{ secrets.* }}` syntax
- `pull_request` trigger (safe, runs in context of PR fork)
- Explicit `permissions:` with minimal scopes (e.g., `contents: read`)
- GitHub context values used in `with:` inputs (not shell `run:`)
- Actions pinned to full SHA (`uses: actions/checkout@abc123...`)
- Self-hosted runners for private repos with proper isolation

### Context Check
1. Is this a public or private repository?
2. Does the workflow use `pull_request_target` with code checkout?
3. Are GitHub context values used in shell `run:` commands or action `with:` inputs?
4. Are third-party actions pinned to commit SHAs?

### Files to Check
- `.github/workflows/*.yml`
- `.gitlab-ci.yml`, `Jenkinsfile`
- `.circleci/config.yml`
- CI/CD configuration in `package.json` scripts
