import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as core from '@actions/core';

const LINUX_RG_CANDIDATES = ['/usr/bin/rg', '/usr/local/bin/rg'];
const DARWIN_RG_CANDIDATES = ['/opt/homebrew/bin/rg', '/usr/local/bin/rg'];
const WIN32_RG_CANDIDATES = [
  'C:\\Program Files\\ripgrep\\rg.exe',
  'C:\\Program Files (x86)\\ripgrep\\rg.exe',
];

const VENDORED_PLATFORM = 'linux-x64';

export function getPlatformKey(): string {
  return `${process.platform}-${process.arch}`;
}

export function getRgBinaryName(): string {
  return process.platform === 'win32' ? 'rg.exe' : 'rg';
}

export function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function systemRipgrepCandidates(): string[] {
  switch (process.platform) {
    case 'darwin':
      return DARWIN_RG_CANDIDATES;
    case 'win32':
      return WIN32_RG_CANDIDATES;
    default:
      return LINUX_RG_CANDIDATES;
  }
}

export function findRipgrepOnPath(): string | undefined {
  const binaryName = getRgBinaryName();

  if (process.platform === 'win32') {
    try {
      const result = execFileSync('where', [binaryName], { encoding: 'utf8' }).trim();
      const first = result.split(/\r?\n/).find((line) => line.trim().length > 0);
      if (first && isExecutable(first.trim())) {
        return first.trim();
      }
    } catch {
      // where exits non-zero when rg is not on PATH
    }
    return undefined;
  }

  try {
    const result = execFileSync('which', [binaryName], { encoding: 'utf8' }).trim();
    if (result && isExecutable(result)) {
      return result;
    }
  } catch {
    // which exits non-zero when rg is not on PATH
  }

  return undefined;
}

export function findVendoredRipgrep(bundleDir: string): string | undefined {
  if (getPlatformKey() !== VENDORED_PLATFORM) {
    return undefined;
  }

  const vendoredPath = path.join(bundleDir, 'vendor', VENDORED_PLATFORM, getRgBinaryName());
  if (isExecutable(vendoredPath)) {
    return vendoredPath;
  }

  return undefined;
}

function configureRipgrepPath(found: string): void {
  const absolutePath = path.resolve(found);
  process.env.CURSOR_RIPGREP_PATH = absolutePath;
  core.info(`Configured CURSOR_RIPGREP_PATH=${absolutePath}`);
}

/**
 * Seed CURSOR_RIPGREP_PATH for bundled GHA runs where @cursor/sdk-linux-x64
 * is not shipped alongside dist/index.js as a node_modules package.
 */
export function bootstrapRipgrep(bundleDir: string = __dirname): void {
  const existing = process.env.CURSOR_RIPGREP_PATH;
  if (existing && path.isAbsolute(existing) && isExecutable(existing)) {
    core.info(`Using existing CURSOR_RIPGREP_PATH=${existing}`);
    return;
  }

  const found =
    findRipgrepOnPath() ??
    systemRipgrepCandidates().find((candidate) => isExecutable(candidate)) ??
    findVendoredRipgrep(bundleDir);

  if (found) {
    configureRipgrepPath(found);
    return;
  }

  core.warning(
    'ripgrep (rg) not found; Cursor SDK ignore-aware file search may be degraded. ' +
      'Install ripgrep on the runner or set CURSOR_RIPGREP_PATH.',
  );
}
