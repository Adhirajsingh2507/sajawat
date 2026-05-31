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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  exposedHeaders: ['x-request-id'],
  maxAge: 600,
};

export const corsMiddleware: RequestHandler = cors(corsOptions);
