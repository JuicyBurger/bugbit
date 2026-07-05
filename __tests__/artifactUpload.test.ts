import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  artifactUploadErrorMessage,
  streamLogArtifactName,
  uploadStreamLogArtifact,
} from '../src/runtime/artifactUpload';

const uploadArtifact = jest.fn().mockResolvedValue({ id: 42 });

jest.mock('@actions/artifact', () => ({
  DefaultArtifactClient: jest.fn().mockImplementation(() => ({
    uploadArtifact,
  })),
}));

describe('artifactUploadErrorMessage', () => {
  it('mentions actions: write for 403 errors', () => {
    const message = artifactUploadErrorMessage({ status: 403 });
    expect(message).toContain('actions: write');
    expect(message).toContain('save-stream-log');
  });

  it('passes through generic error messages', () => {
    expect(artifactUploadErrorMessage(new Error('upload failed'))).toContain('upload failed');
  });
});

describe('streamLogArtifactName', () => {
  it('includes the Cursor run id, GitHub run id, and UTC timestamp', () => {
    expect(
      streamLogArtifactName({
        agentRunId: 'run-abc',
        githubRunId: '28755654312',
        timestamp: new Date('2026-07-05T23:30:45.000Z'),
      }),
    ).toBe('bugbit-agent-stream-run-abc-gh28755654312-20260705-233045Z');
  });

  it('falls back to local when GITHUB_RUN_ID is unset', () => {
    const original = process.env.GITHUB_RUN_ID;
    delete process.env.GITHUB_RUN_ID;

    expect(
      streamLogArtifactName({
        agentRunId: 'run-abc',
        timestamp: new Date('2026-07-05T23:30:45.000Z'),
      }),
    ).toBe('bugbit-agent-stream-run-abc-ghlocal-20260705-233045Z');

    if (original === undefined) {
      delete process.env.GITHUB_RUN_ID;
    } else {
      process.env.GITHUB_RUN_ID = original;
    }
  });
});

describe('uploadStreamLogArtifact', () => {
  beforeEach(() => {
    uploadArtifact.mockClear();
  });

  it('uploads using an absolute file path outside the workspace', async () => {
    const streamLogPath = path.join(os.tmpdir(), 'bugbit-stream-run-abc.jsonl');
    const artifactName = 'bugbit-agent-stream-run-abc-gh28755654312-20260705-233045Z';
    fs.writeFileSync(streamLogPath, '{"type":"test"}\n');

    try {
      await uploadStreamLogArtifact(artifactName, streamLogPath);

      expect(uploadArtifact).toHaveBeenCalledWith(
        artifactName,
        [path.resolve(streamLogPath)],
        path.dirname(path.resolve(streamLogPath)),
      );
    } finally {
      fs.unlinkSync(streamLogPath);
    }
  });
});
