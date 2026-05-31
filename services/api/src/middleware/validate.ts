/**
 * Zod validation middleware.
 *
 * Validates `{ body, query, params }` against a schema. On success the parsed
 * (and coerced) result is written to `req.validatedData` — never back onto
 * `req.query` / `req.params`, which are read-only in Express 5. On failure a
 * `ValidationError` is forwarded to the global error handler with per-field
 * details.
 */
import type { z } from 'zod';
import type { RequestHandler } from 'express';
import { ValidationError, type ErrorDetail } from '../errors/app-error.js';

/** A schema that parses the validatable parts of a request. */
export type RequestSchema = z.ZodType<{
  body?: unknown;
  query?: unknown;
  params?: unknown;
}>;

export function validate(schema: RequestSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body as unknown,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const details: ErrorDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      }));
      next(new ValidationError(details));
      return;
    }

    req.validatedData = {
      body: result.data.body,
      query: result.data.query,
      params: result.data.params,
    };
    next();
  };
}
