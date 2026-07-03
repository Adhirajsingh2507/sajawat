/**
 * Express type augmentation.
 *
 * Express 5 exposes `req.query` / `req.params` as read-only getters, so
 * validated input is written to `req.validatedData` instead of mutating the
 * request. (`req.id` and `req.log` are contributed by pino-http's own http
 * module augmentation and are not redeclared here.)
 *
 * `req.user` (0.7) is populated by `requireAuth` after verifying the access token.
 */
import type { Role } from '@sajawat/shared';

export interface ValidatedData {
  body: unknown;
  query: unknown;
  params: unknown;
}

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      validatedData?: ValidatedData;
      user?: AuthUser;
      /** Raw request body buffer (captured for webhook signature verification). */
      rawBody?: Buffer;
    }
  }
}
