import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { isForkPullRequest } from '../src/bugbitTools';

function writeEvent(
  dir: string,
  event: Record<string, unknown>,
): string {
  const eventPath = path.join(dir, 'event.json');
  fs.writeFileSync(eventPath, JSON.stringify(event));
  return eventPath;
}

describe('isForkPullRequest', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-fork-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns false for same-repo PR', () => {
    const eventPath = writeEvent(tempDir, {
      pull_request: {
        head: { repo: { full_name: 'owner/repo' } },
        base: { repo: { full_name: 'owner/repo' } },
      },
    });

    expect(isForkPullRequest(eventPath)).toBe(false);
  });

  it('returns true for fork PR with different head repo', () => {
    const eventPath = writeEvent(tempDir, {
      pull_request: {
        head: { repo: { full_name: 'contributor/repo' } },
        base: { repo: { full_name: 'owner/repo' } },
      },
    });

    expect(isForkPullRequest(eventPath)).toBe(true);
  });

  it('returns false when eventPath is empty', () => {
    expect(isForkPullRequest('')).toBe(false);
  });

  it('returns false for non-PR events', () => {
    const eventPath = writeEvent(tempDir, { action: 'push' });
    expect(isForkPullRequest(eventPath)).toBe(false);
  });
});
