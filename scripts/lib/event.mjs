import { readFileSync } from 'node:fs';
import { fail } from './errors.mjs';

export function loadEvent() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path) throw new Error('GITHUB_EVENT_PATH not set');
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function getPullRequestFromEvent() {
  const event = loadEvent();
  return event.pull_request ?? null;
}

export function requirePullRequest() {
  const pr = getPullRequestFromEvent();
  if (!pr) {
    fail('NOT_PR_EVENT', 'Workflow is not running on a pull_request event');
  }
  return pr;
}
