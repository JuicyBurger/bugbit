import * as fs from 'fs';
import * as path from 'path';

const bundlePath = path.join(__dirname, '..', 'dist', 'index.js');
const describeBundle = fs.existsSync(bundlePath) ? describe : describe.skip;

describeBundle('dynamicImport bundled output', () => {
  it('uses runtime import() in dist/index.js instead of require(file://)', () => {
    const bundle = fs.readFileSync(bundlePath, 'utf8');
    expect(bundle).toContain('return import(specifier)');
    expect(bundle).not.toContain("Cannot find module '@actions/github'");
    expect(bundle).not.toContain('webpackMissingModule');
    expect(bundle).not.toContain('Promise.resolve(`${specifier}`).then(s => __importStar(require(s)))');
    expect(bundle).not.toMatch(/loadPreflight[\s\S]{0,200}require\(s\)/);
    expect(bundle).not.toMatch(/loadOps[\s\S]{0,200}require\(s\)/);
  });
});
