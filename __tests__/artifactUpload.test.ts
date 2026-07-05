import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  artifactUploadErrorMessage,
  streamLogArtifactName,
  uploadStreamLogArtifact,
} from '../src/artifactUpload';

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

describe('uploadStreamLogArtifact', () => {
  beforeEach(() => {
    uploadArtifact.mockClear();
  });

  it('names artifacts from the Cursor run id', () => {
    expect(streamLogArtifactName('run-abc')).toBe('bugbit-agent-stream-run-abc');
  });

  it('uploads using an absolute file path outside the workspace', async () => {
    const streamLogPath = path.join(os.tmpdir(), 'bugbit-stream-run-abc.jsonl');
    fs.writeFileSync(streamLogPath, '{"type":"test"}\n');

    try {
      await uploadStreamLogArtifact('run-abc', streamLogPath);

      expect(uploadArtifact).toHaveBeenCalledWith(
        'bugbit-agent-stream-run-abc',
        [path.resolve(streamLogPath)],
        path.dirname(path.resolve(streamLogPath)),
      );
    } finally {
      fs.unlinkSync(streamLogPath);
    }
  });
});
