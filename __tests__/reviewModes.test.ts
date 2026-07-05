import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildSkillPrompt,
  parseReviewModes,
  validateReviewModes,
} from '../src/reviewModes';

function makePromptsDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-prompts-'));
  const promptsDir = path.join(dir, 'prompts');
  fs.mkdirSync(promptsDir);

  fs.writeFileSync(
    path.join(promptsDir, 'system.md'),
    'System at {{GITHUB_ACTION_PATH}}/scripts/pr-context.mjs',
  );

  return promptsDir;
}

describe('parseReviewModes', () => {
  it('parses comma-separated modes', () => {
    expect(parseReviewModes('code-review, security-review')).toEqual([
      'code-review',
      'security-review',
    ]);
  });
});

describe('validateReviewModes', () => {
  it('throws on unknown mode', () => {
    expect(() => validateReviewModes(['bogus'])).toThrow('Unknown review mode: bogus');
  });
});

describe('buildSkillPrompt', () => {
  it('prefixes selected skills and appends system prompt', () => {
    const promptsDir = makePromptsDir();
    const actionPath = path.dirname(promptsDir);

    const prompt = buildSkillPrompt('code-review,security-review', promptsDir, actionPath);

    expect(prompt.startsWith('/review\n/review-security\n\n')).toBe(true);
    expect(prompt).toContain(actionPath);
    expect(prompt).toContain('System at');
    expect(prompt).toContain('/scripts/pr-context.mjs');
  });

  it('injects /simplify for simplify mode', () => {
    const promptsDir = makePromptsDir();
    const actionPath = path.dirname(promptsDir);

    const prompt = buildSkillPrompt('simplify', promptsDir, actionPath);

    expect(prompt.startsWith('/simplify\n\n')).toBe(true);
  });
});
