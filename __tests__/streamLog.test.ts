import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as core from '@actions/core';
import { StreamLogger } from '../src/streamLog';

describe('StreamLogger', () => {
  let tempDir: string;

  beforeEach(() => {
    jest.clearAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugbit-stream-log-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('formats assistant text into readable lines', async () => {
    const logger = new StreamLogger();

    logger.handleEvent({
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'Hello\nworld' }] },
    });
    await logger.close();

    expect(core.info).toHaveBeenCalledWith('Hello');
    expect(core.info).toHaveBeenCalledWith('world');
  });

  it('formats tool calls and flushes buffered assistant text first', async () => {
    const logger = new StreamLogger();

    logger.handleEvent({
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'Reviewing' }] },
    });
    logger.handleEvent({
      type: 'tool_call',
      name: 'get_diff',
      status: 'running',
    });
    await logger.close();

    expect(core.info).toHaveBeenCalledWith('Reviewing');
    expect(core.info).toHaveBeenCalledWith('[tool] get_diff (running)');
  });

  it('writes raw JSONL when saveStreamLog is enabled', async () => {
    const logPath = path.join(tempDir, 'stream.jsonl');
    const logger = new StreamLogger({ saveStreamLog: true, streamLogPath: logPath });

    const event = {
      type: 'status',
      status: 'RUNNING',
    };
    logger.handleEvent(event);
    await logger.close();

    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toEqual(event);
    expect(core.info).toHaveBeenCalledWith('[status] RUNNING');
  });

  it('logs init model once for system init events', async () => {
    const logger = new StreamLogger();

    logger.handleEvent({
      type: 'system',
      subtype: 'init',
      model: { id: 'composer-2.5' },
    });
    logger.handleEvent({
      type: 'system',
      subtype: 'init',
      model: { id: 'composer-2.5' },
    });
    await logger.close();

    expect(core.info).toHaveBeenCalledTimes(1);
    expect(core.info).toHaveBeenCalledWith('[init] model=composer-2.5');
  });
});
