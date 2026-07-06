# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-07-06

### Added

- `pr-number` input for `workflow_dispatch` workflows that lack a native `pull_request` event payload

### Changed

- Improved error messages when pull request context is missing (actionable hints for `workflow_dispatch` vs other triggers)
- Event/PR validation now runs before the GitHub token permission preflight check, avoiding misleading permissions errors when the real issue is missing PR context

### Breaking

- None — this release is additive; existing `pull_request` workflows are unchanged
