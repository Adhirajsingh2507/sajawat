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

const addressSchema = z.object({
  fullName: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(20).optional(),
  line1: z.string().trim().max(200).optional(),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
});

/** Self-service profile update (PATCH /auth/me). All fields optional. */
export const updateProfileSchema = z.object({
  body: z
    .object({
      firstName: z.string().trim().min(1).max(80).optional(),
      lastName: z.string().trim().min(1).max(80).optional(),
      phone: z.string().trim().max(20).optional(),
      address: addressSchema.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Provide at least one field to update' }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
export type GoogleBody = z.infer<typeof googleSchema>['body'];
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>['body'];
