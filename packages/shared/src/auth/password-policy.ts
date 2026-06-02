/**
 * Password policy (Milestone 0.7). Shared so the API enforces it and the future
 * UI can mirror the rules. Per security-design: minimum 8 characters; complexity
 * recommended. We require a light baseline (letter + number) and bound the upper
 * length to protect the Argon2 hasher from oversized-input abuse.
 */
import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export type Password = z.infer<typeof passwordSchema>;
