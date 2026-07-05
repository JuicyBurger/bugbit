export interface BugbitToolDeps {
  githubToken: string;
  eventPath: string;
  repository: string;
  actionPath: string;
}

export interface PrefetchedPrData {
  context: unknown;
  diff?: unknown;
  diffError?: { code: string; message: string };
}

export interface OpsDeps {
  token: string;
  eventPath: string;
  repository: string;
}
