import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  clientErrorCode,
} from './app-error.js';

describe('clientErrorCode', () => {
  it.each([
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [413, 'PAYLOAD_TOO_LARGE'],
    [415, 'UNSUPPORTED_MEDIA_TYPE'],
    [429, 'TOO_MANY_REQUESTS'],
    [418, 'BAD_REQUEST'], // default
  ])('maps %i → %s', (status, code) => {
    expect(clientErrorCode(status)).toBe(code);
  });
});

describe('AppError hierarchy', () => {
  it('carries status, code, and operational flag', () => {
    const err = new BadRequestError('nope');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.isOperational).toBe(true);
  });

  it('marks 5xx server errors non-operational', () => {
    expect(new InternalServerError().isOperational).toBe(false);
  });

  it('ServiceUnavailableError is 503 and operational', () => {
    const err = new ServiceUnavailableError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('SERVICE_UNAVAILABLE');
    expect(err.isOperational).toBe(true);
  });

  it('subclasses use their canonical status codes', () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new TooManyRequestsError().statusCode).toBe(429);
  });
});
