type ValidateResult =
  | { valid: true }
  | { valid: false; code: string; message: string };

let validateFinding: (
  path: string,
  line: number,
  lineMap: Map<string, Set<number>>,
) => ValidateResult;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../scripts/lib/validate.mjs');
  validateFinding = mod.validateFinding;
});

function mockLineMap(entries: Record<string, number[]>): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>();
  for (const [path, lines] of Object.entries(entries)) {
    map.set(path, new Set(lines));
  }
  return map;
}

describe('validateFinding', () => {
  const lineMap = mockLineMap({
    'src/example.ts': [1, 2, 42],
  });

  it('returns valid for a line present in the diff map', () => {
    const result = validateFinding('src/example.ts', 42, lineMap);

    expect(result).toEqual({ valid: true });
  });

  it('returns LINE_NOT_IN_DIFF for a line outside the hunk', () => {
    const result = validateFinding('src/example.ts', 99, lineMap);

    expect(result).toEqual({
      valid: false,
      code: 'LINE_NOT_IN_DIFF',
      message: 'Line 99 not in diff hunk for src/example.ts',
    });
  });

  it('returns PATH_NOT_IN_DIFF for an unknown path', () => {
    const result = validateFinding('src/missing.ts', 1, lineMap);

    expect(result).toEqual({
      valid: false,
      code: 'PATH_NOT_IN_DIFF',
      message: 'Path not in PR diff: src/missing.ts',
    });
  });
});
