/**
 * Wishlist routes (Milestone 1.5b) — mounted at /api/v1/wishlist; all require auth.
 */
import express from 'express';
import type { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { productIdParamSchema } from './wishlist.validation.js';
import { addItem, getWishlist, removeItem } from './wishlist.controller.js';

export const wishlistRouter: Router = express.Router();
wishlistRouter.use(requireAuth);
wishlistRouter.get('/', getWishlist);
wishlistRouter.post('/:productId', validate(productIdParamSchema), addItem);
wishlistRouter.delete('/:productId', validate(productIdParamSchema), removeItem);
