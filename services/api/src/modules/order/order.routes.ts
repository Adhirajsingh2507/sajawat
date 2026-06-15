/**
 * Order + checkout routes (Milestone 1.6a) — all require auth.
 *  - /api/v1/checkout/cod  → place a COD order
 *  - /api/v1/orders        → customer order history (list / detail / cancel)
 * Razorpay online routes (POST /checkout, /checkout/verify-payment) arrive in 1.6b.
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import {
  adminOrderListQuerySchema,
  codCheckoutSchema,
  idParamSchema,
  orderListQuerySchema,
  updateOrderPaymentSchema,
  updateOrderStatusSchema,
  verifyPaymentSchema,
} from './order.validation.js';
import {
  adminGet,
  adminList,
  adminUpdatePayment,
  adminUpdateStatus,
  cancelMine,
  checkoutCod,
  checkoutOnline,
  getMine,
  listMine,
  verifyPayment,
} from './order.controller.js';

export const checkoutRouter: Router = express.Router();
checkoutRouter.use(requireAuth);
checkoutRouter.post('/cod', validate(codCheckoutSchema), checkoutCod);
checkoutRouter.post('/', validate(codCheckoutSchema), checkoutOnline);
checkoutRouter.post('/verify-payment', validate(verifyPaymentSchema), verifyPayment);

export const ordersRouter: Router = express.Router();
ordersRouter.use(requireAuth);
ordersRouter.get('/', validate(orderListQuerySchema), listMine);
ordersRouter.get('/:id', validate(idParamSchema), getMine);
ordersRouter.post('/:id/cancel', validate(idParamSchema), cancelMine);

export const orderAdminRouter: Router = express.Router();
orderAdminRouter.use(requireAuth);
orderAdminRouter.get(
  '/',
  requirePermission(PERMISSIONS.ORDER_READ),
  validate(adminOrderListQuerySchema),
  adminList,
);
orderAdminRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.ORDER_READ),
  validate(idParamSchema),
  adminGet,
);
orderAdminRouter.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  validate(updateOrderStatusSchema),
  adminUpdateStatus,
);
orderAdminRouter.patch(
  '/:id/payment',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  validate(updateOrderPaymentSchema),
  adminUpdatePayment,
);
