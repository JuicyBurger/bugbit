#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { postReview } from './lib/operations.mjs';
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

const deps = {
  token: process.env.GITHUB_TOKEN,
  eventPath: process.env.GITHUB_EVENT_PATH,
  repository: process.env.GITHUB_REPOSITORY,
};

try {
  const filePath = parseFileArg(process.argv.slice(2));
  const raw = readFileSync(filePath, 'utf8');
  const payload = JSON.parse(raw);
  const findings = payload?.findings;

  printJson(await postReview(deps, findings));
} catch (e) {
  const message = e?.response?.data?.message ?? e.message;
  fail('POST_REVIEW_ERROR', message);
}
