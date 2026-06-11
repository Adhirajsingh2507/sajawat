/**
 * Refresh-token cookie helpers (Milestone 0.7, AD-17).
 *
 * The refresh token lives in an httpOnly + Secure(-in-prod) + SameSite=Strict
 * cookie scoped to the auth path, so it is unreadable by JS (XSS-safe) and not
 * sent on cross-site requests (CSRF-safe). The access token is NOT a cookie — it
 * travels as a Bearer header.
 */
import type { Response, CookieOptions } from 'express';
import { env, isProduction } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'sajawat_rt';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

const UNIT_MS: Readonly<Record<string, number>> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parse a jose-style duration ("15m", "7d") to milliseconds; 0 if unrecognized. */
export function durationToMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (match === null) {
    return 0;
  }
  const [, amount, unit] = match;
  if (amount === undefined || unit === undefined) {
    return 0;
  }
  return Number(amount) * (UNIT_MS[unit] ?? 0);
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
}
