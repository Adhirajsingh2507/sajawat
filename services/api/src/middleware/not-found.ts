/**
 * Terminal 404 handler — any request that falls through all routes is converted
 * into a NotFoundError and forwarded to the global error handler, so unknown
 * routes return the standard error envelope (not Express's HTML default).
 */
import type { RequestHandler } from 'express';
import { NotFoundError } from '../errors/app-error.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
