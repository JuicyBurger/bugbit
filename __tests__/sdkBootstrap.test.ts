import * as fs from 'node:fs';
import * as core from '@actions/core';
import { bootstrapRipgrep } from '../src/sdkBootstrap';

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
  });

  it('sets CURSOR_RIPGREP_PATH from which rg', () => {
    mockExecFileSync.mockReturnValue('/usr/bin/rg\n');

    bootstrapRipgrep();

    expect(process.env.CURSOR_RIPGREP_PATH).toBe('/usr/bin/rg');
    expect(core.debug).toHaveBeenCalledWith('Configured CURSOR_RIPGREP_PATH=/usr/bin/rg');
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
  });

  it('warns when ripgrep cannot be found', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });
    mockAccessSync.mockImplementation(() => {
      throw new Error('missing');
    });

    bootstrapRipgrep();

    expect(process.env.CURSOR_RIPGREP_PATH).toBeUndefined();
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('ripgrep (rg) not found'),
    );
  });
});
