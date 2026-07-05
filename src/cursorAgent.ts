import { Agent, CursorAgentError } from '@cursor/sdk';
import * as core from '@actions/core';

export async function runAgent(
  apiKey: string,
  model: string,
  prompt: string,
  cwd: string,
): Promise<void> {
  core.setSecret(apiKey);

  try {
    await using agent = await Agent.create({
      apiKey,
      model: { id: model },
      local: { cwd },
    });

    const run = await agent.send(prompt);
    core.info(`Started run ${run.id} (agent ${agent.agentId})`);

    for await (const event of run.stream()) {
      core.info(JSON.stringify(event));
    }

    const result = await run.wait();
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
