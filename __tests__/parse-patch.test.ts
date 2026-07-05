type HunkLine = { type: string; oldLine?: number; newLine?: number; content: string };
type Hunk = {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: HunkLine[];
};

let parseUnifiedPatch: (patch: string) => Hunk[];
let buildLineMap: (files: Array<{ path: string; status: string; hunks?: Hunk[] }>) => Map<string, Set<number>>;
let mapGitHubStatus: (status: string) => string;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../scripts/lib/parse-patch.mjs');
  parseUnifiedPatch = mod.parseUnifiedPatch;
  buildLineMap = mod.buildLineMap;
  mapGitHubStatus = mod.mapGitHubStatus;
});

describe('parseUnifiedPatch', () => {
  it('parses single-hunk patch with correct oldStart and newStart', () => {
    const patch = [
      '@@ -10,3 +10,4 @@',
      ' context line',
      '+added line',
      ' another context',
    ].join('\n');

    const hunks = parseUnifiedPatch(patch);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].oldStart).toBe(10);
    expect(hunks[0].newStart).toBe(10);
    expect(hunks[0].lines).toEqual([
      { type: 'context', oldLine: 10, newLine: 10, content: 'context line' },
      { type: 'add', newLine: 11, content: 'added line' },
      { type: 'context', oldLine: 11, newLine: 12, content: 'another context' },
    ]);
  });
});

describe('buildLineMap', () => {
  it('includes context and add lines and excludes delete-only new lines', () => {
    const files = [
      {
        path: 'src/example.ts',
        status: 'modified',
        hunks: [
          {
            oldStart: 1,
            oldLines: 3,
            newStart: 1,
            newLines: 3,
            lines: [
              { type: 'context', oldLine: 1, newLine: 1, content: ' keep' },
              { type: 'delete', oldLine: 2, content: 'remove' },
              { type: 'add', newLine: 2, content: 'insert' },
            ],
          },
        ],
      },
    ];

    const lineMap = buildLineMap(files);
    const lines = lineMap.get('src/example.ts');

    expect(lines).toBeDefined();
    expect(lines?.has(1)).toBe(true);
    expect(lines?.has(2)).toBe(true);
    expect(lines?.size).toBe(2);
  });

  it('skips deleted files', () => {
    const files = [{ path: 'src/removed.ts', status: 'deleted' }];
    const lineMap = buildLineMap(files);

    expect(lineMap.has('src/removed.ts')).toBe(false);
  });
});

describe('mapGitHubStatus', () => {
  it('maps removed to deleted and passes through other statuses', () => {
    expect(mapGitHubStatus('removed')).toBe('deleted');
    expect(mapGitHubStatus('added')).toBe('added');
    expect(mapGitHubStatus('modified')).toBe('modified');
    expect(mapGitHubStatus('renamed')).toBe('renamed');
  });
});
