import * as core from '@actions/core';
import * as path from 'path';
import { resolveActionPath } from './actionPath';
import { assertRepoCheckedOut } from './checkCheckout';
import { buildSkillPrompt, parseReviewModes } from './reviewModes';
import { copyPermissionsToWorkspace, createBugbitTools, isForkPullRequest } from './bugbitTools';
import { runAgent } from './cursorAgent';

async function run(): Promise<void> {
  try {
    const cwd = process.cwd();
    assertRepoCheckedOut(cwd);

    const apiKey = core.getInput('cursor-api-key', { required: true });
    const githubToken = core.getInput('github-token', { required: true });
    core.setSecret(githubToken);

    const model = core.getInput('model') || 'composer-2.5';
    const modesInput = core.getInput('review-modes') || 'code-review';

    const eventPath = process.env.GITHUB_EVENT_PATH ?? '';
    const repository = process.env.GITHUB_REPOSITORY ?? '';

    if (isForkPullRequest(eventPath)) {
      core.setFailed(
        'bugbit cannot post review comments on pull requests from forks: ' +
          'GITHUB_TOKEN is read-only for fork PRs. ' +
          'See bugbit documentation (DOCS-04) for workarounds.',
      );
      return;
    }

    const actionPath = resolveActionPath(cwd);
    // permissions.json is best-effort shell policy; custom tools are the trust boundary for PR ops.
    copyPermissionsToWorkspace(actionPath, cwd);
    const promptsDir = path.join(actionPath, 'prompts');

    const prompt = buildSkillPrompt(modesInput, promptsDir, actionPath);
    const modes = parseReviewModes(modesInput);

    const customTools = createBugbitTools({
      githubToken,
      eventPath,
      repository,
      actionPath,
    });

    core.info(`Starting Cursor agent (model: ${model}, modes: ${modes.join(', ')})`);
    await runAgent(apiKey, model, prompt, cwd, customTools);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
