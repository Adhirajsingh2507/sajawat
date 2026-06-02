/**
 * CSRF protection (Milestone 0.7, AD-22) — double-submit token.
 *
 * Applied ONLY to cookie-authenticated, state-changing endpoints (refresh /
 * logout). The Bearer-token API surface needs no CSRF guard (browsers don't
 * auto-attach Authorization headers). Combined with the refresh cookie's
 * SameSite=Strict, this gives defense-in-depth.
 *
 * `issueCsrfToken` sets a readable (non-httpOnly) cookie; the client echoes it
 * in the `x-csrf-token` header. The guard compares the two in constant time.
 */
import type { RequestHandler, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { isProduction } from '../config/env.js';
import { ForbiddenError } from '../errors/app-error.js';

export const CSRF_COOKIE_NAME = 'sajawat_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function issueCsrfToken(res: Response): string {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // must be readable by the client to echo into the header
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
  return token;
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export const csrfGuard: RequestHandler = (req, _res, next) => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const cookieToken = cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);
  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    !constantTimeEqual(cookieToken, headerToken)
  ) {
    next(new ForbiddenError('Invalid CSRF token'));
    return;
  }
  next();
};
