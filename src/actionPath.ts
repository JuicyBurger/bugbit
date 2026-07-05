import * as fs from 'fs';
import * as path from 'path';

function hasActionRoot(candidate: string): boolean {
  return fs.existsSync(path.join(candidate, 'prompts', 'system.md'));
}

/**
 * Resolve the bugbit action install root (contains prompts/, scripts/, .cursor/).
 *
 * GITHUB_ACTION_PATH is usually correct for JS actions, but when it equals the
 * PR workspace (consumer repo) we fall back to __dirname (bundled dist/index.js).
 */
export function resolveActionPath(cwd: string): string {
  const envPath = process.env.GITHUB_ACTION_PATH;
  if (envPath) {
    const resolved = path.resolve(envPath);
    if (hasActionRoot(resolved)) {
      return resolved;
    }
  }

  const fromDist = path.resolve(path.join(__dirname, '..'));
  if (hasActionRoot(fromDist)) {
    return fromDist;
  }

  const fromRepo = path.resolve(fromDist, '..');
  if (hasActionRoot(fromRepo)) {
    return fromRepo;
  }

  return envPath ?? cwd;
}
