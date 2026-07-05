const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export const DIFF_SIZE_LIMIT = 1_048_576;

/**
 * @param {string} patch
 * @returns {Array<{ oldStart: number, oldLines: number, newStart: number, newLines: number, lines: Array<{ type: string, oldLine?: number, newLine?: number, content: string }> }>}
 */
export function parseUnifiedPatch(patch) {
  if (!patch) return [];

  const patchLines = patch.split('\n');
  const hunks = [];
  let i = 0;

  while (i < patchLines.length) {
    const match = patchLines[i].match(HUNK_HEADER);
    if (!match) {
      i++;
      continue;
    }

    const oldStart = Number.parseInt(match[1], 10);
    const oldLines = match[2] ? Number.parseInt(match[2], 10) : 1;
    const newStart = Number.parseInt(match[3], 10);
    const newLines = match[4] ? Number.parseInt(match[4], 10) : 1;

    i++;
    const lines = [];
    let oldLine = oldStart;
    let newLine = newStart;

    while (i < patchLines.length && !HUNK_HEADER.test(patchLines[i])) {
      const raw = patchLines[i];
      const prefix = raw[0];
      const content = raw.slice(1);

      if (prefix === ' ') {
        lines.push({ type: 'context', oldLine, newLine, content });
        oldLine++;
        newLine++;
      } else if (prefix === '+') {
        lines.push({ type: 'add', newLine, content });
        newLine++;
      } else if (prefix === '-') {
        lines.push({ type: 'delete', oldLine, content });
        oldLine++;
      }

      i++;
    }

    hunks.push({ oldStart, oldLines, newStart, newLines, lines });
  }

  return hunks;
}

/**
 * @param {string} status
 * @returns {string}
 */
export function mapGitHubStatus(status) {
  if (status === 'removed') return 'deleted';
  return status;
}

/**
 * @param {Array<{ filename: string, status: string, previous_filename?: string, patch?: string }>} fileList
 */
export function mapPullRequestFiles(fileList) {
  return fileList.map((file) => {
    const status = mapGitHubStatus(file.status);

    if (status === 'deleted') {
      return { path: file.filename, status: 'deleted' };
    }

    const entry = { path: file.filename, status };

    if (status === 'renamed' && file.previous_filename) {
      entry.previous_filename = file.previous_filename;
    }

    if (!file.patch) {
      entry.hunks = [];
    } else {
      entry.hunks = parseUnifiedPatch(file.patch);
    }

    return entry;
  });
}

/**
 * @param {Array<{ path: string, status: string, hunks?: Array<{ lines: Array<{ type: string, newLine?: number }> }> }>} files
 * @returns {Map<string, Set<number>>}
 */
export function buildLineMap(files) {
  const map = new Map();

  for (const file of files) {
    if (file.status === 'deleted' || !file.hunks) continue;

    const validLines = new Set();
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if ((line.type === 'add' || line.type === 'context') && line.newLine != null) {
          validLines.add(line.newLine);
        }
      }
    }

    map.set(file.path, validLines);
  }

  return map;
}
