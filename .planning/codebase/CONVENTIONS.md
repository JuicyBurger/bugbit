# Coding Conventions

**Analysis Date:** 2026-07-05

## Naming Patterns

**Files:**
- `kebab-case` for repo-level config (`action.yml`, `tsconfig.json`)
- `main.ts` for GitHub Action entry (per `package.json` bundle target `lib/main.js`)
- `*.test.ts` expected for Jest (no examples yet — follow on first test)

**Functions:**
- camelCase expected (TypeScript default, strict mode)
- Async without special prefix (Actions code is inherently async)

**Variables:**
- camelCase for variables
- UPPER_SNAKE_CASE for constants and env var names (`GITHUB_TOKEN`)

**Types:**
- PascalCase for interfaces and types
- No `I` prefix on interfaces (TypeScript convention)

## Code Style

**Formatting:**
- No Prettier or ESLint config in repo yet
- `tsconfig.json` enforces `strict: true`

**Linting:**
- Not configured — opportunity to add ESLint + Prettier in a future phase

**TypeScript:**
- Target ES2022, output CommonJS (`tsconfig.json`)
- `esModuleInterop: true`, `skipLibCheck: true`

## Import Organization

**Expected pattern (no source files yet):**
1. Node built-ins (`fs`, `path`)
2. External packages (`@actions/core`, `@actions/github`, `@cursor/sdk`)
3. Relative internal imports (`./modes/code-review`)

**Path Aliases:**
- None configured in `tsconfig.json` — use relative imports until aliases added

## Error Handling

**GitHub Actions pattern (expected):**
- Fatal failures: `core.setFailed(message)` then return/throw
- Non-fatal issues: `core.warning()`
- Never log secrets (`cursor-api-key`, tokens)

**Async:**
- `async/await` preferred over raw Promise chains in Action handlers

## Logging

**Framework:**
- `@actions/core` only — `core.info`, `core.debug`, `core.warning`, `core.error`

**Patterns:**
- Log review mode, model id, PR number — not API keys or full tokens
- Use `core.setSecret()` for any value that might appear in logs (if masking needed)

## Comments

**When to Comment:**
- Explain non-obvious orchestration boundaries (e.g., why `github-token` is forwarded not used)
- Document review mode behavior and GitHub API constraints
- Avoid restating `action.yml` input descriptions in code

**JSDoc/TSDoc:**
- Useful for public helper functions; entry `run()` can stay minimal

## Function Design

**Size:**
- Keep action entry thin — delegate to modules per review mode

**Parameters:**
- Read inputs once at top of `run()`, pass structured config object inward

**Return Values:**
- Action `run()` typically `Promise<void>`; success implicit unless `setFailed`

## Module Design

**Exports:**
- Named exports for testable modules
- `main.ts` exports `run` or calls it when executed as entry

**Package type note:**
- `package.json` has `"type": "module"` but compiled output is CommonJS
- Source `.ts` files use TypeScript module syntax; `tsc` emits `require()` — do not mix ESM `import.meta` in Action code without adjusting config

---

*Convention analysis: 2026-07-05*
*Update when patterns emerge in `src/` implementation*
