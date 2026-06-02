/**
 * Shared test helpers (Milestone 0.9). Token/app factories — entity factories
 * (faker) arrive in Phase 1 with the first Mongoose models.
 */
import express from 'express';
import type { Express } from 'express';
import cookieParser from 'cookie-parser';
import type { Role } from '@sajawat/shared';
import { errorHandler } from '../src/middleware/error-handler.js';
import { signAccessToken } from '../src/auth/jwt.js';

/** Build a minimal app (json + cookies + caller routes + global error handler). */
export function makeApp(mount: (app: Express) => void): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  mount(app);
  app.use(errorHandler);
  return app;
}

export function accessTokenFor(role: Role, sub = 'user-1'): Promise<string> {
  return signAccessToken({ sub, role });
}
