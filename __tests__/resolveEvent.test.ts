import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { EventResolutionError, resolveEvent } from '../src/runtime/resolveEvent';

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

function mockFetchJson(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
): jest.Mock {
  const { ok = true, status = 200 } = init;
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

describe('resolveEvent', () => {
  let tempDir: string;
  let runnerTemp: string;
  const originalRunnerTemp = process.env.RUNNER_TEMP;
  const originalEventName = process.env.GITHUB_EVENT_NAME;
  const originalFetch = global.fetch;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-resolve-event-'));
    runnerTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-runner-temp-'));
    process.env.RUNNER_TEMP = runnerTemp;
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
    global.fetch = jest.fn();

    const resolvedPath = await resolveEvent({
      token: 'test-token',
      repository: 'owner/repo',
      eventPath,
    });

    expect(resolvedPath).toBe(eventPath);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches PR and writes temp file for workflow_dispatch with valid pr-number', async () => {
    process.env.GITHUB_EVENT_NAME = 'workflow_dispatch';
    const eventPath = writeEvent(tempDir, {
      inputs: { pr_number: '42' },
    });
    const pullRequest = makePullRequestResponse();
    global.fetch = mockFetchJson(pullRequest);

    const resolvedPath = await resolveEvent({
      token: 'test-token',
      repository: 'owner/repo',
      eventPath,
      prNumber: '42',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/pulls/42',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(resolvedPath).toBe(path.join(runnerTemp, 'bugbit-event-pr-42.json'));
    expect(fs.existsSync(resolvedPath)).toBe(true);
  });

  it('throws EventResolutionError when workflow_dispatch has no pr-number', async () => {
    process.env.GITHUB_EVENT_NAME = 'workflow_dispatch';
    const eventPath = writeEvent(tempDir, {
      inputs: {},
    });
    global.fetch = jest.fn();

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

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws validation error for invalid pr-number before calling API', async () => {
    const eventPath = writeEvent(tempDir, { inputs: {} });
    global.fetch = jest.fn();

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

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws clear PR not found error when API returns 404', async () => {
    const eventPath = writeEvent(tempDir, { inputs: {} });
    global.fetch = mockFetchJson(null, { ok: false, status: 404 });

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

    expect(global.fetch).toHaveBeenCalled();
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
    global.fetch = mockFetchJson(pullRequest);

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
