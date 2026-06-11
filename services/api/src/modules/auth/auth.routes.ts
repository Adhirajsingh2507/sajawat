/**
 * Auth routes (Milestone 1.2) — mounted at `/api/v1/auth`.
 *
 * Credential endpoints (register/login/google) carry the very-strict
 * `authRateLimiter` (brute-force defense). Cookie-authenticated, state-changing
 * routes (refresh/logout) require the CSRF double-submit guard. `me` requires a
 * valid access token. All static paths — no `:param` ordering concerns here.
 */
import express from 'express';
import type { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import { csrfGuard } from '../../middleware/csrf.js';
import { requireAuth } from '../../middleware/auth.js';
import { googleSchema, loginSchema, registerSchema } from './auth.validation.js';
import { google, login, logout, me, refresh, register } from './auth.controller.js';

export const authRouter: Router = express.Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), register);
authRouter.post('/login', authRateLimiter, validate(loginSchema), login);
authRouter.post('/google', authRateLimiter, validate(googleSchema), google);
authRouter.post('/refresh', csrfGuard, refresh);
authRouter.post('/logout', csrfGuard, logout);
authRouter.get('/me', requireAuth, me);
