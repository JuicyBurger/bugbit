# Testing Patterns

**Analysis Date:** 2026-07-05

## Test Framework

**Runner:**
- Jest 30.4.2 — Declared in `package.json` devDependencies
- Config: **Not yet present** — no `jest.config.js` / `jest.config.ts`

**Transform:**
- ts-jest 29.4.11 — Installed, not yet wired in config

**Assertion Library:**
- Jest built-in `expect`

**Run Commands:**
```bash
pnpm test                              # Run all tests (script exists)
pnpm test -- path/to/file.test.ts      # Single file (once tests exist)
```

## Test File Organization

**Location:**
- Not established — no `src/` or test files yet
- Recommended: collocated `src/**/*.test.ts` or `__tests__/` adjacent to modules

**Naming:**
- `*.test.ts` — Standard Jest convention

**Structure (planned):**
```
src/
  main.ts
  main.test.ts
  modes/
    code-review.ts
    code-review.test.ts
```

## Test Structure

**Expected pattern:**
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('reviewModes', () => {
  it('parses comma-separated modes', () => {
    expect(parseReviewModes('code-review,security-review')).toEqual([
      'code-review',
      'security-review',
    ]);
  });
});
```

**Patterns:**
- Mock `@actions/core` and `@cursor/sdk` in unit tests
- Mock `@actions/github` for PR API interaction tests
- Use `beforeEach` to reset mocks

## Mocking

**Framework:**
- Jest built-in (`jest.mock`, `jest.fn`)

**What to Mock:**
- `@cursor/sdk` — Agent API calls (expensive, external)
- `@actions/github` — Octokit PR/review endpoints
- `@actions/core` — `getInput`, `setFailed` (verify failure paths)
- `process.env.GITHUB_TOKEN` — When testing script env forwarding

**What NOT to Mock:**
- Pure prompt-building and mode-parsing utilities
- Input validation helpers

**Example (planned):**
```typescript
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
}));
```

## Fixtures and Factories

**Test Data:**
- Factory for mock PR context (head/base refs, diff payload)
- Factory for action inputs (`cursor-api-key`, `model`, `review-modes`)
- Location: `src/__fixtures__/` or `tests/fixtures/` (TBD)

## Coverage

**Requirements:**
- No coverage target configured yet
- No `test:coverage` script in `package.json`

**Configuration:**
- To add: Jest `collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts']`

## Test Types

**Unit Tests:**
- Mode parsing, prompt assembly, input validation
- Mock all external SDK/API calls

**Integration Tests:**
- Optional: mock Cursor SDK + GitHub API with recorded fixtures
- Verify orchestration calls SDK with correct model/modes

**E2E Tests:**
- Not in-repo — validated by running action in a test GitHub workflow
- Future: `.github/workflows/integration.yml` against a test repo

## Common Patterns

**Async Testing:**
```typescript
it('invokes cursor sdk', async () => {
  await runReview(config);
  expect(mockSdk.createSession).toHaveBeenCalled();
});
```

**Error Testing:**
```typescript
it('fails on missing api key', async () => {
  mockGetInput.mockReturnValue('');
  await run();
  expect(setFailed).toHaveBeenCalledWith(expect.stringContaining('cursor-api-key'));
});
```

## Gaps (Current State)

- No `jest.config` — `pnpm test` will fail or use defaults until configured
- No test files
- No CI workflow running tests
- ts-jest needs explicit config for TypeScript + CommonJS output compatibility

---

*Testing analysis: 2026-07-05*
*Update when test patterns are established in `src/`*
