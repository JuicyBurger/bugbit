import type { SDKCustomTool, SDKJsonValue } from '@cursor/sdk';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

export interface BugbitToolDeps {
  githubToken: string;
  eventPath: string;
  repository: string;
  actionPath: string;
}

type OpsModule = {
  getPrContext: (deps: {
    token: string;
    eventPath: string;
    repository: string;
  }) => Promise<unknown>;
  getDiff: (deps: {
    token: string;
    eventPath: string;
    repository: string;
  }) => Promise<unknown>;
  postReview: (
    deps: { token: string; eventPath: string; repository: string },
    findings: unknown[],
  ) => Promise<unknown>;
  postInlineComment: (
    deps: { token: string; eventPath: string; repository: string },
    input: { path: string; line: number; body: string },
  ) => Promise<unknown>;
};

let opsPromise: Promise<OpsModule> | null = null;

function loadOps(actionPath: string): Promise<OpsModule> {
  if (!opsPromise) {
    const opsUrl = pathToFileURL(
      path.join(actionPath, 'scripts', 'lib', 'operations.mjs'),
    ).href;
    opsPromise = import(opsUrl) as Promise<OpsModule>;
  }
  return opsPromise;
}

function isAuthError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status === 401 || status === 403;
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

export interface PrefetchedPrData {
  context: unknown;
  diff?: unknown;
  diffError?: { code: string; message: string };
}

export async function prefetchPrData(deps: BugbitToolDeps): Promise<PrefetchedPrData> {
  const ops = await loadOps(deps.actionPath);
  const toolDeps = {
    token: deps.githubToken,
    eventPath: deps.eventPath,
    repository: deps.repository,
  };

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
    const err = error as Error & { code?: string };
    if (err.code === 'DIFF_TOO_LARGE') {
      core.warning(`Diff too large to prefetch: ${err.message}; agent must call get_diff`);
      return {
        context,
        diffError: { code: err.code, message: err.message },
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
  const toolDeps = {
    token: deps.githubToken,
    eventPath: deps.eventPath,
    repository: deps.repository,
  };

  const getOps = () => loadOps(deps.actionPath);

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
        const ops = await getOps();
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
          const ops = await getOps();
          return (await ops.getDiff(toolDeps)) as SDKJsonValue;
        } catch (error) {
          const err = error as Error & { code?: string };
          if (err.code === 'DIFF_TOO_LARGE') {
            return { error: { code: err.code, message: err.message } } as SDKJsonValue;
          }
          if (isAuthError(error)) {
            throw error;
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
        const ops = await getOps();
        try {
          const result = (await ops.postReview(toolDeps, findings)) as SDKJsonValue;
          core.info('[bugbit] post_review completed');
          return result;
        } catch (error) {
          if (isAuthError(error)) {
            throw error;
          }
          throw error;
        }
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
        const ops = await getOps();
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
