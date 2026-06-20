/**
 * Settings request schemas (Milestone 1.8). All fields optional (partial patch).
 * `adminWhatsappNumber` accepts an E.164-ish string or '' to clear it.
 */
import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    businessName: z.string().trim().max(200).optional(),
    supportEmail: z.string().trim().email().max(200).optional(),
    adminWhatsappNumber: z
      .string()
      .trim()
      .max(20)
      .regex(/^(\+?[0-9]{8,15})?$/, 'Must be a phone number in E.164 form, or empty to clear')
      .optional(),
  }),
});

export type UpdateSettingsBody = z.infer<typeof updateSettingsSchema>['body'];
