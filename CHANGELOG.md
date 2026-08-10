# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-08-10

### Fixed

- Paginate `pulls.listFiles` when prefetching the PR diff and building the comment line map. GitHub returns 30 files per page by default; PRs with more than 30 changed files were silently truncated, so reviews missed later files and findings on those paths failed line-map validation.

## [1.2.0] - 2026-08-05

### Added

- `post-clean-summary` input (default `true`): when the agent calls `post_review` with an empty findings array, bugbit posts a visible COMMENT review (LGTM / no findings) instead of staying silent.
- `clean-summary-body` input to customize that clean-summary review body.

### Changed

- Empty `post_review` calls now return `{ posted: [], reviewId, cleanSummary }` so callers can tell whether an LGTM review was created.

## [1.1.1] - 2026-07-06

### Fixed

- `action.yml` no longer embeds `${{ inputs.pr_number }}` in the `pr-number` input description. That expression is only valid in workflow files, not action metadata, and caused `Failed to load action.yml` on all runs using `@v1`.
- `resolveEvent` fetches pull requests via the GitHub REST API with `fetch` instead of `@actions/github`, so the main action bundle no longer contains an unresolved `@actions/github` import that broke `workflow_dispatch` at runtime.

## [1.1.0] - 2026-07-06

### Added

- `pr-number` input for `workflow_dispatch` workflows that lack a native `pull_request` event payload

### Changed

- Improved error messages when pull request context is missing (actionable hints for `workflow_dispatch` vs other triggers)
- Event/PR validation now runs before the GitHub token permission preflight check, avoiding misleading permissions errors when the real issue is missing PR context

### Breaking

- None — this release is additive; existing `pull_request` workflows are unchanged
