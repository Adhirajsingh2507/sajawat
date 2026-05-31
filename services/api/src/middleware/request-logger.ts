/**
 * Request logging + request-ID middleware (pino-http).
 *
 * Each request gets a stable id: an inbound `x-request-id` header is honored
 * (so a trace survives across services / a proxy), otherwise a UUID is minted.
 * The id is echoed back in the `x-request-id` response header and attached as
 * `req.id`, which the response envelope and error handler read for `requestId`.
 */
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../config/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const header = req.headers['x-request-id'];
    const id = typeof header === 'string' && header.length > 0 ? header : randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
