/**
 * Order + checkout routes (Milestone 1.6a) — all require auth.
 *  - /api/v1/checkout/cod  → place a COD order
 *  - /api/v1/orders        → customer order history (list / detail / cancel)
 * Razorpay online routes (POST /checkout, /checkout/verify-payment) arrive in 1.6b.
 */
import express from 'express';
import type { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  codCheckoutSchema,
  idParamSchema,
  orderListQuerySchema,
  verifyPaymentSchema,
} from './order.validation.js';
import {
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
