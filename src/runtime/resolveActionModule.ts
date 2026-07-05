import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

export type ActionScriptModule = 'operations' | 'preflight';

function bundledModulePath(actionPath: string, moduleName: ActionScriptModule): string {
  return path.join(actionPath, 'dist', 'scripts', moduleName, 'index.mjs');
}

/**
 * Resolve an action script module for dynamic import.
 * Bundled scripts (with @actions/github) ship under dist/scripts/{module}/.
 * Unbundled scripts/lib/*.mjs are used for local CLI and Jest mocks.
 */
export function resolveActionModuleUrl(
  actionPath: string,
  moduleName: ActionScriptModule,
): string {
  const bundledPath = bundledModulePath(actionPath, moduleName);
  if (fs.existsSync(bundledPath)) {
    return pathToFileURL(bundledPath).href;
  }

  return pathToFileURL(path.join(actionPath, 'scripts', 'lib', `${moduleName}.mjs`)).href;
}
