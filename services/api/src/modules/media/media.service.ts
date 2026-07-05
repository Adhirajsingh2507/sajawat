/**
 * Media service (Milestone 1.3-media) — API-proxied upload pipeline.
 *
 * Flow: validate the *actual* bytes (magic-byte sniff — never trust the
 * client-declared MIME) → images are optimized with sharp (auto-orient, cap the
 * long edge, re-encode to WebP, strip metadata); video (mp4) is passed through
 * validated but untranscoded → upload to the public GCS bucket → return a
 * durable public URL. Config-gated: unconfigured GCS → 501 (admin keeps the
 * manual URL fallback).
 */
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { MediaUploadResult } from '@sajawat/types';
import { BadRequestError, NotImplementedError } from '../../errors/app-error.js';
import { gcsProvider } from '../../storage/gcs-provider.js';

// Pre-optimization caps (multer enforces a hard ceiling; these are per-kind).
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 64 * 1024 * 1024; // 64 MB
const MAX_IMAGE_DIMENSION = 1600; // long edge, px
const WEBP_QUALITY = 82;

type SniffedType = 'image/jpeg' | 'image/png' | 'image/webp' | 'video/mp4';

/** Detect the real content type from the file's magic bytes. */
function sniffType(buf: Buffer): SniffedType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  // MP4 / ISO-BMFF: bytes 4..8 are the "ftyp" box type.
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') return 'video/mp4';
  return null;
}

function assertConfigured(): void {
  if (!gcsProvider.isConfigured()) {
    throw new NotImplementedError('Media uploads are not configured');
  }
}

async function uploadImage(buffer: Buffer): Promise<MediaUploadResult> {
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new BadRequestError(`Image exceeds the ${String(MAX_IMAGE_BYTES / 1024 / 1024)}MB limit`);
  }
  let optimized: Buffer;
  let width: number | undefined;
  let height: number | undefined;
  try {
    const out = await sharp(buffer, { failOn: 'error' })
      .rotate() // honor EXIF orientation, then strip metadata (default)
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
    optimized = out.data;
    width = out.info.width;
    height = out.info.height;
  } catch {
    throw new BadRequestError('Image could not be processed');
  }
  const url = await gcsProvider.upload(`products/${randomUUID()}.webp`, optimized, 'image/webp');
  return { url, kind: 'image', contentType: 'image/webp', bytes: optimized.length, width, height };
}

async function uploadVideo(buffer: Buffer): Promise<MediaUploadResult> {
  if (buffer.length > MAX_VIDEO_BYTES) {
    throw new BadRequestError(`Video exceeds the ${String(MAX_VIDEO_BYTES / 1024 / 1024)}MB limit`);
  }
  const url = await gcsProvider.upload(`products/${randomUUID()}.mp4`, buffer, 'video/mp4');
  return { url, kind: 'video', contentType: 'video/mp4', bytes: buffer.length };
}

/** Dispatch by the sniffed (trusted) type. Rejects anything else. */
async function upload(buffer: Buffer): Promise<MediaUploadResult> {
  assertConfigured();
  if (buffer.length === 0) {
    throw new BadRequestError('Empty file');
  }
  const type = sniffType(buffer);
  if (type === null) {
    throw new BadRequestError('Unsupported file type (allowed: JPEG, PNG, WebP, MP4)');
  }
  return type === 'video/mp4' ? uploadVideo(buffer) : uploadImage(buffer);
}

export const mediaService = { upload };
// Exported for unit tests.
export const _internal = { sniffType, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES };
