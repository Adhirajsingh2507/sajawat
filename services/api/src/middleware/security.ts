/**
 * Baseline HTTP security middleware (Milestone 0.4.1).
 *
 * - helmet: sensible secure response headers. CSP is intentionally disabled —
 *   this service returns JSON only, so a content-security-policy belongs to the
 *   Next.js apps (apps/web, apps/admin), not here. `crossOriginResourcePolicy`
 *   is relaxed to `cross-origin` so the browser front-ends may consume the API.
 * - cors: env-driven allow-list (CORS_ORIGINS) with credentials enabled.
 *   Requests with no Origin (curl, server-to-server, health probes) are allowed;
 *   unknown browser origins are rejected silently (no CORS headers) rather than
 *   erroring, so the browser blocks them client-side without a noisy 5xx.
 */
import cors from 'cors';
import helmet from 'helmet';
import type { CorsOptions } from 'cors';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { CSRF_HEADER_NAME } from './csrf.js';

export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

const allowedOrigins = env.CORS_ORIGINS;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (origin === undefined || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // x-csrf-token is REQUIRED: the browser clients attach it (double-submit CSRF)
  // on every request once the csrf cookie exists, so omitting it makes the CORS
  // preflight reject all cross-origin calls (breaks silent-refresh + data fetches
  // for returning users). Caught by the 1.10a browser E2E.
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', CSRF_HEADER_NAME],
  exposedHeaders: ['x-request-id'],
  maxAge: 600,
};

export const corsMiddleware: RequestHandler = cors(corsOptions);
