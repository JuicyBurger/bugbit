import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as core from '@actions/core';
import {
  bootstrapRipgrep,
  findRipgrepOnPath,
  findVendoredRipgrep,
  getPlatformKey,
  getRgBinaryName,
} from '../src/runtime/sdkBootstrap';

jest.mock('node:child_process', () => ({
  execFileSync: jest.fn(),
}));

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  accessSync: jest.fn(),
}));

import { execFileSync } from 'node:child_process';

const mockExecFileSync = execFileSync as jest.MockedFunction<typeof execFileSync>;
const mockAccessSync = fs.accessSync as jest.MockedFunction<typeof fs.accessSync>;

describe('sdkBootstrap helpers', () => {
  it('reports the current platform key', () => {
    expect(getPlatformKey()).toBe(`${process.platform}-${process.arch}`);
  });

  it('uses rg.exe on win32', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(getRgBinaryName()).toBe('rg.exe');
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
});

describe('findVendoredRipgrep', () => {
  let bundleDir: string;

  beforeEach(() => {
    bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-rg-vendor-'));
  });

  afterEach(() => {
    fs.rmSync(bundleDir, { recursive: true, force: true });
  });

  it('returns vendored linux-x64 rg when present on linux-x64', () => {
    if (getPlatformKey() !== 'linux-x64') {
      expect(findVendoredRipgrep(bundleDir)).toBeUndefined();
      return;
    }

    const vendoredDir = path.join(bundleDir, 'vendor', 'linux-x64');
    fs.mkdirSync(vendoredDir, { recursive: true });
    const vendoredRg = path.join(vendoredDir, 'rg');
    fs.writeFileSync(vendoredRg, '');
    fs.chmodSync(vendoredRg, 0o755);

    expect(findVendoredRipgrep(bundleDir)).toBe(vendoredRg);
  });

  it('skips vendored lookup on non-linux-x64 platforms', () => {
    const originalPlatform = process.platform;
    const originalArch = process.arch;
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    Object.defineProperty(process, 'arch', { value: 'arm64' });

    const vendoredDir = path.join(bundleDir, 'vendor', 'linux-x64');
    fs.mkdirSync(vendoredDir, { recursive: true });
    const vendoredRg = path.join(vendoredDir, 'rg');
    fs.writeFileSync(vendoredRg, '');
    fs.chmodSync(vendoredRg, 0o755);

    expect(findVendoredRipgrep(bundleDir)).toBeUndefined();

    Object.defineProperty(process, 'platform', { value: originalPlatform });
    Object.defineProperty(process, 'arch', { value: originalArch });
  });
});

describe('bootstrapRipgrep', () => {
  const originalEnv = process.env.CURSOR_RIPGREP_PATH;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CURSOR_RIPGREP_PATH;
    mockAccessSync.mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CURSOR_RIPGREP_PATH;
    } else {
      process.env.CURSOR_RIPGREP_PATH = originalEnv;
    }
  });

  it('leaves an existing absolute executable CURSOR_RIPGREP_PATH unchanged', () => {
    process.env.CURSOR_RIPGREP_PATH = '/custom/rg';

    bootstrapRipgrep();

    expect(process.env.CURSOR_RIPGREP_PATH).toBe('/custom/rg');
    expect(mockExecFileSync).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith('Using existing CURSOR_RIPGREP_PATH=/custom/rg');
  });

  it('sets CURSOR_RIPGREP_PATH from which rg', () => {
    mockExecFileSync.mockReturnValue('/usr/bin/rg\n');

    bootstrapRipgrep();

    expect(process.env.CURSOR_RIPGREP_PATH).toBe('/usr/bin/rg');
    expect(core.info).toHaveBeenCalledWith('Configured CURSOR_RIPGREP_PATH=/usr/bin/rg');
  });

  it('falls back to known candidate paths when which fails', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });
    mockAccessSync.mockImplementation((filePath: fs.PathLike) => {
      if (String(filePath) === '/usr/local/bin/rg') {
        return undefined;
      }
      throw new Error('missing');
    });

    bootstrapRipgrep();

    expect(process.env.CURSOR_RIPGREP_PATH).toBe('/usr/local/bin/rg');
    expect(core.info).toHaveBeenCalledWith('Configured CURSOR_RIPGREP_PATH=/usr/local/bin/rg');
  });

  it('uses vendored linux-x64 rg when system discovery fails', () => {
    if (getPlatformKey() !== 'linux-x64') {
      return;
    }

    const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-bootstrap-'));
    const vendoredDir = path.join(bundleDir, 'vendor', 'linux-x64');
    fs.mkdirSync(vendoredDir, { recursive: true });
    const vendoredRg = path.join(vendoredDir, 'rg');
    fs.writeFileSync(vendoredRg, '');
    fs.chmodSync(vendoredRg, 0o755);

    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });
    mockAccessSync.mockImplementation((filePath: fs.PathLike) => {
      const value = String(filePath);
      if (value === vendoredRg) {
        return undefined;
      }
      throw new Error(`missing ${value}`);
    });

    try {
      bootstrapRipgrep(bundleDir);

      expect(process.env.CURSOR_RIPGREP_PATH).toBe(vendoredRg);
      expect(core.info).toHaveBeenCalledWith(`Configured CURSOR_RIPGREP_PATH=${vendoredRg}`);
    } finally {
      fs.rmSync(bundleDir, { recursive: true, force: true });
    }
  });

  it('warns when ripgrep cannot be found', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });
    mockAccessSync.mockImplementation(() => {
      throw new Error('missing');
    });

    bootstrapRipgrep(path.join(os.tmpdir(), 'empty-bundle-dir'));

    expect(process.env.CURSOR_RIPGREP_PATH).toBeUndefined();
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('ripgrep (rg) not found'),
    );
  });
});

describe('findRipgrepOnPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessSync.mockImplementation(() => undefined);
  });

  it('returns the first executable rg from which', () => {
    mockExecFileSync.mockReturnValue('/usr/bin/rg\n');

    expect(findRipgrepOnPath()).toBe('/usr/bin/rg');
  });
});
