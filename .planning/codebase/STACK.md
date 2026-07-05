# Technology Stack

**Analysis Date:** 2026-07-05

## Languages

**Primary:**
- TypeScript 6.x — Application source (planned under `src/`, not yet present)

**Secondary:**
- YAML — GitHub Action metadata (`action.yml`)
- Markdown — Documentation (`README.md`)

## Runtime

**Environment:**
- Node.js 20.x — Required by `action.yml` (`runs.using: node20`)
- GitHub Actions runner — Production execution environment for the bundled action

**Package Manager:**
- pnpm 11.5.2 — Pinned via `package.json` `devEngines.packageManager`
- Lockfile: `pnpm-lock.yaml` (via pnpm; `node_modules/.pnpm/lock.yaml` present)

## Frameworks

**Core:**
- GitHub Actions — Action runtime and workflow integration
- `@actions/core` 3.x — Action inputs, outputs, logging
- `@actions/github` 9.x — GitHub API client (Octokit wrapper)
- `@cursor/sdk` 1.x — Cursor agent API for PR review orchestration

**Testing:**
- Jest 30.x — Test runner (`package.json` script: `test`)
- ts-jest 29.x — TypeScript transform for Jest

**Build/Dev:**
- TypeScript 6.x — Compiles `src/` → `lib/` (`tsconfig.json`, `module: CommonJS`)
- `@vercel/ncc` 0.44.x — Bundles `lib/main.js` → `dist/index.js` for Action distribution

## Key Dependencies

**Critical:**
- `@cursor/sdk` — Core agent runtime; bugbit calls Cursor directly from the workflow
- `@actions/core` — Reads action inputs (`cursor-api-key`, `model`, `review-modes`, `github-token`)
- `@actions/github` — PR context and review comment posting (or delegation to agent scripts)

**Infrastructure:**
- `@types/node` 26.x — Node.js type definitions for TypeScript
- `@vercel/ncc` — Single-file bundle required for GitHub Actions `main` entry

## Configuration

**Environment:**
- Action inputs defined in `action.yml` (secrets passed at workflow runtime)
- No `.env` files in repo; `.env` and `.env.*` are gitignored

**Build:**
- `tsconfig.json` — `target: ES2022`, `module: CommonJS`, `outDir: ./lib`, `rootDir: ./src`, `strict: true`
- `package.json` scripts:
  - `build` → `tsc`
  - `bundle` → `pnpm run build && ncc build lib/main.js -o dist`
  - `test` → `jest`

**Notable mismatch:**
- `package.json` sets `"type": "module"` (ESM package semantics)
- `tsconfig.json` compiles to CommonJS for Actions runtime — intentional per project design

## Platform Requirements

**Development:**
- Node.js 20+ recommended (matches Action runtime)
- pnpm 11.5.2 (enforced via `devEngines`)
- Any OS with Node.js/pnpm support

**Production:**
- Distributed as a GitHub Action (`action.yml` + bundled `dist/index.js`)
- Consumers reference the repo/tag in workflow `uses:` blocks
- Bundle output `dist/` is gitignored; must be built before release/tag

---

*Stack analysis: 2026-07-05*
*Update after major dependency changes*
