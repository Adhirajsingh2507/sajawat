/**
 * Express application factory.
 *
 * Builds and wires the app without binding a port, so the same instance can be
 * driven by the HTTP server (src/index.ts) and, later, by Supertest (0.9).
 *
 * Middleware order is deliberate:
 *   1. request logger + request id   (so everything downstream is traced)
 *   2. body parsers
 *   3. routes (liveness, then versioned API)
 *   4. 404 handler
 *   5. global error handler          (must be last)
 */
import express from 'express';
import type { Application } from 'express';
import { requestLogger } from './middleware/request-logger.js';
import { healthRouter } from './routes/health.routes.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp(): Application {
  const app = express();

  // Hardening / platform.
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  // Observability.
  app.use(requestLogger);

  // Body parsing (bounded to mitigate large-payload abuse).
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Liveness probe — minimal, unversioned, dependency-free (for Cloud Run / LB).
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Versioned API surface.
  app.use('/api/v1/health', healthRouter);

  // Fall-through 404, then the single global error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
