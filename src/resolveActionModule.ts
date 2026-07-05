import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

export type ActionScriptModule = 'operations' | 'preflight';

/**
 * Resolve an action script module for dynamic import.
 * Bundled operations (with @actions/github) ships under dist/scripts/operations/.
 * Unbundled scripts/lib/*.mjs are used for local CLI and Jest mocks.
 */
export function resolveActionModuleUrl(
  actionPath: string,
  moduleName: ActionScriptModule,
): string {
  if (moduleName === 'operations') {
    const bundledPath = path.join(actionPath, 'dist', 'scripts', 'operations', 'index.mjs');
    if (fs.existsSync(bundledPath)) {
      return pathToFileURL(bundledPath).href;
    }
  }

  return pathToFileURL(path.join(actionPath, 'scripts', 'lib', `${moduleName}.mjs`)).href;
}
