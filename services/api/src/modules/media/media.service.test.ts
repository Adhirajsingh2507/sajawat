/**
 * Media service (1.3-media): magic-byte validation, sharp image optimization,
 * video passthrough, size caps, and the config-gated (501) path. GCS is mocked —
 * no real cloud calls; sharp runs for real on tiny in-memory images.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';

vi.mock('../../storage/gcs-provider.js', () => ({
  gcsProvider: { isConfigured: vi.fn(() => true), upload: vi.fn() },
}));

const { gcsProvider } = await import('../../storage/gcs-provider.js');
const { mediaService, _internal } = await import('./media.service.js');

const uploadMock = vi.mocked(gcsProvider.upload);
const configuredMock = vi.mocked(gcsProvider.isConfigured);

beforeEach(() => {
  configuredMock.mockReturnValue(true);
  uploadMock.mockResolvedValue('https://cdn.example/products/x');
});
afterEach(() => {
  vi.clearAllMocks();
});

async function pngBuffer(): Promise<Buffer> {
  return sharp({
    create: { width: 12, height: 8, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
}

function mp4Buffer(size = 64): Buffer {
  const b = Buffer.alloc(size);
  b.write('ftyp', 4, 'ascii'); // ISO-BMFF box type at bytes 4..8
  return b;
}

describe('sniffType', () => {
  it('detects jpeg / png / webp / mp4 and rejects unknown', async () => {
    const png = await pngBuffer();
    expect(_internal.sniffType(png)).toBe('image/png');

    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    expect(_internal.sniffType(jpeg)).toBe('image/jpeg');

    const webp = Buffer.alloc(12);
    webp.write('RIFF', 0);
    webp.write('WEBP', 8);
    expect(_internal.sniffType(webp)).toBe('image/webp');

    expect(_internal.sniffType(mp4Buffer())).toBe('video/mp4');
    expect(_internal.sniffType(Buffer.from('not a real file'))).toBeNull();
  });
});

describe('upload', () => {
  it('optimizes an image to webp and uploads it', async () => {
    const res = await mediaService.upload(await pngBuffer());
    expect(res.kind).toBe('image');
    expect(res.contentType).toBe('image/webp');
    expect(res.width).toBeGreaterThan(0);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [objectPath, , contentType] = uploadMock.mock.calls[0] ?? [];
    expect(objectPath).toMatch(/^products\/.+\.webp$/);
    expect(contentType).toBe('image/webp');
  });

  it('passes an mp4 through untranscoded', async () => {
    const res = await mediaService.upload(mp4Buffer());
    expect(res.kind).toBe('video');
    expect(res.contentType).toBe('video/mp4');
    const [objectPath] = uploadMock.mock.calls[0] ?? [];
    expect(objectPath).toMatch(/^products\/.+\.mp4$/);
  });

  it('rejects an unsupported file type (400)', async () => {
    await expect(mediaService.upload(Buffer.from('plain text, not media'))).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('rejects an empty file (400)', async () => {
    await expect(mediaService.upload(Buffer.alloc(0))).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects an oversized image (400) before processing', async () => {
    const big = Buffer.alloc(_internal.MAX_IMAGE_BYTES + 1);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff; // jpeg magic so it sniffs as an image
    await expect(mediaService.upload(big)).rejects.toMatchObject({ statusCode: 400 });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('returns 501 when GCS is not configured', async () => {
    configuredMock.mockReturnValue(false);
    await expect(mediaService.upload(await pngBuffer())).rejects.toMatchObject({ statusCode: 501 });
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
