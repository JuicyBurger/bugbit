# bugbit

## What This Is

bugbit is a lightweight, self-hosted GitHub Action that reviews pull requests using your own Cursor account and agent runtime. Instead of an opaque hosted reviewer, it calls the Cursor SDK from inside the workflow — same models, context handling, and codebase understanding as the Cursor editor, triggered automatically on every PR.

The agent drives its own review: it calls small scripts (`pr-context`, `get-diff`, `post-inline-comment`, `post-review`) to orient itself and post findings. bugbit's TypeScript code is intentionally thin — verify checkout, load prompts, set tool permissions, start the agent. Comments land inline on the PR diff, not as a wall of text.

## Core Value

Every PR gets line-anchored review feedback from your own Cursor agent — without a separate vendor black box — with the agent deciding when to fetch context, inspect code, and post comments.

## Requirements

### Validated

- ✓ GitHub Action metadata (`action.yml`) with inputs: `cursor-api-key`, `model`, `review-modes`, `github-token` — existing
- ✓ TypeScript build toolchain (`tsconfig.json`, `pnpm` scripts: `build`, `bundle`, `test`) — existing
- ✓ Core dependencies installed (`@actions/core`, `@actions/github`, `@cursor/sdk`) — existing
- ✓ Project README describing intent and high-level flow — existing

### Active

- [ ] Thin action bootstrap (`src/main.ts`) — checkout guard, read inputs, load prompt, start agent, stream logs
- [ ] Checkout verification (`src/checkCheckout.ts`) — fail fast if repo not checked out
- [ ] Cursor SDK wrapper (`src/cursorAgent.ts`) — create agent, send prompt, stream events
- [ ] Review mode loader (`src/reviewModes.ts`) — map `review-modes` input to prompt files
- [ ] System prompt (`prompts/system.md`) — agent environment, available scripts, usage instructions
- [ ] Mode prompts (`prompts/code-review.md`, `prompts/security-review.md`, `prompts/simplify.md`)
- [ ] Agent scripts: `scripts/pr-context.mjs`, `scripts/get-diff.mjs`, `scripts/post-inline-comment.mjs`, `scripts/post-review.mjs`
- [ ] Shared Octokit client (`scripts/lib/octokit.mjs`) — sole reader of `GITHUB_TOKEN`
- [ ] Shell permissions allowlist (`.cursor/permissions.json`) — restrict agent to bugbit scripts + read
- [ ] Bundled distributable (`dist/index.js`) — committed, matches `src/` at release
- [ ] CI workflow (`.github/workflows/ci.yml`) — lint, build, bundle, test on push
- [ ] Unit tests (`__tests__/reviewModes.test.ts` + Jest config)
- [ ] Consumer reference workflow documented (checkout before bugbit, permissions, secrets)

### Out of Scope

- Hosted/managed review service — bugbit is self-hosted by design
- bugbit orchestration posting comments directly — agent scripts own PR API interaction
- Arbitrary shell access for the agent — only allowlisted `scripts/` via permissions.json
- GitHub Marketplace publishing — defer until v1 works end-to-end
- Cursor Community forum post — marketing artifact, not implementation (Section 8 of overview)
- Forked-PR token widening — document limitation; no automatic permission escalation

## Context

**Brownfield state:** Scaffolding complete (`action.yml`, `package.json`, `tsconfig.json`, `README.md`). No `src/`, `scripts/`, `prompts/`, or `dist/` yet. Codebase map at `.planning/codebase/`.

**Architecture shift (overview revision):** Earlier designs had bugbit fetch diffs and post comments after the agent. Current design: agent invokes scripts itself via shell tool. `github-token` is forwarded as `GITHUB_TOKEN` to scripts only.

**Consumer requirements:**
- Workflow must run `actions/checkout` before bugbit (SDK indexes working tree)
- `CURSOR_API_KEY` secret → `cursor-api-key` input
- Default model: `composer-2.5` (updated from overview's `composer-2`)
- Review modes composable: any subset of `code-review`, `security-review`, `simplify`

**Security posture:**
- `permissions.json` is best-effort (per Cursor docs), not a hard boundary
- Scripts are the real trust boundary — narrow, non-destructive, validate inputs
- Deny writes, destructive shell, `.env` reads in permissions.json

## Constraints

- **Runtime**: Node.js 20 (`action.yml` `using: node20`) — GitHub Actions requirement
- **Module format**: TypeScript compiles to CommonJS (`tsconfig.json`) — required for ncc-bundled Action
- **Distribution**: Single bundled `dist/index.js` via `@vercel/ncc` — consumers never run install
- **Auth**: Cursor API key required; GitHub token for scripts only
- **Package manager**: pnpm 11.5.2 pinned in `devEngines`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Agent-driven scripts, not orchestrator posting | Agent decides when to fetch context and comment; matches Cursor's native tool-use model | — Pending |
| Thin `src/main.ts` | Separation of concerns; bugbit boots agent, scripts handle GitHub API | — Pending |
| `GITHUB_TOKEN` forwarded to scripts only | Clear trust boundary; orchestration doesn't need PR write access | — Pending |
| `post-review.mjs` preferred over repeated single comments | Avoid PR comment spam; batch as one review | — Pending |
| Default model `composer-2.5` | Current Cursor model; updated from overview doc | — Pending |
| Commit `dist/index.js` | Standard pattern for JS Actions; consumers reference tag directly | — Pending |
| `permissions.json` allowlist | Restrict unattended CI agent shell access to bugbit scripts | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-05 after initialization*
