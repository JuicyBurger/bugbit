import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function writeEvent(dir: string, event: Record<string, unknown>): string {
  const eventPath = path.join(dir, 'event.json');
  fs.writeFileSync(eventPath, JSON.stringify(event));
  return eventPath;
}

function makeOctokit(overrides: {
  get?: jest.Mock;
  createReview?: jest.Mock;
  deletePendingReview?: jest.Mock;
}) {
  return {
    rest: {
      pulls: {
        get: overrides.get ?? jest.fn().mockResolvedValue({}),
        createReview:
          overrides.createReview ?? jest.fn().mockResolvedValue({ data: { id: 99 } }),
        deletePendingReview:
          overrides.deletePendingReview ?? jest.fn().mockResolvedValue({}),
      },
    },
  };
}

describe('assertReviewPermissions', () => {
  let tempDir: string;
  let preflight: {
    assertReviewPermissions: (
      deps: { token: string; eventPath: string; repository: string },
      octokit?: unknown,
    ) => Promise<void>;
    PermissionError: new (code: string, message: string) => Error & { code: string };
    formatPermissionErrorMessage: (error: unknown) => string;
  };

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    preflight = require('../scripts/lib/preflight.mjs');
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-github-preflight-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const baseDeps = () => ({
    token: 'test-token',
    eventPath: writeEvent(tempDir, {
      pull_request: {
        number: 42,
        head: { repo: { full_name: 'owner/repo' } },
        base: { repo: { full_name: 'owner/repo' } },
      },
    }),
    repository: 'owner/repo',
  });

  it('succeeds when read and write probes pass', async () => {
    const octokit = makeOctokit({});
    await expect(
      preflight.assertReviewPermissions(baseDeps(), octokit),
    ).resolves.toBeUndefined();
    expect(octokit.rest.pulls.get).toHaveBeenCalled();
    expect(octokit.rest.pulls.createReview).toHaveBeenCalled();
    expect(octokit.rest.pulls.deletePendingReview).toHaveBeenCalled();
  });

  it('throws PR_READ_DENIED when pulls.get returns 403', async () => {
    const octokit = makeOctokit({
      get: jest.fn().mockRejectedValue({ status: 403 }),
    });

    await expect(preflight.assertReviewPermissions(baseDeps(), octokit)).rejects.toMatchObject({
      code: 'PR_READ_DENIED',
    });
  });

  it('throws PR_WRITE_DENIED when createReview returns 403', async () => {
    const octokit = makeOctokit({
      createReview: jest.fn().mockRejectedValue({ status: 403 }),
    });

    await expect(preflight.assertReviewPermissions(baseDeps(), octokit)).rejects.toMatchObject({
      code: 'PR_WRITE_DENIED',
    });
  });

  it('throws TOKEN_REJECTED when API returns 401', async () => {
    const octokit = makeOctokit({
      get: jest.fn().mockRejectedValue({ status: 401 }),
    });

    await expect(preflight.assertReviewPermissions(baseDeps(), octokit)).rejects.toMatchObject({
      code: 'TOKEN_REJECTED',
    });
  });

  it('throws actionable error when event lacks pull_request context', async () => {
    const deps = {
      ...baseDeps(),
      eventPath: writeEvent(tempDir, { action: 'push' }),
    };
    const octokit = makeOctokit({});

    await expect(preflight.assertReviewPermissions(deps, octokit)).rejects.toThrow(
      'bugbit requires pull request context',
    );
    await expect(preflight.assertReviewPermissions(deps, octokit)).rejects.toThrow(
      'on: pull_request',
    );
    expect(octokit.rest.pulls.get).not.toHaveBeenCalled();
  });

  it('throws workflow_dispatch-specific error when GITHUB_EVENT_NAME is workflow_dispatch', async () => {
    const previousEventName = process.env.GITHUB_EVENT_NAME;
    process.env.GITHUB_EVENT_NAME = 'workflow_dispatch';

    try {
      const deps = {
        ...baseDeps(),
        eventPath: writeEvent(tempDir, { inputs: { pr_number: '42' } }),
      };
      const octokit = makeOctokit({});

      await expect(preflight.assertReviewPermissions(deps, octokit)).rejects.toThrow(
        'Pass `pr-number` when triggering via `workflow_dispatch`',
      );
      expect(octokit.rest.pulls.get).not.toHaveBeenCalled();
    } finally {
      if (previousEventName === undefined) {
        delete process.env.GITHUB_EVENT_NAME;
      } else {
        process.env.GITHUB_EVENT_NAME = previousEventName;
      }
    }
  });

  it('probes the PR number from a resolved temp event path', async () => {
    const eventPath = writeEvent(tempDir, {
      inputs: { pr_number: '99' },
      pull_request: {
        number: 99,
        head: { repo: { full_name: 'owner/repo' }, ref: 'feature', sha: 'abc123' },
        base: { repo: { full_name: 'owner/repo' }, ref: 'main' },
      },
    });
    const octokit = makeOctokit({
      get: jest.fn().mockResolvedValue({ data: { number: 99 } }),
    });

    await expect(
      preflight.assertReviewPermissions(
        { token: 'test-token', eventPath, repository: 'owner/repo' },
        octokit,
      ),
    ).resolves.toBeUndefined();

    expect(octokit.rest.pulls.get).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'owner',
        repo: 'repo',
        pull_number: 99,
      }),
    );
  });
});

describe('formatPermissionErrorMessage', () => {
  let preflight: {
    PermissionError: new (code: string, message: string) => Error & { code: string };
    formatPermissionErrorMessage: (error: unknown) => string;
  };

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    preflight = require('../scripts/lib/preflight.mjs');
  });

  it('includes workflow permissions hint for PermissionError', () => {
    const message = preflight.formatPermissionErrorMessage(
      new preflight.PermissionError('PR_WRITE_DENIED', 'Token cannot post pull request reviews.'),
    );

    expect(message).toContain('pull-requests: write');
    expect(message).toContain('contents: read');
  });
});
