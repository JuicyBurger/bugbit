import { DefaultArtifactClient } from '@actions/artifact';
import * as path from 'path';

export interface StreamLogArtifactNameOptions {
  agentRunId: string;
  githubRunId?: string;
  timestamp?: Date;
}

export function artifactUploadErrorMessage(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 403) {
    return (
      'Failed to upload stream log artifact: workflow job needs actions: write permission.\n\n' +
      'Required when save-stream-log is true:\n' +
      'permissions:\n' +
      '  actions: write'
    );
  }
  if (error instanceof Error) {
    return `Failed to upload stream log artifact: ${error.message}`;
  }
  return `Failed to upload stream log artifact: ${String(error)}`;
}

function formatArtifactTimestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export function streamLogArtifactName(options: StreamLogArtifactNameOptions): string {
  const githubRunId = options.githubRunId ?? process.env.GITHUB_RUN_ID ?? 'local';
  const timestamp = formatArtifactTimestamp(options.timestamp ?? new Date());
  return `bugbit-agent-stream-${options.agentRunId}-gh${githubRunId}-${timestamp}`;
}

export async function uploadStreamLogArtifact(
  artifactName: string,
  streamLogPath: string,
): Promise<{ id?: number }> {
  const absolutePath = path.resolve(streamLogPath);
  const rootDirectory = path.dirname(absolutePath);
  const artifactClient = new DefaultArtifactClient();
  return artifactClient.uploadArtifact(artifactName, [absolutePath], rootDirectory);
}
