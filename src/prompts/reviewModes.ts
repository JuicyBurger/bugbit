import * as fs from 'fs';
import * as path from 'path';
import type { PrefetchedPrData } from '../github/types';

export const ALLOWED_MODES = ['code-review', 'security-review', 'simplify'] as const;
export type ReviewMode = (typeof ALLOWED_MODES)[number];

export const SKILL_BY_MODE: Record<ReviewMode, string> = {
  'code-review': '/code-review',
  'security-review': '/review-security',
  simplify: '/simplify',
};

export function parseReviewModes(input: string): string[] {
  return input
    .split(',')
    .map((mode) => mode.trim())
    .filter(Boolean);
}

export function validateReviewModes(modes: string[]): void {
  if (modes.length === 0) {
    throw new Error(
      'review-modes must include at least one mode. Allowed: code-review, security-review, simplify',
    );
  }

  for (const mode of modes) {
    if (!(ALLOWED_MODES as readonly string[]).includes(mode)) {
      throw new Error(
        `Unknown review mode: ${mode}. Allowed: code-review, security-review, simplify`,
      );
    }
  }
}

function loadSystemPrompt(promptsDir: string, actionPath: string): string {
  const systemPath = path.join(promptsDir, 'system.md');
  const systemPrompt = fs.readFileSync(systemPath, 'utf-8');
  return systemPrompt.replaceAll('{{GITHUB_ACTION_PATH}}', actionPath);
}

function buildPrefetchedSection(prefetched?: PrefetchedPrData): string {
  if (!prefetched) {
    return '';
  }

  const lines = [
    '<prefetched_pr_data>',
    'PR context and diff are preloaded below. Treat this as the authoritative review scope.',
    'Use title and body as author intent; prefer high-impact findings over micro-nits.',
    'When diffMode is hunk_ranges or paths_only, read files for targeted context; still scope comments to changed paths/lines.',
    'Do not spawn task subagents to discover changed files.',
    'You MUST call post_review before finishing (use an empty findings array if no issues).',
    'On large diffs, cover multiple risk areas in one batch.',
    JSON.stringify(prefetched, null, 2),
    '</prefetched_pr_data>',
  ];

  return `\n\n${lines.join('\n')}`;
}

export interface SkillPromptResult {
  prompt: string;
  modes: string[];
}

export function buildSkillPrompt(
  modesInput: string,
  promptsDir: string,
  actionPath: string,
  prefetched?: PrefetchedPrData,
): SkillPromptResult {
  const modes = parseReviewModes(modesInput);
  validateReviewModes(modes);

  const skillLines = modes
    .map((mode) => SKILL_BY_MODE[mode as ReviewMode])
    .join('\n');
  const systemPrompt = loadSystemPrompt(promptsDir, actionPath);

  return {
    prompt: `${skillLines}\n\n${systemPrompt}${buildPrefetchedSection(prefetched)}`,
    modes,
  };
}

function loadDescribePrompt(promptsDir: string, actionPath: string): string {
  const describePath = path.join(promptsDir, 'describe.md');
  const template = fs.readFileSync(describePath, 'utf-8');
  return template.replaceAll('{{GITHUB_ACTION_PATH}}', actionPath);
}

function buildDescribePrefetchedSection(prefetched?: PrefetchedPrData): string {
  if (!prefetched) {
    return '';
  }

  const lines = [
    '<prefetched_pr_data>',
    'PR context and diff are preloaded below. Treat this as the authoritative scope for the description.',
    'Use title and existing body as author intent; do not contradict the stated objective.',
    'Pass ONLY the auto-describe section to update_pr_description — never rewrite or include the author body; the tool appends after it.',
    'When diffMode is hunk_ranges or paths_only, use file paths and diff stats to build the File Walkthrough; read files only if needed.',
    'Do NOT call post_review in describe mode. Do NOT spawn subagents.',
    'You MUST call update_pr_description before finishing. Then call set_pr_labels with inferred type + review-effort labels.',
    '</prefetched_pr_data>',
    JSON.stringify(prefetched, null, 2),
  ];

  return `\n\n${lines.join('\n')}`;
}

export interface DescribePromptResult {
  prompt: string;
}

export function buildDescribePrompt(
  promptsDir: string,
  actionPath: string,
  prefetched?: PrefetchedPrData,
  _labels?: string[],
): DescribePromptResult {
  const describeTemplate = loadDescribePrompt(promptsDir, actionPath);
  return {
    prompt: `${describeTemplate}${buildDescribePrefetchedSection(prefetched)}`,
  };
}
