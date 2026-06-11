/**
 * Async handler wrapper — adapts a Promise-returning handler to Express's
 * `RequestHandler` and forwards rejections to `next` (→ the global error
 * handler). Lets controllers be written as clean `async` functions that simply
 * `throw` AppErrors.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
