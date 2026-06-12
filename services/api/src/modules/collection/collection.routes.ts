/**
 * Collection routes (Milestone 1.3a).
 *  - Public : GET /api/v1/collections, GET /api/v1/collections/:slug
 *  - Admin  : CRUD under /api/v1/admin/collections (requireAuth + COLLECTION_WRITE)
 *
 * Static routes are registered before parameterized ones.
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import {
  createCollectionSchema,
  idParamSchema,
  listQuerySchema,
  slugParamSchema,
  updateCollectionSchema,
} from './collection.validation.js';
import {
  adminCreate,
  adminGetById,
  adminList,
  adminRemove,
  adminUpdate,
  getBySlug,
  listPublic,
} from './collection.controller.js';

export const collectionRouter: Router = express.Router();
collectionRouter.get('/', validate(listQuerySchema), listPublic);
collectionRouter.get('/:slug', validate(slugParamSchema), getBySlug);

export const collectionAdminRouter: Router = express.Router();
collectionAdminRouter.use(requireAuth, requirePermission(PERMISSIONS.COLLECTION_WRITE));
collectionAdminRouter.get('/', validate(listQuerySchema), adminList);
collectionAdminRouter.post('/', validate(createCollectionSchema), adminCreate);
collectionAdminRouter.get('/:id', validate(idParamSchema), adminGetById);
collectionAdminRouter.patch('/:id', validate(updateCollectionSchema), adminUpdate);
collectionAdminRouter.delete('/:id', validate(idParamSchema), adminRemove);
