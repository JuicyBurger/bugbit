# Codebase Concerns

**Analysis Date:** 2026-07-05

## Tech Debt

**No application source yet:**
- Issue: `src/` directory and `src/main.ts` do not exist; action cannot run
- Files: `action.yml` references `dist/index.js`; `package.json` bundle targets `lib/main.js`
- Why: Early scaffolding phase — config and metadata wired first
- Impact: Action is not functional until implementation lands
- Fix approach: Implement `src/main.ts` and supporting modules; run `pnpm run bundle`

**ESM package type vs CommonJS compile:**
- Issue: `package.json` has `"type": "module"` while `tsconfig.json` emits CommonJS
- Files: `package.json`, `tsconfig.json`
- Why: pnpm init default vs Actions runtime requirement
- Impact: Potential confusion for local tooling, import semantics in non-compiled files
- Fix approach: Either remove `"type": "module"` or document that only `tsc` output matters for the action; align Jest config accordingly

**Missing Jest configuration:**
- Issue: `jest` and `ts-jest` installed but no config file
- Files: `package.json` (script `test: jest`)
- Impact: `pnpm test` non-functional until configured
- Fix approach: Add `jest.config.ts` with ts-jest preset targeting `src/`

## Known Bugs

(None — no runnable code yet)

## Security Considerations

**API key handling:**
- Risk: `cursor-api-key` logged or echoed in workflow output
- Files: Future `src/main.ts` orchestration
- Current mitigation: Secret input in consumer workflows; not yet enforced in code
- Recommendations: Use `core.setSecret()` on key; never `console.log` inputs; validate key present before SDK call

**GitHub token forwarding:**
- Risk: Over-scoped token passed to agent scripts
- Files: `action.yml` (`github-token` input)
- Current mitigation: Default `${{ github.token }}` with workflow permissions model
- Recommendations: Document minimum permissions (`pull-requests: write`, `contents: read`); warn consumers about PAT scope

**Bundled dependencies:**
- Risk: `ncc` bundle includes all deps — supply chain surface in `dist/index.js`
- Files: `package.json` `bundle` script
- Recommendations: Pin dependency versions; audit before releases

## Performance Bottlenecks

**Cursor agent latency (anticipated):**
- Problem: PR review via full agent session may exceed default Action timeouts
- Measurement: Not yet benchmarked
- Cause: LLM agent runtime + large diffs
- Improvement path: Document timeout recommendations; support diff size limits; parallel mode execution if safe

## Fragile Areas

**Build pipeline coupling:**
- Files: `package.json` (`bundle`: `ncc build lib/main.js -o dist`), `action.yml` (`main: dist/index.js`)
- Why fragile: Entry path must stay in sync across three files
- Common failures: Rename `main.ts` without updating bundle script; forget to build before tag
- Safe modification: Add release script; CI verifies `dist/` matches source on tag
- Test coverage: None

**Review modes input parsing:**
- Files: `action.yml` (`review-modes` comma-separated)
- Why fragile: Typos in mode names fail silently or at runtime
- Safe modification: Validate against allowlist early with clear `setFailed` message

## Scaling Limits

**GitHub Actions:**
- Workflow job timeout (default 6h, org-dependent)
- Large PR diffs may exceed agent context windows
- Scaling path: Document max PR size guidance; chunk reviews if needed (future)

## Dependencies at Risk

**@vercel/ncc 0.44.x:**
- Risk: Bundler maintenance mode concerns; must support Node 20 + dependency tree
- Impact: Cannot produce `dist/index.js` for Action distribution
- Migration plan: Evaluate `esbuild` bundle or GitHub's recommended ncc patterns

**@cursor/sdk 1.x:**
- Risk: Early SDK; API may change
- Impact: Core functionality breaks on SDK updates
- Migration plan: Pin version; abstract SDK behind thin adapter in `src/`

## Missing Critical Features

**Core action implementation:**
- Problem: No TypeScript source, no bundle, no tests
- Blocks: Any production use of bugbit
- Implementation complexity: Medium — orchestration + mode prompts + SDK integration

**CI/CD workflow:**
- Problem: No `.github/workflows/` for build/test/release
- Blocks: Automated quality gates on PRs to bugbit itself
- Implementation complexity: Low

**Jest setup:**
- Problem: Test runner not configured
- Blocks: Regression safety during development
- Implementation complexity: Low

## Test Coverage Gaps

**Entire codebase:**
- What's not tested: Everything (no `src/` yet)
- Risk: First implementation ships without safety net
- Priority: High — add config + tests alongside `src/main.ts`
- Difficulty to test: Low for pure functions; medium for SDK/GitHub mocks

---

*Concerns audit: 2026-07-05*
*Update as issues are fixed or new ones discovered*
