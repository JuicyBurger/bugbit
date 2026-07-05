import { Agent } from '@cursor/sdk';
import * as core from '@actions/core';
import type { SDKCustomTool } from '@cursor/sdk';
import { runAgent } from '../src/cursorAgent';

jest.mock('@cursor/sdk', () => ({
  Agent: {
    create: jest.fn(),
  },
  CursorAgentError: class CursorAgentError extends Error {
    isRetryable = false;
  },
}));

const mockCreate = Agent.create as jest.MockedFunction<typeof Agent.create>;

function makeCustomTools(): Record<string, SDKCustomTool> {
  return {
    get_pr_context: {
      description: 'test',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({}),
    },
  };
}

function mockAgentSuccess(
  waitResult: { status: string; id: string } = { status: 'completed', id: 'run-1' },
): void {
  mockCreate.mockResolvedValue({
    agentId: 'agent-1',
    send: jest.fn().mockResolvedValue({
      id: 'run-1',
      stream: async function* () {},
      wait: jest.fn().mockResolvedValue(waitResult),
    }),
    [Symbol.asyncDispose]: async () => {},
  } as never);
}

describe('runAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('passes customTools to Agent.create under local.customTools', async () => {
    const customTools = makeCustomTools();
    mockAgentSuccess();

    await runAgent('api-key', 'composer-2.5', 'review prompt', '/tmp/repo', customTools);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        local: expect.objectContaining({
          customTools,
          cwd: '/tmp/repo',
        }),
      }),
    );
  });

  it('masks apiKey with core.setSecret before logging', async () => {
    const customTools = makeCustomTools();
    mockAgentSuccess();

    await runAgent('secret-api-key', 'composer-2.5', 'prompt', '/tmp/repo', customTools);

    expect(core.setSecret).toHaveBeenCalledWith('secret-api-key');
    const setSecretOrder = (core.setSecret as jest.Mock).mock.invocationCallOrder[0];
    const infoOrder = (core.info as jest.Mock).mock.invocationCallOrder[0];
    expect(setSecretOrder).toBeLessThan(infoOrder);
  });

  it('rejects when run.wait exceeds the agent timeout', async () => {
    const customTools = makeCustomTools();

    mockCreate.mockResolvedValue({
      agentId: 'agent-1',
      send: jest.fn().mockResolvedValue({
        id: 'run-1',
        stream: async function* () {},
        wait: jest.fn().mockReturnValue(new Promise(() => {})),
      }),
      [Symbol.asyncDispose]: async () => {},
    } as never);

    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((fn: TimerHandler, _ms?: number) => {
        if (typeof fn === 'function') {
          fn();
        }
        return 0 as unknown as NodeJS.Timeout;
      });

    await expect(
      runAgent('api-key', 'composer-2.5', 'prompt', '/tmp/repo', customTools),
    ).rejects.toThrow('Agent timed out after 45 minutes');

    setTimeoutSpy.mockRestore();
  });
});
