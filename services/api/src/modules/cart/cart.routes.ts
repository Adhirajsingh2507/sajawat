/**
 * Cart routes (Milestone 1.5b) — mounted at /api/v1/cart; all require auth.
 * Static `/apply-coupon` and `/coupon` are registered before `/items/:productId`.
 */
import express from 'express';
import type { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  addItemSchema,
  applyCouponSchema,
  productIdParamSchema,
  updateItemSchema,
} from './cart.validation.js';
import {
  addItem,
  applyCoupon,
  getCart,
  removeCoupon,
  removeItem,
  updateItem,
} from './cart.controller.js';

export const cartRouter: Router = express.Router();
cartRouter.use(requireAuth);
cartRouter.get('/', getCart);
cartRouter.post('/items', validate(addItemSchema), addItem);
cartRouter.patch('/items/:productId', validate(updateItemSchema), updateItem);
cartRouter.delete('/items/:productId', validate(productIdParamSchema), removeItem);
cartRouter.post('/apply-coupon', validate(applyCouponSchema), applyCoupon);
cartRouter.delete('/coupon', removeCoupon);
