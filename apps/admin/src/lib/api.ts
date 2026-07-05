/**
 * Browser API client (Milestone 1.7) — mirrors the storefront client. Sends
 * credentials (refresh cookie), attaches the in-memory Bearer access token and
 * the readable CSRF token, and unwraps the `{ success, data | error }` envelope.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

let accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = new RegExp(`(?:^|; )${name}=([^;]*)`).exec(document.cookie);
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const csrf = readCookie('sajawat_csrf');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken !== null ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(csrf !== null ? { 'x-csrf-token': csrf } : {}),
      ...options.headers,
    },
  });
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || json === null || json.success === false) {
    throw new ApiError(json?.error?.message ?? 'Request failed', res.status, json?.error?.code);
  }
  return json.data as T;
}

/**
 * Multipart upload variant — sends a `FormData` body WITHOUT a JSON
 * `Content-Type` so the browser sets the multipart boundary itself. Shares the
 * auth/CSRF/envelope handling with `apiFetch`.
 */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const csrf = readCookie('sajawat_csrf');
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers: {
      ...(accessToken !== null ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(csrf !== null ? { 'x-csrf-token': csrf } : {}),
    },
  });
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || json === null || json.success === false) {
    throw new ApiError(json?.error?.message ?? 'Upload failed', res.status, json?.error?.code);
  }
  return json.data as T;
}
