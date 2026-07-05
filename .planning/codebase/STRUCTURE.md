# Codebase Structure

**Analysis Date:** 2026-07-05

## Directory Layout

```
bugbit/
├── .planning/
│   └── codebase/       # GSD codebase map (this directory)
├── action.yml          # GitHub Action metadata and public inputs
├── package.json        # Dependencies, scripts, pnpm engine pin
├── tsconfig.json       # TypeScript → CommonJS for Actions
├── README.md           # Project overview and how-it-works
├── .gitignore          # Node/JS ignores; dist/ excluded
├── node_modules/       # pnpm dependencies (gitignored)
├── src/                # TypeScript source (planned, not yet created)
├── lib/                # tsc output (planned, gitignored pattern via dist)
└── dist/               # ncc bundle for Action entry (gitignored)
```

## Directory Purposes

**Root (flat config):**
- Purpose: Action manifest, build config, documentation
- Contains: `action.yml`, `package.json`, `tsconfig.json`, `README.md`
- Key files: `action.yml` (public interface), `package.json` (build scripts)

**`src/` (planned):**
- Purpose: TypeScript application source
- Contains: `main.ts` entry, orchestration modules, mode prompts
- Key files: `src/main.ts` → compiles to `lib/main.js`
- Subdirectories: TBD (likely `modes/`, `lib/` helpers, or flat initially)

**`lib/` (build output):**
- Purpose: Compiled CommonJS from `tsc`
- Source: `pnpm run build`
- Committed: No (intermediate; `dist/` is the shipped artifact)

**`dist/` (bundle output):**
- Purpose: Single-file Action entry referenced by `action.yml`
- Source: `pnpm run bundle` (`ncc build lib/main.js -o dist`)
- Committed: No — listed in `.gitignore` (line 83)

**`.planning/codebase/`:**
- Purpose: GSD planning artifacts describing codebase state
- Committed: Yes (when GSD commit_docs enabled)

## Key File Locations

**Entry Points:**
- `action.yml` — Declares `main: dist/index.js`, `using: node20`
- `src/main.ts` — Planned TypeScript entry (not yet present)
- `dist/index.js` — Runtime entry after bundle (not yet built)

**Configuration:**
- `package.json` — Scripts, dependencies, `"type": "module"`, pnpm pin
- `tsconfig.json` — `rootDir: ./src`, `outDir: ./lib`, `module: CommonJS`
- `action.yml` — Action inputs and branding

**Core Logic:**
- Not yet present — Expected under `src/` after implementation

**Testing:**
- Not yet present — Jest configured in `package.json` but no `jest.config` or test files

**Documentation:**
- `README.md` — User-facing project description
- `action.yml` — Consumer-facing input documentation

## Naming Conventions

**Files (inferred from tooling setup):**
- `kebab-case` for config at repo root (`action.yml`, `tsconfig.json`)
- `main.ts` for action entry (referenced by bundle script: `lib/main.js`)
- `*.test.ts` likely for Jest tests (conventional, not yet established in code)

**Directories:**
- `src/` — Source
- `lib/` — Compile output
- `dist/` — Bundle output

**Special Patterns:**
- Action bundle always `dist/index.js` (ncc default output name from `lib/main.js`)

## Where to Add New Code

**Action orchestration:**
- Entry: `src/main.ts`
- Helpers: `src/` (flat or `src/lib/` as complexity grows)

**Review mode prompts/scripts:**
- Prompt templates: `src/modes/` or `src/prompts/` (suggested)
- Agent scripts (Section 4): dedicated directory e.g. `src/scripts/` or `scripts/`

**Tests:**
- Collocated: `src/**/*.test.ts`, or
- Separate: `__tests__/` or `tests/` at repo root
- Jest config: `jest.config.js` or `jest.config.ts` (not yet present)

**CI workflow:**
- `.github/workflows/` — Build, test, release (not yet present)

## Special Directories

**`node_modules/`:**
- Purpose: pnpm dependency tree
- Committed: No (`.gitignore` line 41)

**`dist/`:**
- Purpose: Shipped Action bundle
- Source: `ncc build lib/main.js -o dist`
- Committed: No — consumers need tagged releases with built artifact or build step in release workflow

**`lib/`:**
- Purpose: Intermediate tsc output
- Committed: No (standard practice; only `dist/` matters for Action)

---

*Structure analysis: 2026-07-05*
*Update when directory structure changes*
