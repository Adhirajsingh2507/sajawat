/**
 * Versioned readiness route — `GET /api/v1/health`.
 *
 * Returns an enveloped readiness payload (service identity, environment, uptime)
 * plus a MongoDB connectivity check (Milestone 0.5). Overall status is `healthy`
 * only when the database answers; otherwise the route reports `degraded` and
 * responds **503** so orchestrators/load balancers can route around the instance
 * without affecting the dependency-free liveness probe (`/health`).
 */
import express from 'express';
import type { Router } from 'express';
import { sendSuccess } from '../http/respond.js';
import { env } from '../config/env.js';
import { checkDatabaseHealth } from '../db/index.js';

const router: Router = express.Router();

router.get('/', async (_req, res) => {
  const db = await checkDatabaseHealth();
  const status = db.ok ? 'healthy' : 'degraded';
  const httpStatus = db.ok ? 200 : 503;

  sendSuccess(
    res,
    {
      status,
      service: '@sajawat/api',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      db,
      timestamp: new Date().toISOString(),
    },
    httpStatus,
  );
});

export const healthRouter = router;
