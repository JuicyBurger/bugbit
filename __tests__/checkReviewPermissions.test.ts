import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createRequire } from 'module';

const repoRoot = path.join(__dirname, '..');
const requireFromRepo = createRequire(path.join(repoRoot, 'package.json'));

const mockAssertReviewPermissions = jest.fn().mockResolvedValue(undefined);
const mockFormatPermissionErrorMessage = jest.fn((error: unknown) =>
  error instanceof Error ? error.message : String(error),
);

jest.mock('../src/runtime/dynamicImport', () => ({
  dynamicImport: jest.fn(async (specifier: string) => {
    if (specifier.includes('preflight')) {
      return {
        assertReviewPermissions: mockAssertReviewPermissions,
        formatPermissionErrorMessage: mockFormatPermissionErrorMessage,
      };
    }
    if (specifier.includes('event.mjs')) {
      return requireFromRepo('./scripts/lib/event.mjs');
    }
    throw new Error(`Unexpected dynamic import in test: ${specifier}`);
  }),
}));

function writeEvent(dir: string, event: Record<string, unknown>): string {
  const eventPath = path.join(dir, 'event.json');
  fs.writeFileSync(eventPath, JSON.stringify(event));
  return eventPath;
}

describe('checkReviewPermissions', () => {
  let tempDir: string;
  let infoSpy: jest.SpyInstance;
  let checkReviewPermissions: typeof import('../src/github/tools').checkReviewPermissions;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAssertReviewPermissions.mockResolvedValue(undefined);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-check-perms-'));
    jest.resetModules();
    const coreMod = await import('@actions/core');
    infoSpy = jest.spyOn(coreMod, 'info').mockImplementation(() => {});
    ({ checkReviewPermissions } = await import('../src/github/tools'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    infoSpy.mockRestore();
    delete process.env.GITHUB_EVENT_NAME;
  });

  const baseDeps = (eventPath: string) => ({
    githubToken: 'test-token',
    eventPath,
    repository: 'owner/repo',
    actionPath: repoRoot,
  });

  function permissionCheckLogs(): unknown[][] {
    return infoSpy.mock.calls.filter(([msg]) =>
      String(msg).includes('Checking GitHub token permissions'),
    );
  }

  it('throws before logging permissions check when event is invalid', async () => {
    const eventPath = writeEvent(tempDir, { action: 'push' });

    await expect(checkReviewPermissions(baseDeps(eventPath))).rejects.toThrow(
      'pull request context',
    );

    expect(permissionCheckLogs()).toHaveLength(0);
    expect(mockAssertReviewPermissions).not.toHaveBeenCalled();
  });

  it('logs permissions check then OK when event is valid', async () => {
    const eventPath = writeEvent(tempDir, {
      pull_request: {
        number: 42,
        head: { repo: { full_name: 'owner/repo' } },
        base: { repo: { full_name: 'owner/repo' } },
      },
    });

    await expect(checkReviewPermissions(baseDeps(eventPath))).resolves.toBeUndefined();

    expect(permissionCheckLogs()).toHaveLength(1);
    expect(infoSpy).toHaveBeenCalledWith('GitHub token permissions OK');
    expect(mockAssertReviewPermissions).toHaveBeenCalled();
  });

  it('workflow_dispatch without pr-number error has no permissions hint block', async () => {
    process.env.GITHUB_EVENT_NAME = 'workflow_dispatch';
    const eventPath = writeEvent(tempDir, {
      action: 'workflow_dispatch',
      inputs: {},
    });

    let caught: unknown;
    try {
      await checkReviewPermissions(baseDeps(eventPath));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    const message = (caught as Error).message;
    expect(message).toContain('Pass `pr-number` when triggering via `workflow_dispatch`');
    expect(message).not.toContain('pull-requests: write');
    expect(message).not.toContain('Required workflow permissions');

    expect(permissionCheckLogs()).toHaveLength(0);
    expect(mockAssertReviewPermissions).not.toHaveBeenCalled();
  });
});
