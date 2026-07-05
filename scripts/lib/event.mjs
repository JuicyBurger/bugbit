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

export function requirePullRequest(eventPath = process.env.GITHUB_EVENT_PATH) {
  const event = loadEvent(eventPath);
  const pr = event.pull_request ?? null;
  if (!pr) {
    throw new Error('Workflow is not running on a pull_request event');
  }
  return pr;
}

