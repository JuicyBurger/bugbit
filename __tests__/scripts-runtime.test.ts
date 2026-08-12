import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..');

const mockPrEvent = {
  pull_request: {
    number: 1,
    title: 'Test PR',
    body: '## Summary\n- test',
    head: { ref: 'feature/test', sha: 'abc123' },
    base: { ref: 'main', sha: 'def456' },
  },
};

const importError = "does not provide an export named 'default'";

function runNodeScript(
  script: string,
  args: string[] = [],
  env: Record<string, string | undefined> = {},
): { stdout: string; stderr: string; status: number | null } {
  try {
    const stdout = execFileSync('node', [script, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });
    return { stdout, stderr: '', status: 0 };
  } catch (error) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number | null;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      status: execError.status ?? null,
    };
  }
}

describe('scripts runtime smoke', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bugbit-scripts-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('octokit.mjs dynamic import', () => {
    const stdout = execFileSync(
      'node',
      [
        '-e',
        "import('./scripts/lib/octokit.mjs').then((m) => console.log(JSON.stringify({ getClient: typeof m.getClient, getRepo: typeof m.getRepo })))",
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    expect(JSON.parse(stdout.trim())).toEqual({
      getClient: 'function',
      getRepo: 'function',
    });
  });

  it('event.mjs dynamic import', () => {
    const stdout = execFileSync(
      'node',
      [
        '-e',
        "import('./scripts/lib/event.mjs').then((m) => console.log(JSON.stringify({ assertPullRequestContext: typeof m.assertPullRequestContext, pullRequestContextErrorMessage: typeof m.pullRequestContextErrorMessage })))",
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    expect(JSON.parse(stdout.trim())).toEqual({
      assertPullRequestContext: 'function',
      pullRequestContextErrorMessage: 'function',
    });
  });

  it('post-review.mjs empty findings', () => {
    const findingsPath = join(tempDir, 'findings-empty.json');
    writeFileSync(findingsPath, JSON.stringify({ findings: [] }));

    const { stdout, status } = runNodeScript('scripts/post-review.mjs', [
      '--file',
      findingsPath,
    ]);

    expect(status).toBe(0);
    expect(stdout).toContain('"posted":[]');
    expect(stdout).toContain('"reviewId":null');
    expect(stdout).toContain('"cleanSummary":false');
    expect(stdout).not.toContain(importError);
  });

  it('get-diff.mjs passes import, fails at token', () => {
    const eventPath = join(tempDir, 'event.json');
    writeFileSync(eventPath, JSON.stringify(mockPrEvent));

    const { stdout, status } = runNodeScript('scripts/get-diff.mjs', [], {
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_TOKEN: undefined,
    });

    expect(status).toBe(1);
    expect(stdout).toContain('"code":"GET_DIFF_ERROR"');
    expect(stdout).not.toContain(importError);
  });

  it('pr-context.mjs returns title and body', () => {
    const eventPath = join(tempDir, 'event.json');
    writeFileSync(eventPath, JSON.stringify(mockPrEvent));

    const { stdout, status } = runNodeScript('scripts/pr-context.mjs', [], {
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_TOKEN: 'unused',
      GITHUB_REPOSITORY: 'owner/repo',
    });

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed).toMatchObject({
      number: 1,
      title: 'Test PR',
      body: '## Summary\n- test',
      headRef: 'feature/test',
      baseRef: 'main',
    });
  });

  it('post-inline-comment.mjs passes import, fails at args', () => {
    const { stdout, status } = runNodeScript('scripts/post-inline-comment.mjs');

    expect(status).toBe(1);
    expect(stdout).toContain('"code":"INVALID_ARGS"');
    expect(stdout).not.toContain(importError);
  });
});
