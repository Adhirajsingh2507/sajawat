/**
 * Order/checkout request schemas (Milestone 1.6a).
 */
import { z } from 'zod';

const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(20),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(1).max(100),
});

export const codCheckoutSchema = z.object({
  body: z.object({
    address: addressSchema,
    notes: z.string().trim().max(1000).optional(),
  }),
});

export const orderListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export type CodCheckoutBody = z.infer<typeof codCheckoutSchema>['body'];
export type OrderListQuery = z.infer<typeof orderListQuerySchema>['query'];
