/**
 * Category routes (Milestone 1.3a).
 *  - Public  : GET /api/v1/categories, GET /api/v1/categories/:slug
 *  - Admin   : CRUD under /api/v1/admin/categories (requireAuth + CATEGORY_WRITE)
 *
 * Static routes are registered before parameterized ones.
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import {
  createCategorySchema,
  idParamSchema,
  listQuerySchema,
  slugParamSchema,
  updateCategorySchema,
} from './category.validation.js';
import {
  adminCreate,
  adminGetById,
  adminList,
  adminRemove,
  adminUpdate,
  getBySlug,
  listPublic,
} from './category.controller.js';

export const categoryRouter: Router = express.Router();
categoryRouter.get('/', validate(listQuerySchema), listPublic);
categoryRouter.get('/:slug', validate(slugParamSchema), getBySlug);

export const categoryAdminRouter: Router = express.Router();
categoryAdminRouter.use(requireAuth, requirePermission(PERMISSIONS.CATEGORY_WRITE));
categoryAdminRouter.get('/', validate(listQuerySchema), adminList);
categoryAdminRouter.post('/', validate(createCategorySchema), adminCreate);
categoryAdminRouter.get('/:id', validate(idParamSchema), adminGetById);
categoryAdminRouter.patch('/:id', validate(updateCategorySchema), adminUpdate);
categoryAdminRouter.delete('/:id', validate(idParamSchema), adminRemove);
