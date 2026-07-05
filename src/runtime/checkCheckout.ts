import * as fs from 'fs';
import * as path from 'path';

export const CHECKOUT_ERROR =
  "Repository not checked out. Add 'actions/checkout@v4' before bugbit.";

export function assertRepoCheckedOut(cwd: string): void {
  const gitDir = path.join(cwd, '.git');
  if (!fs.existsSync(gitDir)) {
    throw new Error(CHECKOUT_ERROR);
  }

  const visibleEntries = fs.readdirSync(cwd).filter((entry) => !entry.startsWith('.'));
  if (visibleEntries.length === 0) {
    throw new Error(CHECKOUT_ERROR);
  }
}
