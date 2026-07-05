import * as core from '@actions/core';
import * as path from 'path';
import { artifactUploadErrorMessage, uploadStreamLogArtifact } from './artifactUpload';
import { resolveActionPath } from './actionPath';
import { assertRepoCheckedOut } from './checkCheckout';
import { buildSkillPrompt, parseReviewModes } from './reviewModes';
import {
  checkReviewPermissions,
  copyPermissionsToWorkspace,
  createBugbitTools,
  isForkPullRequest,
  prefetchPrData,
} from './bugbitTools';
import { runAgent } from './cursorAgent';
import { bootstrapRipgrep } from './sdkBootstrap';

async function run(): Promise<void> {
  try {
    bootstrapRipgrep();

    const cwd = process.cwd();
    assertRepoCheckedOut(cwd);

    const apiKey = core.getInput('cursor-api-key', { required: true });
    const githubToken = core.getInput('github-token', { required: true });
    core.setSecret(githubToken);

    const model = core.getInput('model') || 'composer-2.5';
    const modesInput = core.getInput('review-modes') || 'code-review';
    const saveStreamLog = core.getBooleanInput('save-stream-log');

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

    const toolDeps = {
      githubToken,
      eventPath,
      repository,
      actionPath,
    };

    if (saveStreamLog) {
      core.info(
        'save-stream-log enabled — consumer workflow must include actions: write',
      );
    }

    try {
      await checkReviewPermissions(toolDeps);
    } catch (error) {
      core.setFailed(error instanceof Error ? error.message : String(error));
      return;
    }

    // permissions.json is best-effort shell policy; custom tools are the trust boundary for PR ops.
    copyPermissionsToWorkspace(actionPath, cwd);
    const promptsDir = path.join(actionPath, 'prompts');

    const prefetched = await prefetchPrData(toolDeps);
    const prompt = buildSkillPrompt(modesInput, promptsDir, actionPath, prefetched);
    const modes = parseReviewModes(modesInput);

    const customTools = createBugbitTools(toolDeps);

    core.info(`Starting Cursor agent (model: ${model}, modes: ${modes.join(', ')})`);
    const { runId, streamLogPath } = await runAgent(
      apiKey,
      model,
      prompt,
      cwd,
      customTools,
      { saveStreamLog },
    );

    if (saveStreamLog && streamLogPath) {
      try {
        const uploadResponse = await uploadStreamLogArtifact(runId, streamLogPath);
        core.info(`Uploaded stream log artifact (id: ${uploadResponse.id ?? 'unknown'})`);
      } catch (error) {
        core.setFailed(artifactUploadErrorMessage(error));
        return;
      }
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
