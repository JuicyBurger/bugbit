import type { Run } from '@cursor/sdk';
import * as core from '@actions/core';
import { waitForRunWithHeartbeat } from '../src/agent/runWait';

describe('waitForRunWithHeartbeat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('logs stream-ended message and resolves when wait completes', async () => {
    const run = {
      status: 'running',
      wait: jest.fn().mockResolvedValue({ status: 'finished', id: 'run-1' }),
    } as unknown as Run;

    const promise = waitForRunWithHeartbeat(run, 60_000);
    await promise;

    expect(core.info).toHaveBeenCalledWith('Stream ended; waiting for run completion…');
    expect(run.wait).toHaveBeenCalled();
  });

  it('rejects when timeout elapses before wait resolves', async () => {
    const run = {
      status: 'running',
      wait: jest.fn().mockReturnValue(new Promise(() => {})),
    } as unknown as Run;

    const promise = waitForRunWithHeartbeat(run, 1_000);
    jest.advanceTimersByTime(1_000);

    await expect(promise).rejects.toThrow('Agent timed out after 45 minutes');
  });
});
