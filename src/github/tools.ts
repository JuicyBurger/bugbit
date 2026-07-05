import type { SDKCustomTool, SDKJsonValue } from '@cursor/sdk';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { dynamicImport } from '../runtime/dynamicImport';
import { resolveActionModuleUrl } from '../runtime/resolveActionModule';
import type { BugbitToolDeps, OpsDeps, PrefetchedPrData } from './types';

export type { BugbitToolDeps, PrefetchedPrData };

type OpsModule = {
  getPrContext: (deps: OpsDeps) => Promise<unknown>;
  getDiff: (deps: OpsDeps) => Promise<unknown>;
  postReview: (deps: OpsDeps, findings: unknown[]) => Promise<unknown>;
  postInlineComment: (
    deps: OpsDeps,
    input: { path: string; line: number; body: string },
  ) => Promise<unknown>;
};

const opsPromises = new Map<string, Promise<OpsModule>>();
const preflightPromises = new Map<string, Promise<PreflightModule>>();

type PreflightModule = {
  assertReviewPermissions: (deps: OpsDeps, octokit?: unknown) => Promise<void>;
  formatPermissionErrorMessage: (error: unknown) => string;
};

function loadOps(actionPath: string): Promise<OpsModule> {
  let promise = opsPromises.get(actionPath);
  if (!promise) {
    promise = dynamicImport<OpsModule>(resolveActionModuleUrl(actionPath, 'operations'));
    opsPromises.set(actionPath, promise);
  }
  return promise;
}

function loadPreflight(actionPath: string): Promise<PreflightModule> {
  let promise = preflightPromises.get(actionPath);
  if (!promise) {
    promise = dynamicImport<PreflightModule>(
      resolveActionModuleUrl(actionPath, 'preflight'),
    );
    preflightPromises.set(actionPath, promise);
  }
  return promise;
}

function toOpsDeps(deps: BugbitToolDeps): OpsDeps {
  return {
    token: deps.githubToken,
    eventPath: deps.eventPath,
    repository: deps.repository,
  };
}

function isDiffTooLarge(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as Error & { code?: string }).code === 'DIFF_TOO_LARGE'
  );
}

export async function checkReviewPermissions(deps: BugbitToolDeps): Promise<void> {
  const { assertReviewPermissions, formatPermissionErrorMessage } = await loadPreflight(
    deps.actionPath,
  );

  core.info('Checking GitHub token permissions for PR review…');
  try {
    await assertReviewPermissions(toOpsDeps(deps));
  } catch (error) {
    throw new Error(formatPermissionErrorMessage(error));
  }
  core.info('GitHub token permissions OK');
}

export function copyPermissionsToWorkspace(actionPath: string, cwd: string): void {
  const src = path.resolve(actionPath, '.cursor', 'permissions.json');
  const dst = path.resolve(cwd, '.cursor', 'permissions.json');

  if (!fs.existsSync(src)) {
    core.warning(`permissions.json not found at ${src}; shell restrictions may not apply`);
    return;
  }

  if (src === dst) {
    return;
  }

  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

export async function prefetchPrData(deps: BugbitToolDeps): Promise<PrefetchedPrData> {
  const ops = await loadOps(deps.actionPath);
  const toolDeps = toOpsDeps(deps);

  core.info('Prefetching PR context and diff…');
  const context = await ops.getPrContext(toolDeps);

  try {
    const diff = await ops.getDiff(toolDeps);
    const fileCount = Array.isArray((diff as { files?: unknown[] })?.files)
      ? (diff as { files: unknown[] }).files.length
      : 0;
    core.info(`Prefetched diff: ${fileCount} changed file(s)`);
    return { context, diff };
  } catch (error) {
    if (isDiffTooLarge(error)) {
      core.warning(`Diff too large to prefetch: ${error.message}; agent must call get_diff`);
      return {
        context,
        diffError: { code: error.code, message: error.message },
      };
    }
    throw error;
  }
}

export function isForkPullRequest(eventPath: string): boolean {
  if (!eventPath) return false;
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const pr = event.pull_request;
  if (!pr) return false;
  return pr.head?.repo?.full_name !== pr.base?.repo?.full_name;
}

export function createBugbitTools(deps: BugbitToolDeps): Record<string, SDKCustomTool> {
  const toolDeps = toOpsDeps(deps);

  return {
    get_pr_context: {
      description:
        'Returns PR number, head/base branch names, and commit SHAs for the current pull_request event.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        core.info('[bugbit] get_pr_context called');
        const ops = await loadOps(deps.actionPath);
        return (await ops.getPrContext(toolDeps)) as SDKJsonValue;
      },
    },
    get_diff: {
      description:
        'Returns changed files and parsed diff hunks for the current PR; use as the review scope.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: async () => {
        core.info('[bugbit] get_diff called');
        try {
          const ops = await loadOps(deps.actionPath);
          return (await ops.getDiff(toolDeps)) as SDKJsonValue;
        } catch (error) {
          if (isDiffTooLarge(error)) {
            return { error: { code: error.code, message: error.message } } as SDKJsonValue;
          }
          throw error;
        }
      },
    },
    post_review: {
      description:
        'Posts multiple inline comments as one PR review; prefer this over repeated post_inline_comment calls.',
      inputSchema: {
        type: 'object',
        properties: {
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mode: { type: 'string' },
                path: { type: 'string' },
                line: { type: 'number' },
                body: { type: 'string' },
              },
              required: ['mode', 'path', 'line', 'body'],
              additionalProperties: false,
            },
          },
        },
        required: ['findings'],
        additionalProperties: false,
      },
      execute: async (args) => {
        const findings = args.findings as unknown[];
        core.info(`[bugbit] post_review called with ${findings.length} finding(s)`);
        const ops = await loadOps(deps.actionPath);
        const result = (await ops.postReview(toolDeps, findings)) as SDKJsonValue;
        core.info('[bugbit] post_review completed');
        return result;
      },
    },
    post_inline_comment: {
      description:
        'Posts a single inline comment on a specific file and line in the PR diff.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          line: { type: 'number' },
          body: { type: 'string' },
        },
        required: ['path', 'line', 'body'],
        additionalProperties: false,
      },
      execute: async (args) => {
        core.info(`[bugbit] post_inline_comment called for ${args.path}:${args.line}`);
        const ops = await loadOps(deps.actionPath);
        const result = await ops.postInlineComment(toolDeps, {
          path: args.path as string,
          line: args.line as number,
          body: args.body as string,
        });
        return result as SDKJsonValue;
      },
    },
  };
}
