/**
 * Response wrapper — every API response shares one envelope shape so clients
 * can branch on `success` and always find `meta.requestId` for tracing.
 *
 *   success: { success: true, data, meta }
 *   error:   { success: false, error: { code, message, details? }, meta }
 *
 * The error envelope is produced by the global error handler; this module
 * provides the success path.
 */
import type { Response } from 'express';
import type { ErrorCode, ErrorDetail } from '../errors/app-error.js';

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
  meta: ResponseMeta;
}

function requestIdOf(res: Response): string {
  // pino-http types `req.id` as ReqId (string | number | object); our genReqId
  // always assigns a string, but narrow defensively to avoid "[object Object]".
  const id: unknown = res.req.id;
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  return '';
}

function meta(res: Response): ResponseMeta {
  return {
    requestId: requestIdOf(res),
    timestamp: new Date().toISOString(),
  };
}

/** Send a successful, enveloped JSON response. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const body: SuccessEnvelope<T> = {
    success: true,
    data,
    meta: meta(res),
  };
  return res.status(statusCode).json(body);
}

/** Build an error envelope (used by the global error handler). */
export function buildErrorEnvelope(
  res: Response,
  code: ErrorCode,
  message: string,
  details?: ErrorDetail[],
): ErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    meta: meta(res),
  };
}
