#!/usr/bin/env node
import { getPrContext } from './lib/operations.mjs';
import { printJson, fail } from './lib/errors.mjs';

const deps = {
  token: process.env.GITHUB_TOKEN,
  eventPath: process.env.GITHUB_EVENT_PATH,
  repository: process.env.GITHUB_REPOSITORY,
};

try {
  printJson(await getPrContext(deps));
} catch (e) {
  fail('PR_CONTEXT_ERROR', e.message);
}
