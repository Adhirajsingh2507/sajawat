/**
 * Auth middleware (Milestone 0.7).
 *
 * - `requireAuth`        — verify the Bearer access token, attach `req.user`.
 * - `requireRole(...)`   — allow only the listed roles.
 * - `requirePermission(...)` — allow only roles granted ALL listed permissions
 *                              (resolved via the centralized RBAC matrix).
 *
 * All denials flow through the standard error envelope (401/403) via the global
 * error handler. These are route-level guards — never mounted globally.
 */
import type { RequestHandler } from 'express';
import type { Role, Permission } from '@sajawat/shared';
import { hasPermission } from '@sajawat/shared';
import { verifyAccessToken } from '../auth/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';

function extractBearerToken(header: string | undefined): string {
  if (header === undefined || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }
  const token = header.slice('Bearer '.length).trim();
  if (token.length === 0) {
    throw new UnauthorizedError('Missing bearer token');
  }
  return token;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  let token: string;
  try {
    token = extractBearerToken(req.get('authorization'));
  } catch (err) {
    next(err);
    return;
  }
  // Verify is async (jose); handle resolution/rejection without floating.
  void verifyAccessToken(token)
    .then((claims) => {
      req.user = { id: claims.sub, role: claims.role };
      next();
    })
    .catch(next);
};

export function requireRole(...roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = req.user;
    if (user === undefined) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}

export function requirePermission(...permissions: readonly Permission[]): RequestHandler {
  return (req, _res, next) => {
    const user = req.user;
    if (user === undefined) {
      next(new UnauthorizedError());
      return;
    }
    const granted = permissions.every((permission) => hasPermission(user.role, permission));
    if (!granted) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
