#!/usr/bin/env node
import { requirePullRequest } from './lib/event.mjs';
import { printJson, fail } from './lib/errors.mjs';

try {
  const pr = requirePullRequest();
  printJson({
    number: pr.number,
    headRef: pr.head.ref,
    baseRef: pr.base.ref,
    headSha: pr.head.sha,
    baseSha: pr.base.sha,
  });
} catch (e) {
  fail('PR_CONTEXT_ERROR', e.message);
}
