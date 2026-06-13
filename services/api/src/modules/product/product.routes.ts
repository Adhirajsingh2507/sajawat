/**
 * Product routes (Milestone 1.3b).
 *  - Public : GET /api/v1/products (+ /search, /featured, /best-sellers,
 *             /new-arrivals, /:slug)  — active only
 *  - Admin  : CRUD under /api/v1/admin/products (PRODUCT_READ/WRITE/DELETE)
 *
 * CRITICAL: static routes are registered BEFORE /:slug so they are reachable.
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import {
  createProductSchema,
  idParamSchema,
  productListQuerySchema,
  productSearchQuerySchema,
  slugParamSchema,
  updateProductSchema,
} from './product.validation.js';
import {
  adminCreate,
  adminGetById,
  adminList,
  adminRemove,
  adminUpdate,
  bestSellers,
  featured,
  getBySlug,
  listPublic,
  newArrivals,
  search,
} from './product.controller.js';

export const productRouter: Router = express.Router();
productRouter.get('/', validate(productListQuerySchema), listPublic);
productRouter.get('/search', validate(productSearchQuerySchema), search);
productRouter.get('/featured', validate(productListQuerySchema), featured);
productRouter.get('/best-sellers', validate(productListQuerySchema), bestSellers);
productRouter.get('/new-arrivals', validate(productListQuerySchema), newArrivals);
productRouter.get('/:slug', validate(slugParamSchema), getBySlug);

export const productAdminRouter: Router = express.Router();
productAdminRouter.use(requireAuth);
productAdminRouter.get(
  '/',
  requirePermission(PERMISSIONS.PRODUCT_READ),
  validate(productListQuerySchema),
  adminList,
);
productAdminRouter.post(
  '/',
  requirePermission(PERMISSIONS.PRODUCT_WRITE),
  validate(createProductSchema),
  adminCreate,
);
productAdminRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_READ),
  validate(idParamSchema),
  adminGetById,
);
productAdminRouter.patch(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_WRITE),
  validate(updateProductSchema),
  adminUpdate,
);
productAdminRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_DELETE),
  validate(idParamSchema),
  adminRemove,
);
