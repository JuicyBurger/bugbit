import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class EventResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventResolutionError';
  }
}

export interface ResolveEventParams {
  token: string;
  repository: string;
  eventPath: string;
  prNumber?: string;
}

function getHttpStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const status = (error as { status?: number }).status;
    if (typeof status === 'number') {
      return status;
    }
    const responseStatus = (error as { response?: { status?: number } }).response?.status;
    if (typeof responseStatus === 'number') {
      return responseStatus;
    }
  }
  return undefined;
}

function missingPullRequestMessage(): string {
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

function parseRepository(repository: string): { owner: string; repo: string } {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new EventResolutionError(`Invalid repository: ${repository}`);
  }
  return { owner, repo };
}

function parsePrNumber(prNumber: string): number {
  const trimmed = prNumber.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new EventResolutionError(
      `Invalid pr-number: "${prNumber}". Must be a positive integer.`,
    );
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new EventResolutionError(
      `Invalid pr-number: "${prNumber}". Must be a positive integer.`,
    );
  }
  return parsed;
}

/**
 * Resolves GITHUB_EVENT_PATH to a file containing pull_request context.
 * Returns the original path when pull_request is already present; otherwise
 * fetches the PR via API when pr-number is provided.
 */
export async function resolveEvent(params: ResolveEventParams): Promise<string> {
  const { token, repository, eventPath, prNumber } = params;

  if (!eventPath) {
    throw new EventResolutionError('GITHUB_EVENT_PATH not set');
  }

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8')) as {
    pull_request?: unknown;
  };

  if (event.pull_request) {
    return eventPath;
  }

  if (!prNumber?.trim()) {
    throw new EventResolutionError(missingPullRequestMessage());
  }

  const pullNumber = parsePrNumber(prNumber);
  const { owner, repo } = parseRepository(repository);

  let pull_request: unknown;
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 404) {
        throw new EventResolutionError(
          `Pull request #${pullNumber} not found in ${repository}. Check pr-number and repository.`,
        );
      }
      if (status === 401) {
        throw new EventResolutionError(
          `Cannot fetch pull request #${pullNumber}: GitHub token was rejected by the API.`,
        );
      }
      if (status === 403) {
        throw new EventResolutionError(
          `Cannot fetch pull request #${pullNumber}: token lacks permission to read this pull request.`,
        );
      }
      throw new EventResolutionError(
        `Cannot fetch pull request #${pullNumber}: GitHub API returned ${status}.`,
      );
    }

    pull_request = await response.json();
  } catch (error) {
    if (error instanceof EventResolutionError) {
      throw error;
    }
    const status = getHttpStatus(error);
    if (status === 404) {
      throw new EventResolutionError(
        `Pull request #${pullNumber} not found in ${repository}. Check pr-number and repository.`,
      );
    }
    if (status === 401) {
      throw new EventResolutionError(
        `Cannot fetch pull request #${pullNumber}: GitHub token was rejected by the API.`,
      );
    }
    if (status === 403) {
      throw new EventResolutionError(
        `Cannot fetch pull request #${pullNumber}: token lacks permission to read this pull request.`,
      );
    }
    throw error;
  }

  const mergedEvent = { ...event, pull_request };
  const runnerTemp = process.env.RUNNER_TEMP ?? os.tmpdir();
  const resolvedPath = path.join(runnerTemp, `bugbit-event-pr-${pullNumber}.json`);
  fs.writeFileSync(resolvedPath, JSON.stringify(mergedEvent));
  return resolvedPath;
}
