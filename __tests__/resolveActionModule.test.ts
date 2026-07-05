import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { resolveActionModuleUrl } from '../src/resolveActionModule';

describe('resolveActionModuleUrl', () => {
  let actionPath: string;

  beforeEach(() => {
    actionPath = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-resolve-module-'));
  });

  afterEach(() => {
    fs.rmSync(actionPath, { recursive: true, force: true });
  });

  it('prefers bundled operations when present', () => {
    const bundledDir = path.join(actionPath, 'dist', 'scripts', 'operations');
    fs.mkdirSync(bundledDir, { recursive: true });
    const bundledFile = path.join(bundledDir, 'index.mjs');
    fs.writeFileSync(bundledFile, 'export {};\n');

    expect(resolveActionModuleUrl(actionPath, 'operations')).toBe(
      pathToFileURL(bundledFile).href,
    );
  });

  it('falls back to scripts/lib when bundled operations is absent', () => {
    const sourceFile = path.join(actionPath, 'scripts', 'lib', 'operations.mjs');
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
    fs.writeFileSync(sourceFile, 'export {};\n');

    expect(resolveActionModuleUrl(actionPath, 'operations')).toBe(
      pathToFileURL(sourceFile).href,
    );
  });

  it('always resolves preflight from scripts/lib', () => {
    const sourceFile = path.join(actionPath, 'scripts', 'lib', 'preflight.mjs');
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
    fs.writeFileSync(sourceFile, 'export {};\n');

    expect(resolveActionModuleUrl(actionPath, 'preflight')).toBe(pathToFileURL(sourceFile).href);
  });
});
