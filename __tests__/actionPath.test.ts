import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('resolveActionPath', () => {
  const originalEnv = process.env.GITHUB_ACTION_PATH;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.GITHUB_ACTION_PATH;
    } else {
      process.env.GITHUB_ACTION_PATH = originalEnv;
    }
  });

  it('prefers GITHUB_ACTION_PATH when it contains prompts/system.md', async () => {
    const actionRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-action-'));
    fs.mkdirSync(path.join(actionRoot, 'prompts'), { recursive: true });
    fs.writeFileSync(path.join(actionRoot, 'prompts', 'system.md'), '# system');

    process.env.GITHUB_ACTION_PATH = actionRoot;
    const { resolveActionPath } = await import('../src/actionPath');

    expect(resolveActionPath('/tmp/workspace')).toBe(actionRoot);

    fs.rmSync(actionRoot, { recursive: true, force: true });
  });

  it('ignores GITHUB_ACTION_PATH when it points at the PR workspace', async () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-ws-'));
    process.env.GITHUB_ACTION_PATH = workspace;

    const { resolveActionPath } = await import('../src/actionPath');
    const resolved = resolveActionPath(workspace);

    expect(resolved).not.toBe(workspace);
    expect(fs.existsSync(path.join(resolved, 'prompts', 'system.md'))).toBe(true);

    fs.rmSync(workspace, { recursive: true, force: true });
  });
});
