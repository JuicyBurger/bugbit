import * as fs from 'fs';
import * as path from 'path';

export const ALLOWED_MODES = ['code-review', 'security-review', 'simplify'] as const;
export type ReviewMode = (typeof ALLOWED_MODES)[number];

export const SKILL_BY_MODE: Record<ReviewMode, string> = {
  'code-review': '/review',
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
  for (const mode of modes) {
    if (!(ALLOWED_MODES as readonly string[]).includes(mode)) {
      throw new Error(
        `Unknown review mode: ${mode}. Allowed: code-review, security-review, simplify`,
      );
    }
  }
}

function resolveActionPath(promptsDir: string, actionPath?: string): string {
  if (actionPath) {
    return actionPath;
  }
  if (process.env.GITHUB_ACTION_PATH) {
    return process.env.GITHUB_ACTION_PATH;
  }
  return path.basename(promptsDir) === 'prompts' ? path.dirname(promptsDir) : promptsDir;
}

function loadSystemPrompt(promptsDir: string, actionPath?: string): string {
  const resolvedActionPath = resolveActionPath(promptsDir, actionPath);
  const systemPath = path.join(promptsDir, 'system.md');
  let systemPrompt = fs.readFileSync(systemPath, 'utf-8');
  return systemPrompt.replaceAll('{{GITHUB_ACTION_PATH}}', resolvedActionPath);
}

export function buildSkillPrompt(
  modesInput: string,
  promptsDir: string,
  actionPath?: string,
): string {
  const modes = parseReviewModes(modesInput);
  validateReviewModes(modes);

  const skillLines = modes
    .map((mode) => SKILL_BY_MODE[mode as ReviewMode])
    .join('\n');
  const systemPrompt = loadSystemPrompt(promptsDir, actionPath);

  return `${skillLines}\n\n${systemPrompt}`;
}
