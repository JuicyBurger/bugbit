# Architecture

**Analysis Date:** 2026-07-05

## Pattern Overview

**Overall:** GitHub Action Orchestrator — Thin TypeScript action that delegates review work to Cursor SDK agents

**Key Characteristics:**
- Single bundled entry point (`dist/index.js` from `lib/main.js`)
- Stateless per workflow run
- Input-driven configuration via `action.yml`
- Separation: bugbit orchestrates; agent scripts consume `GITHUB_TOKEN` for PR API work
- Build pipeline: TypeScript → CommonJS (`lib/`) → ncc bundle (`dist/`)

## Layers

**Action Entry (planned `src/main.ts`):**
- Purpose: GitHub Actions entry point; read inputs, coordinate review lifecycle
- Contains: `run()` handler, input parsing, error surfacing via `@actions/core`
- Depends on: Orchestration layer, `@actions/core`
- Used by: GitHub Actions runtime via `action.yml` `main: dist/index.js`

**Orchestration (planned):**
- Purpose: Checkout PR context, resolve branches, select review modes, invoke Cursor SDK
- Contains: Mode routing, prompt assembly, agent session management
- Depends on: `@cursor/sdk`, action inputs
- Used by: Action entry

**Agent Scripts (planned, Section 4 per project design):**
- Purpose: Read PR context and post inline comments via GitHub API
- Contains: Review logic scripts invoked by or alongside the agent
- Depends on: `GITHUB_TOKEN` (forwarded env), GitHub PR APIs
- Used by: Cursor agent runtime — not bugbit's orchestration code directly

**Build/Bundle (tooling):**
- Purpose: Produce distributable single-file action
- Contains: `tsc` compile step, `ncc` bundle step
- Location: `package.json` scripts `build`, `bundle`

## Data Flow

**PR Review Workflow (intended, per README.md):**

1. GitHub Actions triggers bugbit on a pull request event
2. Workflow checks out PR; action receives inputs from `action.yml`
3. bugbit reads `cursor-api-key`, `model`, `review-modes`, `github-token`
4. bugbit resolves head/base branches from Actions context
5. bugbit builds review prompt(s) from selected mode(s): `code-review`, `security-review`, `simplify`
6. bugbit invokes Cursor SDK with configured model (default `composer-2.5`)
7. Agent scripts use forwarded `GITHUB_TOKEN` to read PR diff and post inline review comments
8. Action completes; findings appear as line-anchored PR comments (not summary wall-of-text)

**State Management:**
- Stateless — No database; all state from GitHub Actions context and PR metadata
- Ephemeral agent session during single workflow run

## Key Abstractions

**Review Mode:**
- Purpose: Selectable review strategy (comma-separated in `review-modes` input)
- Examples: `code-review`, `security-review`, `simplify`
- Pattern: Input → prompt template → agent invocation

**Action Input:**
- Purpose: Public API surface for consumers
- Examples: `cursor-api-key`, `model`, `review-modes`, `github-token`
- Pattern: Declared in `action.yml`, read via `@actions/core.getInput`

**Orchestration vs Agent Scripts:**
- Purpose: Clear boundary — bugbit wires SDK + inputs; scripts own GitHub PR API interaction
- Pattern: `github-token` forwarded as env var, not used by orchestration code

## Entry Points

**Production Entry:**
- Location: `dist/index.js` (bundled from `lib/main.js` ← `src/main.ts`)
- Triggers: GitHub Actions `uses:` reference with `node20` runtime
- Responsibilities: Parse inputs, run review orchestration, fail action on error

**Build Entry:**
- Location: `package.json` scripts
- Triggers: `pnpm run build`, `pnpm run bundle`
- Responsibilities: Compile TypeScript, produce distributable bundle

## Error Handling

**Strategy (planned, conventional for Actions):**
- Use `@actions/core.setFailed()` for fatal errors
- Log context with `core.info` / `core.warning` / `core.error`
- Fail fast on missing required inputs (`cursor-api-key`)

**Patterns:**
- Validate `review-modes` against allowed set before invoking agents
- Surface SDK/API errors with actionable messages in workflow logs

## Cross-Cutting Concerns

**Logging:**
- `@actions/core` — Workflow-visible logs only

**Validation:**
- Action-level: required inputs in `action.yml`
- Runtime: validate mode names, model id format (planned)

**Authentication:**
- Cursor API key — secret input, never logged
- GitHub token — forwarded to scripts, default workflow token

---

*Architecture analysis: 2026-07-05*
*Update when major patterns change*
