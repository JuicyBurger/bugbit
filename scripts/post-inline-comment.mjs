#!/usr/bin/env node
import { requirePullRequest } from './lib/event.mjs';
import { getClient, getRepo } from './lib/octokit.mjs';
import { fetchDiffLineMap, validateFinding } from './lib/validate.mjs';
import { printJson, fail } from './lib/errors.mjs';

/**
 * @param {string[]} argv
 * @returns {{ path: string, line: number, body: string }}
 */
function parseArgs(argv) {
  let path;
  let line;
  let body;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--path') {
      path = argv[++i];
    } else if (arg === '--line') {
      line = Number.parseInt(argv[++i], 10);
    } else if (arg === '--body') {
      body = argv[++i];
    }
  }

  if (!path) fail('INVALID_ARGS', 'Missing required --path');
  if (line == null || Number.isNaN(line)) fail('INVALID_ARGS', 'Missing or invalid --line');
  if (!body) fail('INVALID_ARGS', 'Missing required --body');

  return { path, line, body };
}

try {
  const { path, line, body } = parseArgs(process.argv.slice(2));
  const pr = requirePullRequest();
  const octokit = getClient();
  const { owner, repo } = getRepo();

  const lineMap = await fetchDiffLineMap(octokit, owner, repo, pr.number);
  const result = validateFinding(path, line, lineMap);

  if (!result.valid) {
    fail(result.code, result.message);
  }

  const { data } = await octokit.rest.pulls.createReviewComment({
    owner,
    repo,
    pull_number: pr.number,
    commit_id: pr.head.sha,
    path,
    line,
    side: 'RIGHT',
    body,
  });

  printJson({
    posted: [{ path, line, commentId: data.id }],
    reviewId: null,
  });
} catch (e) {
  if (e?.response?.data?.message) {
    fail('POST_INLINE_COMMENT_ERROR', e.response.data.message);
  }
  fail('POST_INLINE_COMMENT_ERROR', e.message);
}
