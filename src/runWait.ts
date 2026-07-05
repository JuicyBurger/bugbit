import * as core from '@actions/core';
import type { Run } from '@cursor/sdk';

const HEARTBEAT_MS = 30_000;

export const AGENT_TIMEOUT_MS = 45 * 60 * 1000;

export const AGENT_TIMEOUT_MESSAGE = `Agent timed out after ${Math.round(AGENT_TIMEOUT_MS / 60_000)} minutes`;

export async function waitForRunWithHeartbeat(
  run: Run,
  timeoutMs: number,
): Promise<Awaited<ReturnType<Run['wait']>>> {
  if (timeoutMs <= 0) {
    throw new Error(AGENT_TIMEOUT_MESSAGE);
  }

  core.info('Stream ended; waiting for run completion…');

  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const heartbeat = setInterval(() => {
      const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
      core.info(`[wait] run status=${run.status} elapsed=${elapsedSec}s`);
    }, HEARTBEAT_MS);

    const timer = setTimeout(() => {
      clearInterval(heartbeat);
      reject(new Error(AGENT_TIMEOUT_MESSAGE));
    }, timeoutMs);

    run
      .wait()
      .then((result) => {
        clearInterval(heartbeat);
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error: unknown) => {
        clearInterval(heartbeat);
        clearTimeout(timer);
        reject(error);
      });
  });
}

export function remainingMs(deadlineMs: number): number {
  return deadlineMs - Date.now();
}

export function assertWithinDeadline(deadlineMs: number): void {
  if (remainingMs(deadlineMs) <= 0) {
    throw new Error(AGENT_TIMEOUT_MESSAGE);
  }
}
