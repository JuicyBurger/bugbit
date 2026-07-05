import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireFromRoot = createRequire(path.join(repoRoot, 'package.json'));

function resolveSourceRipgrep() {
  try {
    const pkgDir = path.dirname(requireFromRoot.resolve('@cursor/sdk-linux-x64/package.json'));
    return path.join(pkgDir, 'bin', 'rg');
  } catch {
    const sdkPkgDir = path.dirname(requireFromRoot.resolve('@cursor/sdk/package.json'));
    return path.join(sdkPkgDir, 'node_modules', '@cursor', 'sdk-linux-x64', 'bin', 'rg');
  }
}

const sourceRg = resolveSourceRipgrep();
const destRg = path.join(repoRoot, 'dist', 'vendor', 'linux-x64', 'rg');

if (!fs.existsSync(sourceRg)) {
  console.error(`Missing source ripgrep binary: ${sourceRg}`);
  console.error('Install dependencies with pnpm install (requires @cursor/sdk-linux-x64).');
  process.exit(1);
}

fs.mkdirSync(path.dirname(destRg), { recursive: true });
fs.copyFileSync(sourceRg, destRg);
fs.chmodSync(destRg, 0o755);

console.log(`Copied ripgrep to ${destRg}`);
