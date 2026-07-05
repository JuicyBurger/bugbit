# Requirements: bugbit

**Defined:** 2026-07-05
**Core Value:** Every PR gets line-anchored review feedback from your own Cursor agent — without a separate vendor black box.

## v1 Requirements

### Action Bootstrap

- [ ] **BOOT-01**: Action reads `cursor-api-key`, `model`, `review-modes`, and `github-token` inputs via `@actions/core`
- [ ] **BOOT-02**: Action fails fast with a clear message when the repository is not checked out (`checkCheckout.ts`)
- [x] **BOOT-03**: Action sets `GITHUB_TOKEN` in the environment for agent scripts from the `github-token` input
- [x] **BOOT-04**: Action does not use `github-token` in orchestration code — only scripts consume it
- [ ] **BOOT-05**: Action loads `prompts/system.md` plus selected mode prompt files and sends the combined prompt to the Cursor agent
- [ ] **BOOT-06**: Action streams agent events to workflow logs via `core.info`
- [ ] **BOOT-07**: Action calls `core.setFailed` on unrecoverable errors

### Cursor SDK Integration

- [ ] **SDK-01**: Action creates a local Cursor agent with `local.cwd` set to the checked-out PR repository workspace
- [ ] **SDK-02**: Action uses the `model` input (default `composer-2.5`) when creating the agent
- [ ] **SDK-03**: Action documents script paths in the system prompt using `GITHUB_ACTION_PATH` so the agent can invoke tools from the action install directory

### Review Modes

- [ ] **MODE-01**: `review-modes` accepts a comma-separated list of `code-review`, `security-review`, and `simplify`
- [ ] **MODE-02**: Action validates mode names and fails on unknown modes
- [ ] **MODE-03**: Action supports running any subset or all three modes in a single action run
- [ ] **MODE-04**: Each mode has a dedicated prompt file under `prompts/`

### Agent Scripts

- [x] **SCRIPT-01**: `scripts/pr-context.mjs` prints PR number, head/base branches, and SHAs as JSON
- [x] **SCRIPT-02**: `scripts/get-diff.mjs` prints changed files and diff hunks for the current PR as JSON
- [x] **SCRIPT-03**: `scripts/post-inline-comment.mjs` posts one inline comment given `--path`, `--line`, and `--body`
- [x] **SCRIPT-04**: `scripts/post-review.mjs` posts multiple inline comments from a JSON findings file as one PR review
- [x] **SCRIPT-05**: `scripts/lib/octokit.mjs` is the sole module that reads `GITHUB_TOKEN` and constructs the Octokit client
- [x] **SCRIPT-06**: Scripts validate comment path/line against the PR diff before posting and return structured errors on failure

### Prompts

- [ ] **PROMPT-01**: `prompts/system.md` tells the agent it runs in GitHub Actions, lists available scripts with exact usage, and instructs orientation flow (pr-context → get-diff → review → post-review)
- [ ] **PROMPT-02**: `prompts/code-review.md` instructs general correctness and bug-focused review
- [ ] **PROMPT-03**: `prompts/security-review.md` instructs security audit (injection, XSS, auth, secrets)
- [ ] **PROMPT-04**: `prompts/simplify.md` instructs simplification and readability review

### Security & Permissions

- [x] **SEC-01**: `.cursor/permissions.json` allowlists only the four bugbit scripts plus read access
- [x] **SEC-02**: `.cursor/permissions.json` denies destructive shell, writes, and sensitive file reads (`.env`, `*.key`)
- [x] **SEC-03**: Action masks `cursor-api-key` from logs using `core.setSecret` where applicable
- [x] **SEC-04**: Scripts are narrow and non-destructive — no file writes, no git push, no network beyond GitHub API

### Build & Release

- [ ] **BUILD-01**: TypeScript compiles `src/` to CommonJS in `lib/` via `pnpm run build`
- [ ] **BUILD-02**: `pnpm run bundle` produces `dist/index.js` via ncc from `lib/main.js`
- [ ] **BUILD-03**: `action.yml` entry point references `dist/index.js` on `node20` (or `node22` if SDK requires it)
- [ ] **BUILD-04**: CI workflow (`.github/workflows/ci.yml`) runs build, bundle, and test on push
- [ ] **BUILD-05**: Release process documents committing up-to-date `dist/index.js` before tagging

