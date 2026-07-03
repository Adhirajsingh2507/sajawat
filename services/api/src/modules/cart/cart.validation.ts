/**
 * Cart request schemas (Milestone 1.5b).
 */
import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive().max(99).default(1),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  body: z.object({ quantity: z.number().int().nonnegative().max(99) }),
});

export const productIdParamSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
});

export const applyCouponSchema = z.object({
  body: z.object({ code: z.string().trim().min(1).max(40) }),
});

export type AddItemBody = z.infer<typeof addItemSchema>['body'];
export type UpdateItemBody = z.infer<typeof updateItemSchema>['body'];
export type ApplyCouponBody = z.infer<typeof applyCouponSchema>['body'];
