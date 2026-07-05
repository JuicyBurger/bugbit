import { DefaultArtifactClient } from '@actions/artifact';
import * as path from 'path';

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

export async function uploadStreamLogArtifact(
  runId: string,
  streamLogPath: string,
): Promise<{ id?: number }> {
  const artifactClient = new DefaultArtifactClient();
  return artifactClient.uploadArtifact(
    `bugbit-agent-stream-${runId}`,
    [path.basename(streamLogPath)],
    path.dirname(streamLogPath),
  );
}
