/**
 * Express type augmentation.
 *
 * Express 5 exposes `req.query` / `req.params` as read-only getters, so
 * validated input is written to `req.validatedData` instead of mutating the
 * request. (`req.id` and `req.log` are contributed by pino-http's own http
 * module augmentation and are not redeclared here.)
 */

export interface ValidatedData {
  body: unknown;
  query: unknown;
  params: unknown;
}

declare global {
  namespace Express {
    interface Request {
      validatedData?: ValidatedData;
    }
  }
}
