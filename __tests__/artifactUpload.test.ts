import { artifactUploadErrorMessage } from '../src/artifactUpload';

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
