import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { assertRepoCheckedOut, CHECKOUT_ERROR } from '../src/runtime/checkCheckout';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-checkout-'));
}

describe('assertRepoCheckedOut', () => {
  it('passes when cwd has .git and at least one non-dot entry', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.git'));
    fs.writeFileSync(path.join(dir, 'README.md'), '# test');

    expect(() => assertRepoCheckedOut(dir)).not.toThrow();
  });

  it('throws CHECKOUT_ERROR when .git is missing', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'README.md'), '# test');

    expect(() => assertRepoCheckedOut(dir)).toThrow(CHECKOUT_ERROR);
  });

  it('throws CHECKOUT_ERROR when only .git exists', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.git'));

    expect(() => assertRepoCheckedOut(dir)).toThrow(CHECKOUT_ERROR);
  });
});
