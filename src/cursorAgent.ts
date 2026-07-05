import { Agent, CursorAgentError, type SDKCustomTool } from '@cursor/sdk';
import * as core from '@actions/core';

const AGENT_TIMEOUT_MS = 45 * 60 * 1000;

export async function runAgent(
  apiKey: string,
  model: string,
  prompt: string,
  cwd: string,
  customTools: Record<string, SDKCustomTool>,
): Promise<void> {
  core.setSecret(apiKey);

  try {
    await using agent = await Agent.create({
      apiKey,
      model: { id: model },
      local: { cwd, customTools },
    });

    const run = await agent.send(prompt);
    core.info(`Started run ${run.id} (agent ${agent.agentId})`);

    for await (const event of run.stream()) {
      core.info(JSON.stringify(event));
    }

    const result = await Promise.race([
      run.wait(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Agent timed out after 45 minutes')),
          AGENT_TIMEOUT_MS,
        ),
      ),
    ]);

    if (result.status === 'error') {
      throw new Error(`Agent run failed: ${result.id}`);
    }
    if (result.status === 'cancelled') {
      throw new Error(`Agent run cancelled: ${result.id}`);
    }
  } catch (error) {
    if (error instanceof CursorAgentError) {
      throw new Error(
        `Agent startup failed: ${error.message} (retryable=${error.isRetryable})`,
      );
    }
    throw error;
  }
}
