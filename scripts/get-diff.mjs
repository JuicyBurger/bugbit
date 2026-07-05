#!/usr/bin/env node
import { requirePullRequest } from './lib/event.mjs';
import { getClient, getRepo } from './lib/octokit.mjs';
import {
  parseUnifiedPatch,
  mapGitHubStatus,
  DIFF_SIZE_LIMIT,
} from './lib/parse-patch.mjs';
import { printJson, fail } from './lib/errors.mjs';

try {
  const pr = requirePullRequest();
  const octokit = getClient();
  const { owner, repo } = getRepo();

  const { data: fileList } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pr.number,
  });

  const files = fileList.map((file) => {
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

  const output = { files };

  if (JSON.stringify(output).length > DIFF_SIZE_LIMIT) {
    fail('DIFF_TOO_LARGE', `Diff JSON exceeds ${DIFF_SIZE_LIMIT} bytes`);
  }

  printJson(output);
} catch (e) {
  fail('GET_DIFF_ERROR', e.message);
}
