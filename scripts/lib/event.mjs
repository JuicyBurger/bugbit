import { readFileSync } from 'node:fs';

export function loadEvent(eventPath = process.env.GITHUB_EVENT_PATH) {
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH not set');
  return JSON.parse(readFileSync(eventPath, 'utf8'));
}

export function requirePullRequest(eventPath = process.env.GITHUB_EVENT_PATH) {
  const event = loadEvent(eventPath);
  const pr = event.pull_request ?? null;
  if (!pr) {
    throw new Error('Workflow is not running on a pull_request event');
  }
  return pr;
}

export function getPullRequestFromEvent() {
  const event = loadEvent();
  return event.pull_request ?? null;
}
