/**
 * Admin media service (Milestone 1.3-media) — wraps POST /admin/media. Sends the
 * raw file as multipart; the API validates, optimizes images (sharp → WebP),
 * and returns a durable public URL. Returns 501 when GCS is unconfigured (the
 * ProductForm keeps a manual URL fallback for that case).
 */
import { apiUpload } from '@/lib/api';
import type { MediaUploadResult } from '@sajawat/types';

export function uploadMedia(file: File): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append('file', file);
  return apiUpload<MediaUploadResult>('/admin/media', form);
}
