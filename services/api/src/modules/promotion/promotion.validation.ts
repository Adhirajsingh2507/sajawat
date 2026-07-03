/**
 * Promotion request schemas (Milestone 1.5a).
 */
import { z } from 'zod';

const createBody = z.object({
  name: z.string().trim().min(1).max(120),
  trigger: z.enum(['automatic', 'coupon']),
  code: z.string().trim().min(1).max(40).optional(),
  rewardType: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  minCartValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const createPromotionSchema = z.object({ body: createBody });

export const updatePromotionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    code: z.string().trim().min(1).max(40).optional(),
    rewardType: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().positive().optional(),
    minCartValue: z.number().nonnegative().optional(),
    maxDiscount: z.number().positive().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    usageLimit: z.number().int().positive().optional(),
    perCustomerLimit: z.number().int().positive().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const promotionListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    trigger: z.enum(['automatic', 'coupon']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export type CreatePromotionBody = z.infer<typeof createPromotionSchema>['body'];
export type UpdatePromotionBody = z.infer<typeof updatePromotionSchema>['body'];
export type PromotionListQuery = z.infer<typeof promotionListQuerySchema>['query'];
