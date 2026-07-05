import { getOctokit } from '@actions/github';

export function createClient(token) {
  if (!token) throw new Error('GITHUB_TOKEN not set');
  return getOctokit(token);
}

export function parseRepo(repository) {
  if (!repository) throw new Error('GITHUB_REPOSITORY not set');
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error(`Invalid repository: ${repository}`);
  return { owner, repo };
}

export function getClient() {
  return createClient(process.env.GITHUB_TOKEN);
}

export function getRepo() {
  return parseRepo(process.env.GITHUB_REPOSITORY);
}
