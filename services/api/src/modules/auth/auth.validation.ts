/**
 * Auth request schemas (Milestone 1.2). Parsed by the `validate` middleware into
 * `req.validatedData`. Reuses the shared `passwordSchema` so the policy is
 * identical across API and (future) UI.
 */
import { z } from 'zod';
import { passwordSchema } from '@sajawat/shared';

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254),
    password: passwordSchema,
    phone: z.string().trim().max(20).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  }),
});

export const googleSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
export type GoogleBody = z.infer<typeof googleSchema>['body'];
