import { readFileSync } from 'node:fs';

let cachedEventPath;
/** @type {unknown} */
let cachedEvent;

export function loadEvent(eventPath = process.env.GITHUB_EVENT_PATH) {
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH not set');
  if (cachedEventPath === eventPath && cachedEvent !== undefined) {
    return cachedEvent;
  }
  cachedEvent = JSON.parse(readFileSync(eventPath, 'utf8'));
  cachedEventPath = eventPath;
  return cachedEvent;
}

/**
 * @returns {string}
 */
export function pullRequestContextErrorMessage() {
  const eventName = process.env.GITHUB_EVENT_NAME ?? '';
  if (eventName === 'workflow_dispatch') {
    return (
      'bugbit requires pull request context. Pass `pr-number` when triggering via `workflow_dispatch`, ' +
      'or use `on: pull_request`. See README: Supported workflow triggers.'
    );
  }
  return (
    'bugbit requires pull request context. Use `on: pull_request`, or pass `pr-number` when triggering via `workflow_dispatch`. ' +
    'See README: Supported workflow triggers.'
  );
}

/**
 * @param {string} [eventPath]
 */
export function assertPullRequestContext(eventPath = process.env.GITHUB_EVENT_PATH) {
  const event = loadEvent(eventPath);
  const pr = event.pull_request ?? null;
  if (!pr) {
    throw new Error(pullRequestContextErrorMessage());
  }
  return pr;
}

export function requirePullRequest(eventPath = process.env.GITHUB_EVENT_PATH) {
  return assertPullRequestContext(eventPath);
}

