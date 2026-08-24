import * as core from '@actions/core';
import * as path from 'path';
import { runAgent } from './agent/cursorAgent';
import {
  artifactUploadErrorMessage,
  streamLogArtifactName,
  uploadStreamLogArtifact,
} from './runtime/artifactUpload';
import { resolveActionPath } from './runtime/actionPath';
import { assertRepoCheckedOut } from './runtime/checkCheckout';
import {
  buildDescribePrompt,
  buildSkillPrompt,
  parseReviewModes,
} from './prompts/reviewModes';
import {
  checkReviewPermissions,
  copyPermissionsToWorkspace,
  createBugbitTools,
  isForkPullRequest,
  prefetchPrData,
} from './github/tools';
import { resolveEvent } from './runtime/resolveEvent';
import { bootstrapRipgrep } from './runtime/sdkBootstrap';

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
    // Default true when unset (matches action.yml); tolerate missing input in unit contexts.
    const postCleanSummaryInput = core.getInput('post-clean-summary');
    const postCleanSummary =
      postCleanSummaryInput === ''
        ? true
        : core.getBooleanInput('post-clean-summary');
    const cleanSummaryBody =
      core.getInput('clean-summary-body') ||
      '## bugbit: LGTM — no findings\n\nNo issues reported on this diff.';

    const autoDescribe =
      (core.getInput('auto-describe') || 'false').toString().toLowerCase() === 'true';
    const describeLabelsRaw = (core.getInput('describe-labels') || '').trim();
    const describeLabels = describeLabelsRaw
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean);

    if (autoDescribe && describeLabels.length > 0) {
      core.warning(
        'describe-labels configured — consumer job must include permissions: issues: write and pull-requests: write',
      );
    }

    const prNumber = core.getInput('pr-number');
    const rawEventPath = process.env.GITHUB_EVENT_PATH ?? '';
    const repository = process.env.GITHUB_REPOSITORY ?? '';

    const eventPath = await resolveEvent({
      token: githubToken,
      repository,
      eventPath: rawEventPath,
      prNumber: prNumber || undefined,
    });

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
      postCleanSummary,
      cleanSummaryBody,
      autoDescribe,
      describeLabels,
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
    const customTools = createBugbitTools(toolDeps);

    // Determine which passes to run. `review-modes` defaults to "code-review",
    // so a pure-describe run must explicitly pass review-modes as an empty string.
    const reviewModes = parseReviewModes(modesInput);
    const runDescribe = autoDescribe;
    const runReview = reviewModes.length > 0;

    if (!runDescribe && !runReview) {
      core.setFailed(
        'bugbit has nothing to do: auto-describe is false and review-modes is empty. ' +
          'Set auto-describe to true and/or provide at least one review-modes value.',
      );
      return;
    }

    async function runPass(
      label: string,
      prompt: string,
      saveLog: boolean,
    ): Promise<{ runId: string; streamLogPath?: string }> {
      core.info(`Starting Cursor agent (model: ${model}, pass: ${label})`);
      const result = await runAgent(
        apiKey,
        model,
        prompt,
        cwd,
        customTools,
        { saveStreamLog: saveLog },
      );
      core.info(`${label} pass completed: run ${result.runId}`);
      return result;
    }

    async function uploadStreamLog(streamLogPath?: string, runId?: string): Promise<void> {
      if (!saveStreamLog || !streamLogPath || !runId) {
        return;
      }
      try {
        const artifactName = streamLogArtifactName({
          agentRunId: runId,
          githubRunId: process.env.GITHUB_RUN_ID,
        });
        core.info(`Uploading stream log artifact "${artifactName}" from ${streamLogPath}…`);
        const uploadResponse = await uploadStreamLogArtifact(artifactName, streamLogPath);
        core.info(`Uploaded stream log artifact "${artifactName}" (id: ${uploadResponse.id ?? 'unknown'})`);
      } catch (error) {
        core.setFailed(artifactUploadErrorMessage(error));
        throw error;
      }
    }

    // Describe pass: updates the PR body (and optionally labels) before review.
    if (runDescribe) {
      const { prompt: describePrompt } = buildDescribePrompt(
        promptsDir,
        actionPath,
        prefetched,
        describeLabels,
      );
      const describeRun = await runPass('describe', describePrompt, saveStreamLog);
      await uploadStreamLog(describeRun.streamLogPath, describeRun.runId);
    }

    // Review pass: posts inline findings (or an LGTM clean summary).
    if (runReview) {
      const { prompt: reviewPrompt } = buildSkillPrompt(
        reviewModes.join(','),
        promptsDir,
        actionPath,
        prefetched,
      );
      const reviewRun = await runPass('review', reviewPrompt, saveStreamLog);
      await uploadStreamLog(reviewRun.streamLogPath, reviewRun.runId);
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
