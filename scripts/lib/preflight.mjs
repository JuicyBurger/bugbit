import { requirePullRequest } from './event.mjs';

/**
 * @param {string} repository
 */
function parseRepo(repository) {
  if (!repository) throw new Error('GITHUB_REPOSITORY not set');
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error(`Invalid repository: ${repository}`);
  return { owner, repo };
}

export const PermissionError = class extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = 'PermissionError';
    this.code = code;
  }
};

const WORKFLOW_PERMISSIONS_HINT = `Required workflow permissions:
permissions:
  contents: read
  pull-requests: write`;

/**
 * @param {unknown} error
 * @returns {string}
 */
export function formatPermissionErrorMessage(error) {
  if (error instanceof PermissionError) {
    return `${error.message}\n\n${WORKFLOW_PERMISSIONS_HINT}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {unknown} error
 * @returns {number | undefined}
 */
function getStatus(error) {
  if (error && typeof error === 'object') {
    const status = /** @type {{ status?: number; response?: { status?: number } }} */ (error).status;
    if (typeof status === 'number') {
      return status;
    }
    const responseStatus = /** @type {{ response?: { status?: number } }} */ (error).response?.status;
    if (typeof responseStatus === 'number') {
      return responseStatus;
    }
  }
  return undefined;
}

/**
 * @param {number | undefined} status
 * @param {'read' | 'write'} phase
 * @returns {PermissionError | undefined}
 */
function mapHttpError(status, phase) {
  if (status === 401) {
    return new PermissionError(
      'TOKEN_REJECTED',
      'GitHub token was rejected by the API. Check that github-token is valid.',
    );
  }
  if (status === 404) {
    return new PermissionError(
      'PR_NOT_FOUND',
      'Pull request or repository not found, or token cannot access this repo.',
    );
  }
  if (status === 403) {
    if (phase === 'read') {
      return new PermissionError(
        'PR_READ_DENIED',
        'Token cannot read this pull request. Ensure workflow permissions include contents: read and pull-requests: read or write.',
      );
    }
    return new PermissionError(
      'PR_WRITE_DENIED',
      'Token cannot post pull request reviews. Ensure workflow permissions include pull-requests: write.',
    );
  }
  return undefined;
}

/**
 * @typedef {{ token: string, eventPath: string, repository: string }} PreflightDeps
 */

/**
 * @param {PreflightDeps} deps
 * @param {import('@octokit/rest').Octokit} [octokit]
 */
export async function assertReviewPermissions(deps, octokit = undefined) {
  const client =
    octokit ?? (await import('./octokit.mjs')).createClient(deps.token);
  const pr = requirePullRequest(deps.eventPath);
  const { owner, repo } = parseRepo(deps.repository);

  try {
    await client.rest.pulls.get({
      owner,
      repo,
      pull_number: pr.number,
    });
  } catch (error) {
    const mapped = mapHttpError(getStatus(error), 'read');
    if (mapped) {
      throw mapped;
    }
    throw error;
  }

  try {
    const { data: pending } = await client.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      body: '',
    });
    await client.rest.pulls.deletePendingReview({
      owner,
      repo,
      pull_number: pr.number,
      review_id: pending.id,
    });
  } catch (error) {
    const mapped = mapHttpError(getStatus(error), 'write');
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}
