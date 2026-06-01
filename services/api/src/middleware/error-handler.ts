/**
 * Global error handler — the single place that turns a thrown/forwarded error
 * into an HTTP response. Express 5 forwards rejected async handlers here
 * automatically, so controllers can simply `throw`.
 *
 * - Known `AppError`s pass through with their status/code.
 * - `ZodError`s (e.g. from manual `.parse()`) become `VALIDATION_ERROR`.
 * - Anything else is treated as a non-operational `InternalServerError` and its
 *   message is masked in production.
 */
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import {
  AppError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  ValidationError,
  clientErrorCode,
  type ErrorDetail,
} from '../errors/app-error.js';
import { buildErrorEnvelope } from '../http/respond.js';
import { isProduction } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * `http-errors`-shaped error (thrown by body-parser et al.): a 4xx with
 * `expose === true` is safe, client-caused input error — not a server bug.
 */
interface ExposedHttpError {
  status: number;
  message: string;
}

function asExposedClientError(err: unknown): ExposedHttpError | null {
  if (typeof err !== 'object' || err === null) {
    return null;
  }
  const candidate = err as Record<string, unknown>;
  if (candidate.expose !== true) {
    return null;
  }
  const rawStatus =
    typeof candidate.statusCode === 'number'
      ? candidate.statusCode
      : typeof candidate.status === 'number'
        ? candidate.status
        : undefined;
  if (rawStatus === undefined || rawStatus < 400 || rawStatus >= 500) {
    return null;
  }
  const message = typeof candidate.message === 'string' ? candidate.message : 'Bad request';
  return { status: rawStatus, message };
}

/** Native MongoDB duplicate-key errors surface as `{ code: 11000 }`. */
function isDuplicateKeyError(
  err: unknown,
): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as Record<string, unknown>).code === 11000;
}

/**
 * Normalize Mongoose/MongoDB errors into the AppError hierarchy so every domain
 * module (0.6+) inherits consistent mapping (AD-8). Returns null if `err` is not
 * a database error.
 */
function mongooseToAppError(err: unknown): AppError | null {
  if (err instanceof mongoose.Error.ValidationError) {
    const details: ErrorDetail[] = Object.values(err.errors).map((fieldError) => ({
      path: fieldError.path,
      message: fieldError.message,
    }));
    return new ValidationError(details);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new BadRequestError(`Invalid value for "${err.path}"`);
  }
  if (err instanceof mongoose.Error.DocumentNotFoundError) {
    return new NotFoundError();
  }
  if (isDuplicateKeyError(err)) {
    const fields = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    return new ConflictError(`Duplicate value for ${fields}`);
  }
  return null;
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }
  if (err instanceof ZodError) {
    const details: ErrorDetail[] = err.issues.map((issue) => ({
      path: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    return new ValidationError(details);
  }
  const mongoErr = mongooseToAppError(err);
  if (mongoErr) {
    return mongoErr;
  }
  const exposed = asExposedClientError(err);
  if (exposed) {
    return new AppError(exposed.status, clientErrorCode(exposed.status), exposed.message);
  }
  return new InternalServerError();
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // If the response has already started streaming, defer to Express's default
  // handler to close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = toAppError(err);
  const log = req.log ?? logger;
  const logContext = { err, code: appError.code, statusCode: appError.statusCode };

  if (appError.isOperational) {
    log.warn(logContext, appError.message);
  } else {
    log.error(logContext, 'Unhandled error');
  }

  const message =
    !appError.isOperational && isProduction ? 'Internal server error' : appError.message;
  const body = buildErrorEnvelope(res, appError.code, message, appError.details);
  res.status(appError.statusCode).json(body);
};
