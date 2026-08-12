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
let mapPullRequestFiles: (
  fileList: Array<{
    filename: string;
    status: string;
    previous_filename?: string;
    patch?: string;
  }>,
) => Array<{ path: string; status: string; previous_filename?: string; hunks?: Hunk[] }>;
let slimFilesToHunkRanges: (files: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
let slimFilesToPathsOnly: (files: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
let buildSizedDiff: (
  files: Array<Record<string, unknown>>,
  limit?: number,
) => { diffMode: string; files: Array<Record<string, unknown>> };
let DIFF_SIZE_LIMIT: number;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../scripts/lib/parse-patch.mjs');
  parseUnifiedPatch = mod.parseUnifiedPatch;
  buildLineMap = mod.buildLineMap;
  mapGitHubStatus = mod.mapGitHubStatus;
  mapPullRequestFiles = mod.mapPullRequestFiles;
  slimFilesToHunkRanges = mod.slimFilesToHunkRanges;
  slimFilesToPathsOnly = mod.slimFilesToPathsOnly;
  buildSizedDiff = mod.buildSizedDiff;
  DIFF_SIZE_LIMIT = mod.DIFF_SIZE_LIMIT;
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

describe('mapPullRequestFiles', () => {
  it('maps deleted files without hunks', () => {
    const files = mapPullRequestFiles([
      { filename: 'src/removed.ts', status: 'removed' },
    ]);

    expect(files).toEqual([{ path: 'src/removed.ts', status: 'deleted' }]);
  });

  it('includes previous_filename for renamed files', () => {
    const files = mapPullRequestFiles([
      {
        filename: 'src/new-name.ts',
        status: 'renamed',
        previous_filename: 'src/old-name.ts',
        patch: '@@ -1 +1 @@\n-old\n+new',
      },
    ]);

    expect(files[0]).toMatchObject({
      path: 'src/new-name.ts',
      status: 'renamed',
      previous_filename: 'src/old-name.ts',
    });
    expect(files[0].hunks).toHaveLength(1);
  });

  it('uses empty hunks when patch is missing', () => {
    const files = mapPullRequestFiles([
      { filename: 'src/large.ts', status: 'modified' },
    ]);

    expect(files).toEqual([
      { path: 'src/large.ts', status: 'modified', hunks: [] },
    ]);
  });
});

describe('slimFilesToHunkRanges', () => {
  it('drops hunk line bodies but keeps ranges', () => {
    const full = mapPullRequestFiles([
      {
        filename: 'src/a.ts',
        status: 'modified',
        patch: '@@ -1,2 +1,3 @@\n context\n+added\n',
      },
    ]);

    const slim = slimFilesToHunkRanges(full);
    expect(slim[0].hunks).toEqual([
      { oldStart: 1, oldLines: 2, newStart: 1, newLines: 3 },
    ]);
    expect((slim[0].hunks as Hunk[])[0]).not.toHaveProperty('lines');
  });
});

describe('slimFilesToPathsOnly', () => {
  it('keeps path status and rename only', () => {
    const full = mapPullRequestFiles([
      {
        filename: 'src/new.ts',
        status: 'renamed',
        previous_filename: 'src/old.ts',
        patch: '@@ -1 +1 @@\n-old\n+new',
      },
    ]);

    expect(slimFilesToPathsOnly(full)).toEqual([
      {
        path: 'src/new.ts',
        status: 'renamed',
        previous_filename: 'src/old.ts',
      },
    ]);
  });
});

describe('buildSizedDiff', () => {
  it('returns full mode when under the limit', () => {
    const files = mapPullRequestFiles([
      {
        filename: 'src/a.ts',
        status: 'modified',
        patch: '@@ -1 +1 @@\n-old\n+new',
      },
    ]);

    const result = buildSizedDiff(files, DIFF_SIZE_LIMIT);
    expect(result.diffMode).toBe('full');
    expect(result.files[0]).toHaveProperty('hunks');
    expect((result.files[0].hunks as Hunk[])[0]).toHaveProperty('lines');
  });

  it('falls back to hunk_ranges when full exceeds limit', () => {
    const files = mapPullRequestFiles([
      {
        filename: 'src/a.ts',
        status: 'modified',
        patch: '@@ -1,2 +1,3 @@\n context\n+added line with enough content\n',
      },
    ]);

    const fullLen = JSON.stringify({ diffMode: 'full', files }).length;
    const result = buildSizedDiff(files, fullLen - 1);
    expect(result.diffMode).toBe('hunk_ranges');
    expect(result.files[0].hunks).toBeDefined();
    expect((result.files[0].hunks as Array<Record<string, unknown>>)[0]).not.toHaveProperty(
      'lines',
    );
  });

  it('falls back to paths_only when hunk_ranges still exceeds limit', () => {
    const files = mapPullRequestFiles([
      {
        filename: 'src/a.ts',
        status: 'modified',
        patch: '@@ -1 +1 @@\n-old\n+new',
      },
    ]);

    const result = buildSizedDiff(files, 80);
    expect(result.diffMode).toBe('paths_only');
    expect(result.files).toEqual([{ path: 'src/a.ts', status: 'modified' }]);
  });
});
