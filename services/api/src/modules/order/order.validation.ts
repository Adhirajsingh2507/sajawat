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

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    signature: z.string().min(1),
  }),
});

export const orderListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

const ORDER_STATUS = [
  'created',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'] as const;

export const adminOrderListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(ORDER_STATUS).optional(),
    paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(ORDER_STATUS) }),
});

export const updateOrderPaymentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ paymentStatus: z.enum(PAYMENT_STATUS) }),
});

export type CodCheckoutBody = z.infer<typeof codCheckoutSchema>['body'];
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>['body'];
export type OrderListQuery = z.infer<typeof orderListQuerySchema>['query'];
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>['query'];
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>['body'];
export type UpdateOrderPaymentBody = z.infer<typeof updateOrderPaymentSchema>['body'];
