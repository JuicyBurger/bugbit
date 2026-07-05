# Roadmap: bugbit

## Overview

Build bugbit from scaffolding to a shippable self-hosted GitHub Action in four coarse phases: establish the thin TypeScript bootstrap with Cursor SDK and prompts, add agent-callable GitHub scripts, lock down permissions and wire the full review loop, then bundle, CI, and document for consumers.

## Phases

- [x] **Phase 1: Bootstrap & SDK** — Thin action entry, prompts, review modes, Cursor agent integration (2026-07-05)
- [x] **Phase 2: Agent Scripts** — PR context, diff, and inline comment posting tools (2026-07-05)
- [ ] **Phase 3: Security & Wiring** — permissions.json, token boundaries, end-to-end agent loop
- [ ] **Phase 4: Ship** — Bundle, CI, documentation, release-ready artifact

## Phase Details

### Phase 1: Bootstrap & SDK
**Goal**: A runnable action bootstrap that loads prompts, validates modes, guards checkout, and starts a Cursor agent on the PR workspace.
**Depends on**: Nothing (first phase)
**Requirements**: BOOT-01, BOOT-02, BOOT-05, BOOT-06, BOOT-07, SDK-01, SDK-02, SDK-03, MODE-01, MODE-02, MODE-03, MODE-04, PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04, TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. Running the action bootstrap on a checked-out repo starts a Cursor agent with the combined system + mode prompt
  2. Unknown `review-modes` values cause a clear action failure before the agent starts
  3. `pnpm test` passes for review mode parsing, prompt loading, and checkout guard
**Plans**: 2 plans

Plans:
- [x] 01-01: Jest config, `checkCheckout.ts`, `reviewModes.ts`, prompt files
- [x] 01-02: `cursorAgent.ts`, `main.ts` skeleton, SDK smoke test on runner Node version

### Phase 2: Agent Scripts
**Goal**: Agent-callable scripts that read PR context, fetch diffs, and post inline review comments via GitHub API.
**Depends on**: Phase 1
**Requirements**: SCRIPT-01, SCRIPT-02, SCRIPT-03, SCRIPT-04, SCRIPT-05, SCRIPT-06, BOOT-03, BOOT-04
**Success Criteria** (what must be TRUE):
  1. Agent can run `pr-context.mjs` and `get-diff.mjs` in a PR workflow and receive valid JSON
  2. Agent can post inline comments via `post-review.mjs` anchored to real diff lines
  3. Invalid path/line combinations return structured errors without posting
**Plans**: 2 plans

Plans:
- [x] 02-01: `scripts/lib/octokit.mjs`, `pr-context.mjs`, `get-diff.mjs`
- [x] 02-02: `post-inline-comment.mjs`, `post-review.mjs`, diff line validation

### Phase 3: Security & Wiring
**Goal**: Constrain the agent's shell access and complete the end-to-end review loop with secret handling.
**Depends on**: Phase 2
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Four PR operations exposed as SDK custom tools (`get_pr_context`, `get_diff`, `post_review`, `post_inline_comment`); shell constrained by `permissions.json` for exploration only
  2. Both `cursor-api-key` and `github-token` masked in workflow logs via `core.setSecret`
  3. Fork PRs fail loud at bootstrap; same-repo PR review completes with agent tool calls and inline comments posted
**Plans**: 2 plans

Plans:
- [x] 03-01: Refactor script libs for closure injection, `bugbitTools.ts` custom tools, wire `cursorAgent`/`main.ts`, rewrite `system.md` for tools
- [x] 03-02: `permissions.json` + workspace copy, fork PR preflight, secret masking verification, unit tests + E2E checklist

### Phase 4: Ship
**Goal**: Reproducible build pipeline, CI, consumer documentation, and release-ready `dist/index.js`.
**Depends on**: Phase 3
**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05, DOCS-01, DOCS-02, DOCS-03, DOCS-04
**Success Criteria** (what must be TRUE):
  1. `pnpm run bundle` produces a working `dist/index.js` referenced by `action.yml`
  2. CI runs build, bundle, and test on every push
  3. README enables a new consumer to add bugbit to their repo with checkout, secrets, and permissions
**Plans**: 2 plans

Plans:
- [ ] 04-01: CI workflow, bundle verification, Node version resolution (node20 vs node22)
- [ ] 04-02: README consumer guide, reference workflow, release process for committed `dist/`

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bootstrap & SDK | 2/2 | Complete | 2026-07-05 |
| 2. Agent Scripts | 3/3 | Complete   | 2026-07-05 |
| 3. Security & Wiring | 1/2 | In Progress | - |
| 4. Ship | 0/2 | Not started | - |
