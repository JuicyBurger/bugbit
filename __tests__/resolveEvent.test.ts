import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getOctokit } from '@actions/github';
import { EventResolutionError, resolveEvent } from '../src/runtime/resolveEvent';

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
}));

const mockGetOctokit = jest.mocked(getOctokit);

function writeEvent(dir: string, event: Record<string, unknown>): string {
  const eventPath = path.join(dir, 'event.json');
  fs.writeFileSync(eventPath, JSON.stringify(event));
  return eventPath;
}

function makePullRequestResponse(overrides: Record<string, unknown> = {}) {
  return {
    number: 42,
    head: {
      sha: 'abc123',
      ref: 'feature-branch',
      repo: { full_name: 'owner/repo' },
    },
    base: {
      sha: 'def456',
      ref: 'main',
      repo: { full_name: 'owner/repo' },
    },
    ...overrides,
  };
}

function makeOctokit(pullsGet: jest.Mock) {
  return {
    rest: {
      pulls: {
        get: pullsGet,
        createReview: jest.fn(),
        deletePendingReview: jest.fn(),
      },
    },
  };
}

describe('resolveEvent', () => {
  let tempDir: string;
  let runnerTemp: string;
  const originalRunnerTemp = process.env.RUNNER_TEMP;
  const originalEventName = process.env.GITHUB_EVENT_NAME;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-resolve-event-'));
    runnerTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-runner-temp-'));
    process.env.RUNNER_TEMP = runnerTemp;
    mockGetOctokit.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.rmSync(runnerTemp, { recursive: true, force: true });
    if (originalRunnerTemp === undefined) {
      delete process.env.RUNNER_TEMP;
    } else {
      process.env.RUNNER_TEMP = originalRunnerTemp;
    }
    if (originalEventName === undefined) {
      delete process.env.GITHUB_EVENT_NAME;
    } else {
      process.env.GITHUB_EVENT_NAME = originalEventName;
    }
  });

  it('returns original eventPath when pull_request is already present', async () => {
    const eventPath = writeEvent(tempDir, {
      pull_request: makePullRequestResponse(),
    });

    const resolvedPath = await resolveEvent({
      token: 'test-token',
      repository: 'owner/repo',
      eventPath,
    });

    expect(resolvedPath).toBe(eventPath);
    expect(mockGetOctokit).not.toHaveBeenCalled();
  });

  it('fetches PR and writes temp file for workflow_dispatch with valid pr-number', async () => {
    process.env.GITHUB_EVENT_NAME = 'workflow_dispatch';
    const eventPath = writeEvent(tempDir, {
      inputs: { pr_number: '42' },
    });
    const pullRequest = makePullRequestResponse();
    const pullsGet = jest.fn().mockResolvedValue({ data: pullRequest });
    mockGetOctokit.mockReturnValue(makeOctokit(pullsGet) as unknown as ReturnType<typeof getOctokit>);

    const resolvedPath = await resolveEvent({
      token: 'test-token',
      repository: 'owner/repo',
      eventPath,
      prNumber: '42',
    });

    expect(mockGetOctokit).toHaveBeenCalledWith('test-token');
    expect(pullsGet).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 42,
    });
    expect(resolvedPath).toBe(path.join(runnerTemp, 'bugbit-event-pr-42.json'));
    expect(fs.existsSync(resolvedPath)).toBe(true);
  });

  it('throws EventResolutionError when workflow_dispatch has no pr-number', async () => {
    process.env.GITHUB_EVENT_NAME = 'workflow_dispatch';
    const eventPath = writeEvent(tempDir, {
      inputs: {},
    });

    await expect(
      resolveEvent({
        token: 'test-token',
        repository: 'owner/repo',
        eventPath,
      }),
    ).rejects.toThrow(EventResolutionError);

    await expect(
      resolveEvent({
        token: 'test-token',
        repository: 'owner/repo',
        eventPath,
      }),
    ).rejects.toThrow(/pr-number/);

    await expect(
      resolveEvent({
        token: 'test-token',
        repository: 'owner/repo',
        eventPath,
      }),
    ).rejects.toThrow(/pull_request/);

    expect(mockGetOctokit).not.toHaveBeenCalled();
  });

  it('throws validation error for invalid pr-number before calling API', async () => {
    const eventPath = writeEvent(tempDir, { inputs: {} });

    await expect(
      resolveEvent({
        token: 'test-token',
        repository: 'owner/repo',
        eventPath,
        prNumber: 'not-a-number',
      }),
    ).rejects.toThrow(EventResolutionError);

    await expect(
      resolveEvent({
        token: 'test-token',
        repository: 'owner/repo',
        eventPath,
        prNumber: 'not-a-number',
      }),
    ).rejects.toThrow(/Invalid pr-number/);

    expect(mockGetOctokit).not.toHaveBeenCalled();
  });

  it('throws clear PR not found error when API returns 404', async () => {
    const eventPath = writeEvent(tempDir, { inputs: {} });
    const pullsGet = jest.fn().mockRejectedValue({ status: 404 });
    mockGetOctokit.mockReturnValue(makeOctokit(pullsGet) as unknown as ReturnType<typeof getOctokit>);

    await expect(
      resolveEvent({
        token: 'test-token',
        repository: 'owner/repo',
        eventPath,
        prNumber: '99',
      }),
    ).rejects.toThrow(EventResolutionError);

    await expect(
      resolveEvent({
        token: 'test-token',
        repository: 'owner/repo',
        eventPath,
        prNumber: '99',
      }),
    ).rejects.toThrow(/Pull request #99 not found in owner\/repo/);

    expect(pullsGet).toHaveBeenCalled();
  });

  it('writes temp file with pull_request fields matching API response', async () => {
    const eventPath = writeEvent(tempDir, {
      action: 'workflow_dispatch',
      inputs: { pr_number: '7' },
    });
    const pullRequest = makePullRequestResponse({
      number: 7,
      head: {
        sha: 'head-sha',
        ref: 'feature',
        repo: { full_name: 'fork-owner/repo' },
      },
      base: {
        sha: 'base-sha',
        ref: 'main',
        repo: { full_name: 'owner/repo' },
      },
    });
    const pullsGet = jest.fn().mockResolvedValue({ data: pullRequest });
    mockGetOctokit.mockReturnValue(makeOctokit(pullsGet) as unknown as ReturnType<typeof getOctokit>);

    const resolvedPath = await resolveEvent({
      token: 'test-token',
      repository: 'owner/repo',
      eventPath,
      prNumber: '7',
    });

    const merged = JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as {
      action: string;
      inputs: Record<string, string>;
      pull_request: {
        number: number;
        head: { repo: { full_name: string } };
        base: { repo: { full_name: string } };
      };
    };

    expect(merged.action).toBe('workflow_dispatch');
    expect(merged.inputs).toEqual({ pr_number: '7' });
    expect(merged.pull_request.number).toBe(7);
    expect(merged.pull_request.head.repo.full_name).toBe('fork-owner/repo');
    expect(merged.pull_request.base.repo.full_name).toBe('owner/repo');
  });
});
