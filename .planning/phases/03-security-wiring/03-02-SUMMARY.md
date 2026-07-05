---
phase: 03-security-wiring
plan: 02
subsystem: security
tags: [permissions.json, fork-preflight, custom-tools, jest, github-actions]

requires:
  - phase: 03-01
    provides: bugbitTools.ts custom tools, operations.mjs, secret masking in main/cursorAgent
provides:
  - .cursor/permissions.json with read-only shell allowlist and custom-user-tools MCP path
  - copyPermissionsToWorkspace bootstrap copy to PR workspace .cursor/
  - isForkPullRequest fail-fast preflight with DOCS-04 message
  - Unit tests for tools, fork detection, and Agent.create wiring
  - Manual E2E checklist for live PR validation
affects: [phase-4-ship]

tech-stack:
  added: []
  patterns:
    - "permissions.json copied to cwd/.cursor/ at bootstrap before Agent.create"
    - "Fork PRs fail loud before agent starts — no silent no-op"
    - "Jest moduleNameMapper mock for ESM-only @actions/core in tests"

key-files:
  created:
    - .cursor/permissions.json
    - __tests__/bugbitTools.test.ts
    - __tests__/forkPreflight.test.ts
    - __tests__/cursorAgent.test.ts
    - __tests__/__mocks__/actionsCore.ts
    - .planning/phases/03-security-wiring/03-E2E-CHECKLIST.md
  modified:
    - src/bugbitTools.ts
    - src/main.ts
    - src/cursorAgent.ts
    - jest.config.ts

key-decisions:
  - "permissions.json is best-effort shell policy; custom tools remain the trust boundary for PR ops"
  - "node/scripts/ excluded from terminalAllowlist — PR ops are custom tools only"
  - "sandboxOptions.enabled and autoReview added to Agent.create local config"

patterns-established:
  - "Fork preflight runs after input read, before copyPermissionsToWorkspace and runAgent"
  - "Unit tests mock operations.mjs via temp actionPath fixture with real dynamic import"

requirements-completed: [SEC-01, SEC-02, SEC-03, SEC-04]

duration: 15min
completed: 2026-07-05
---

# Phase 3 Plan 2: Permissions, Fork Preflight & Tests Summary

**Read-only permissions.json with workspace copy, fork PR fail-fast preflight, dual secret masking verification, and unit test coverage for custom tools and Agent.create wiring**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-05T21:10:00Z
- **Completed:** 2026-07-05T21:25:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Shipped `.cursor/permissions.json` with `custom-user-tools:*` MCP allowlist and read-only exploration shell commands (no `node`)
- Added `copyPermissionsToWorkspace` and `isForkPullRequest` helpers wired in `main.ts` bootstrap
- Enabled `sandboxOptions` and `autoReview` in `cursorAgent.ts` local agent config
- Added unit tests for tool schemas, fork detection, permissions copy, and customTools passed to `Agent.create`
- Documented manual E2E validation checklist for live PR runs

## Task Commits

Each task was committed atomically:

1. **Task 1: Ship permissions.json and copy into PR workspace at bootstrap** - `5c1d630` (feat)
2. **Task 2: Fork PR preflight and dual secret masking verification** - `8f85b31` (feat)
3. **Task 3: Unit tests for tools, fork preflight, cursorAgent wiring, and E2E checklist** - `6199409` (test)

## Files Created/Modified

- `.cursor/permissions.json` - Shell exploration allowlist and autoRun block instructions
- `src/bugbitTools.ts` - `copyPermissionsToWorkspace` and `isForkPullRequest` exports
- `src/main.ts` - Fork preflight, permissions copy, secret masking before agent run
- `src/cursorAgent.ts` - `sandboxOptions`, `autoReview`, permissions best-effort comment
- `__tests__/bugbitTools.test.ts` - Tool schema, handler shapes, permissions copy tests
- `__tests__/forkPreflight.test.ts` - Fork and same-repo event fixture tests
- `__tests__/cursorAgent.test.ts` - Agent.create customTools and timeout tests
- `__tests__/__mocks__/actionsCore.ts` - Jest mock for ESM-only @actions/core
- `jest.config.ts` - moduleNameMapper for @actions/core
- `.planning/phases/03-security-wiring/03-E2E-CHECKLIST.md` - Manual live PR validation steps

## Decisions Made

- permissions.json applies to Shell exploration only; PR operations stay on custom tools (SEC-01 reinterpretation)
- Fork PRs fail at bootstrap with DOCS-04 reference — no agent startup on cross-repo head
- Jest tests use temp-dir mock operations.mjs for dynamic import rather than unstable_mockModule

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Jest mock for ESM-only @actions/core**
- **Found during:** Task 3 (cursorAgent.test.ts)
- **Issue:** Jest could not resolve `@actions/core` (ESM-only `import` export, no CommonJS require)
- **Fix:** Added `__tests__/__mocks__/actionsCore.ts` and `moduleNameMapper` in jest.config.ts
- **Files modified:** jest.config.ts, __tests__/__mocks__/actionsCore.ts
- **Verification:** `pnpm test` exits 0 (31 tests)
- **Committed in:** 6199409 (Task 3 commit)

**2. [Rule 1 - Bug] Timeout test used setTimeout spy instead of fake timers**
- **Found during:** Task 3 (cursorAgent timeout test)
- **Issue:** `jest.useFakeTimers` with 45-minute advance caused hung test and unhandled rejection
- **Fix:** Spy on `setTimeout` to invoke callback immediately for deterministic timeout rejection
- **Files modified:** __tests__/cursorAgent.test.ts
- **Verification:** cursorAgent timeout test passes without 5s Jest timeout
- **Committed in:** 6199409 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Test infrastructure fixes only; no production behavior changes beyond plan scope.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 complete — ready for Phase 4 (bundle, CI, consumer documentation)
- Manual E2E checklist available for live PR validation before ship
- `dist/index.js` bundle still deferred to Phase 4

## Self-Check: PASSED

---
*Phase: 03-security-wiring*
*Completed: 2026-07-05*
