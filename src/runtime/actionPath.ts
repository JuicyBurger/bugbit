import * as fs from 'fs';
import * as path from 'path';

function hasActionRoot(candidate: string): boolean {
  return fs.existsSync(path.join(candidate, 'prompts', 'system.md'));
}

function findActionRootFromModule(): string | undefined {
  let current = __dirname;
  for (let depth = 0; depth < 4; depth++) {
    if (hasActionRoot(current)) {
      return current;
    }
    current = path.resolve(current, '..');
  }
  return undefined;
}

/**
 * Resolve the bugbit action install root (contains prompts/, scripts/, .cursor/).
 *
 * GITHUB_ACTION_PATH is usually correct for JS actions, but when it equals the
 * PR workspace (consumer repo) we fall back to walking up from __dirname.
 */
export function resolveActionPath(cwd: string): string {
  const envPath = process.env.GITHUB_ACTION_PATH;
  if (envPath) {
    const resolved = path.resolve(envPath);
    if (hasActionRoot(resolved)) {
      return resolved;
    }
  }

  const fromModule = findActionRootFromModule();
  if (fromModule) {
    return fromModule;
  }

  return envPath ?? cwd;
}
