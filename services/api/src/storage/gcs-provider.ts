/**
 * Google Cloud Storage provider (Milestone 1.3-media).
 *
 * Config-gated like the Razorpay/WhatsApp providers: when `GCS_BUCKET` is unset,
 * `isConfigured()` is false and the media endpoints return 501 (the admin keeps
 * the manual image-URL fallback). Credentials come from Application Default
 * Credentials — on Cloud Run that is the runtime service account, so no key file
 * is ever handled. The client is created lazily so an unconfigured / local API
 * never constructs it.
 *
 * Objects are written to a PUBLIC bucket (uniform bucket-level access), so the
 * returned URL is a durable public URL — no per-object ACL or signed read.
 */
import { Storage } from '@google-cloud/storage';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const DEFAULT_PUBLIC_HOST = 'https://storage.googleapis.com';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

let client: Storage | null = null;

function isConfigured(): boolean {
  return env.GCS_BUCKET !== undefined;
}

function getClient(): Storage {
  client ??= new Storage(env.GCS_PROJECT_ID !== undefined ? { projectId: env.GCS_PROJECT_ID } : {});
  return client;
}

/** Public URL for an object, honoring an optional CDN/custom host override. */
function publicUrl(objectPath: string): string {
  const host = env.GCS_PUBLIC_HOST ?? `${DEFAULT_PUBLIC_HOST}/${env.GCS_BUCKET ?? ''}`;
  return `${host.replace(/\/$/, '')}/${objectPath}`;
}

/**
 * Upload a buffer and return its public URL. Caller owns object-path naming +
 * content validation. `resumable: false` — single-shot upload of an in-memory
 * buffer (we never stream huge multi-GB files here).
 */
async function upload(objectPath: string, buffer: Buffer, contentType: string): Promise<string> {
  if (!isConfigured()) {
    throw new Error('GCS is not configured');
  }
  const bucket = getClient().bucket(env.GCS_BUCKET as string);
  await bucket.file(objectPath).save(buffer, {
    resumable: false,
    contentType,
    metadata: { cacheControl: CACHE_CONTROL },
  });
  const url = publicUrl(objectPath);
  logger.info(
    { event: 'media.uploaded', objectPath, contentType, bytes: buffer.length },
    'media.uploaded',
  );
  return url;
}

export const gcsProvider = { isConfigured, upload, publicUrl };
