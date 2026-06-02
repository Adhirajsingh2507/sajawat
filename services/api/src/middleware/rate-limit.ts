/**
 * Rate limiting (Milestone 0.4.1).
 *
 * `createRateLimiter` is a factory so stricter, route-specific limiters (e.g.
 * auth/OTP in 0.7) can be built from the same defaults. `globalRateLimiter`
 * applies a per-IP limit across the whole API and skips the health endpoints so
 * liveness/readiness probes are never throttled.
 *
 * Exceeded limits are funneled through the standard error envelope as
 * 429 TOO_MANY_REQUESTS via the global error handler.
 *
 * Note: accurate client IPs require `trust proxy` (set in app.ts) behind
 * Cloud Run / a proxy.
 */
import { rateLimit } from 'express-rate-limit';
import type { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/env.js';
import { TooManyRequestsError } from '../errors/app-error.js';

export function createRateLimiter(overrides: Partial<Options> = {}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError());
    },
    ...overrides,
  });
}

export const globalRateLimiter = createRateLimiter({
  skip: (req) => req.path === '/health' || req.path === '/api/v1/health',
});

/**
 * Very strict per-IP limiter for authentication routes (login/register/refresh/
 * OTP, wired in Phase 1). Brute-force defense; account lockout (stateful) is a
 * Phase-1 addition layered on top.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
});
