#!/usr/bin/env node
import { postInlineComment } from './lib/operations.mjs';
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

const deps = {
  token: process.env.GITHUB_TOKEN,
  eventPath: process.env.GITHUB_EVENT_PATH,
  repository: process.env.GITHUB_REPOSITORY,
};

try {
  const { path, line, body } = parseArgs(process.argv.slice(2));
  const result = await postInlineComment(deps, { path, line, body });

  if (result.error) {
    fail(result.error.code, result.error.message);
  }

  printJson(result);
} catch (e) {
  if (e?.response?.data?.message) {
    fail('POST_INLINE_COMMENT_ERROR', e.response.data.message);
  }
  fail('POST_INLINE_COMMENT_ERROR', e.message);
}
