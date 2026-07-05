#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requirePullRequest } from './lib/event.mjs';
import { getClient, getRepo } from './lib/octokit.mjs';
import { fetchDiffLineMap, validateFinding } from './lib/validate.mjs';
import { printJson, fail } from './lib/errors.mjs';

/**
 * @param {string[]} argv
 * @returns {string}
 */
function parseFileArg(argv) {
  let file = resolve(process.cwd(), 'findings.json');

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file') {
      file = resolve(argv[++i]);
    }
  }

  return file;
}

/**
 * @param {unknown} finding
 * @param {number} index
 * @returns {{ valid: true, finding: { mode: string, path: string, line: number, body: string } } | { valid: false, error: { index: number, path?: string, line?: number, code: string, message: string } }}
 */
function validateFindingShape(finding, index) {
  if (!finding || typeof finding !== 'object') {
    return {
      valid: false,
      error: {
        index,
        code: 'INVALID_FINDING',
        message: 'Finding must be an object',
      },
    };
  }

  const { mode, path, line, body } = finding;
  const pathValue = typeof path === 'string' ? path : undefined;
  const lineValue = typeof line === 'number' ? line : undefined;

  if (!mode || !pathValue || lineValue == null || !body) {
    return {
      valid: false,
      error: {
        index,
        path: pathValue,
        line: lineValue,
        code: 'INVALID_FINDING',
        message: 'Finding must include mode, path, line, and body',
      },
    };
  }

  return {
    valid: true,
    finding: { mode, path: pathValue, line: lineValue, body },
  };
}

try {
  const filePath = parseFileArg(process.argv.slice(2));
  const raw = readFileSync(filePath, 'utf8');
  const payload = JSON.parse(raw);
  const findings = payload?.findings;

  if (!Array.isArray(findings) || findings.length === 0) {
    printJson({ posted: [], reviewId: null });
    process.exit(0);
  }

  const pr = requirePullRequest();
  const octokit = getClient();
  const { owner, repo } = getRepo();
  const lineMap = await fetchDiffLineMap(octokit, owner, repo, pr.number);

  /** @type {Array<{ mode: string, path: string, line: number, body: string }>} */
  const validFindings = [];
  /** @type {Array<{ index: number, path?: string, line?: number, code: string, message: string }>} */
  const errors = [];

  for (let i = 0; i < findings.length; i++) {
    const shapeResult = validateFindingShape(findings[i], i);
    if (!shapeResult.valid) {
      errors.push(shapeResult.error);
      continue;
    }

    const { path, line, body, mode } = shapeResult.finding;
    const diffResult = validateFinding(path, line, lineMap);

    if (!diffResult.valid) {
      errors.push({
        index: i,
        path,
        line,
        code: diffResult.code,
        message: diffResult.message,
      });
      continue;
    }

    validFindings.push({ mode, path, line, body });
  }

  if (validFindings.length === 0) {
    printJson({ posted: [], errors, reviewId: null });
    process.exit(0);
  }

  const { data } = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pr.number,
    commit_id: pr.head.sha,
    event: 'COMMENT',
    body: 'bugbit review findings',
    comments: validFindings.map((f) => ({
      path: f.path,
      line: f.line,
      side: 'RIGHT',
      body: f.body,
    })),
  });

  const responseComments = data.comments ?? [];
  const posted = validFindings.map((f, i) => ({
    path: f.path,
    line: f.line,
    commentId: responseComments[i]?.id ?? null,
  }));

  printJson({ posted, errors, reviewId: data.id });
} catch (e) {
  const message = e?.response?.data?.message ?? e.message;
  fail('POST_REVIEW_ERROR', message);
}
