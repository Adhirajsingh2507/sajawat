/**
 * Versioned health route — `GET /api/v1/health`.
 *
 * Returns an enveloped readiness payload (service identity, environment,
 * uptime). Milestone 0.5 will extend this with a MongoDB connectivity check and
 * a degraded/unhealthy status.
 */
import express from 'express';
import type { Router } from 'express';
import { sendSuccess } from '../http/respond.js';
import { env } from '../config/env.js';

const router: Router = express.Router();

router.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    service: '@sajawat/api',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export const healthRouter = router;
