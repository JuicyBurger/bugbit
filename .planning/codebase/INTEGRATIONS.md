# External Integrations

**Analysis Date:** 2026-07-05

## APIs & External Services

**Cursor Agent API:**
- Purpose: Run PR review agents using the user's Cursor account and models
- SDK/Client: `@cursor/sdk` npm package
- Auth: `cursor-api-key` action input (workflow secret)
- Usage: bugbit orchestration calls the SDK; agent scripts receive forwarded credentials

**GitHub REST/GraphQL API:**
- Purpose: Read PR context, diff, branches; post inline review comments
- SDK/Client: `@actions/github` (Octokit)
- Auth: `github-token` action input (default `${{ github.token }}`)
- Note: Token is forwarded to agent scripts as `GITHUB_TOKEN` for PR reads and inline comment posting — not consumed by bugbit's own orchestration layer per `action.yml` design

## Data Storage

**Databases:**
- None — Stateless GitHub Action; no persistent datastore in bugbit itself

**File Storage:**
- None — Relies on GitHub Actions checkout of the PR workspace

**Caching:**
- None currently

## Authentication & Identity

**Cursor API:**
- Implementation: API key via `cursor-api-key` input
- Passed as secret from consumer workflow

**GitHub:**
- Implementation: `GITHUB_TOKEN` or custom PAT via `github-token` input
- Default: `${{ github.token }}` with workflow permissions
- Forwarded to agent scripts for PR API access

## Monitoring & Observability

**Error Tracking:**
- None integrated — Uses `@actions/core` logging (`core.info`, `core.error`, `core.setFailed`)

**Analytics:**
- None

**Logs:**
- GitHub Actions workflow logs (stdout/stderr from action run)

## CI/CD & Deployment

**Hosting:**
- GitHub Actions marketplace / repo reference — Self-hosted action pattern
- Entry: `action.yml` → `dist/index.js` on `node20`

**CI Pipeline:**
- No `.github/workflows/` in repo yet
- Expected: build (`tsc`), bundle (`ncc`), test (`jest`) before release

## Environment Configuration

**Development:**
- Required for local testing: `CURSOR_API_KEY` (or equivalent), `GITHUB_TOKEN` (for integration tests)
- Secrets location: Not committed; consumer repos use GitHub Secrets

**Consumer Workflows:**
- Required inputs: `cursor-api-key`, `github-token` (has default)
- Optional: `model` (default `composer-2.5`), `review-modes` (default `code-review`)

## Webhooks & Callbacks

**Incoming:**
- None — Triggered by GitHub Actions workflow events (e.g., `pull_request`), not HTTP webhooks to bugbit

**Outgoing:**
- GitHub Pull Request Review Comments API — Inline comments on diff lines
- Cursor SDK agent sessions — Long-running agent calls during review

## Review Modes (Planned Integration Surface)

Per `action.yml` and `README.md`, selectable modes:
- `code-review` — General code review (default)
- `security-review` — Security-focused review
- `simplify` — Simplification/refactor suggestions

These map to prompt templates or agent scripts (not yet implemented in `src/`).

---

*Integration audit: 2026-07-05*
*Update when adding/removing external services*