### Testing

- [ ] **TEST-01**: Jest configured with ts-jest for TypeScript unit tests
- [ ] **TEST-02**: Unit tests cover `reviewModes` parsing and prompt loading
- [ ] **TEST-03**: Unit tests cover checkout guard behavior

### Documentation

- [ ] **DOCS-01**: README documents required `actions/checkout` step before bugbit
- [ ] **DOCS-02**: README documents `CURSOR_API_KEY` secret setup and reference consumer workflow
- [ ] **DOCS-03**: README documents required workflow permissions (`pull-requests: write`, `contents: read`)
- [ ] **DOCS-04**: README documents forked-PR token limitation

## v2 Requirements

### Review Quality

- **QUAL-01**: ` ```suggestion ` blocks in inline comments for one-click apply
- **QUAL-02**: Severity/category tags on findings (`[CRITICAL · security]`, etc.)
- **QUAL-03**: Large-PR diff chunking with deduplication across chunks

### Security Scanning

- **SCAN-01**: Deterministic secrets scanning on changed lines
- **SCAN-02**: CVE lookup on changed lockfiles (OSV)

### Operations

- **OPS-01**: Stale inline comment resolution on re-run
- **OPS-02**: Configurable job timeout guidance for large PRs
- **OPS-03**: GitHub Marketplace listing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hosted review SaaS | Contradicts self-hosted Cursor account model |
| Orchestrator posting comments (no agent scripts) | Superseded by agent-driven architecture in overview |
| Arbitrary agent shell access | CI safety; only allowlisted scripts |
| Auto-merge / auto-approve | Out of scope for review-only action |
| Multi-LLM provider abstraction | bugbit is Cursor SDK-specific |
| Fork PR permission escalation | Security risk; document only |
| Cursor Community forum post | Marketing, not code |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOT-01 | Phase 1 | Complete |
| BOOT-02 | Phase 1 | Complete |
| BOOT-03 | Phase 2 | Complete |
| BOOT-04 | Phase 2 | Complete |
| BOOT-05 | Phase 1 | Complete |
| BOOT-06 | Phase 1 | Complete |
| BOOT-07 | Phase 1 | Complete |
| SDK-01 | Phase 1 | Complete |
| SDK-02 | Phase 1 | Complete |
| SDK-03 | Phase 1 | Complete |
| MODE-01 | Phase 1 | Complete |
| MODE-02 | Phase 1 | Complete |
| MODE-03 | Phase 1 | Complete |
| MODE-04 | Phase 1 | Complete |
| SCRIPT-01 | Phase 2 | Complete |
| SCRIPT-02 | Phase 2 | Complete |
| SCRIPT-03 | Phase 2 | Complete |
| SCRIPT-04 | Phase 2 | Complete |
| SCRIPT-05 | Phase 2 | Complete |
| SCRIPT-06 | Phase 2 | Complete |
| PROMPT-01 | Phase 1 | Complete |
| PROMPT-02 | Phase 1 | Complete |
| PROMPT-03 | Phase 1 | Complete |
| PROMPT-04 | Phase 1 | Complete |
| SEC-01 | Phase 3 | Complete |
| SEC-02 | Phase 3 | Complete |
| SEC-03 | Phase 3 | Complete |
| SEC-04 | Phase 3 | Complete |
| BUILD-01 | Phase 4 | Pending |
| BUILD-02 | Phase 4 | Pending |
| BUILD-03 | Phase 4 | Pending |
| BUILD-04 | Phase 4 | Pending |
| BUILD-05 | Phase 4 | Pending |
| TEST-01 | Phase 1 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 1 | Complete |
| DOCS-01 | Phase 4 | Pending |
| DOCS-02 | Phase 4 | Pending |
| DOCS-03 | Phase 4 | Pending |
| DOCS-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-05*
*Last updated: 2026-07-05 after roadmap creation*
