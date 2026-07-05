# Phase 3 E2E Checklist — Security & Wiring

Manual validation for live PR runs with Cursor agent and custom tools. Run after unit tests pass (`pnpm test`).

## Prerequisites

- [ ] Same-repo PR with `actions/checkout` and bugbit secrets configured (`cursor-api-key`, `github-token`)
- [ ] Workflow uses `pull_request` trigger on a branch in the same repository (not a fork)

## Checklist

1. **Workflow bootstrap**
   - [ ] Action starts on same-repo PR with checkout + bugbit secrets
   - [ ] No fork preflight failure in logs

2. **get_pr_context tool**
   - [ ] Agent calls `get_pr_context`
   - [ ] Stream logs show valid JSON with PR number, head/base refs, and SHAs

3. **get_diff tool**
   - [ ] Agent calls `get_diff`
   - [ ] Stream logs show changed files and parsed hunks for the PR

4. **post_review tool**
   - [ ] Agent calls `post_review` with a findings array
   - [ ] Inline review comments appear on the PR

5. **Shell constraint**
   - [ ] Stream logs show no `node scripts/` shell invocations for PR operations
   - [ ] PR ops use custom tools only

6. **Secret masking**
   - [ ] `cursor-api-key` and `github-token` values are not visible in workflow logs

7. **Fork PR negative test (optional)**
   - [ ] Fork PR workflow fails at bootstrap with fork message referencing DOCS-04
   - [ ] Agent does not start on fork PRs

## Notes

- Automated E2E with live Cursor API is intentionally out of scope for CI (flaky/expensive).
- Consumer workflow trigger design (`opened` vs `synchronize`) is consumer-owned per D-11.
