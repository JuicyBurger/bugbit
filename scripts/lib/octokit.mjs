import { getOctokit } from '@actions/github';

export function getClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');
  return getOctokit(token);
}

export function getRepo() {
  const full = process.env.GITHUB_REPOSITORY;
  if (!full) throw new Error('GITHUB_REPOSITORY not set');
  const [owner, repo] = full.split('/');
  return { owner, repo };
}
