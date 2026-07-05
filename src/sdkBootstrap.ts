import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as core from '@actions/core';

const RG_CANDIDATES = ['/usr/bin/rg', '/usr/local/bin/rg'];

function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findRipgrepOnPath(): string | undefined {
  try {
    const result = execFileSync('which', ['rg'], { encoding: 'utf8' }).trim();
    if (result && isExecutable(result)) {
      return result;
    }
  } catch {
    // which exits non-zero when rg is not on PATH
  }
  return undefined;
}

/**
 * Seed CURSOR_RIPGREP_PATH for bundled GHA runs where @cursor/sdk-linux-x64
 * is not shipped alongside dist/index.js.
 */
export function bootstrapRipgrep(): void {
  const existing = process.env.CURSOR_RIPGREP_PATH;
  if (existing && path.isAbsolute(existing) && isExecutable(existing)) {
    return;
  }

  const found =
    findRipgrepOnPath() ?? RG_CANDIDATES.find((candidate) => isExecutable(candidate));

  if (found) {
    process.env.CURSOR_RIPGREP_PATH = found;
    core.debug(`Configured CURSOR_RIPGREP_PATH=${found}`);
    return;
  }

  core.warning(
    'ripgrep (rg) not found; Cursor SDK ignore-aware file search may be degraded. ' +
      'Install ripgrep on the runner or set CURSOR_RIPGREP_PATH.',
  );
}
