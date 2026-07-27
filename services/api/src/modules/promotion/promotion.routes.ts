/**
 * Promotion routes (Milestone 1.5a) — admin only, mounted at
 * /api/v1/admin/promotions. RBAC: coupon:write (admin, marketing_team).
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import {
  createPromotionSchema,
  idParamSchema,
  promotionListQuerySchema,
  updatePromotionSchema,
} from './promotion.validation.js';
import {
  adminCreate,
  adminGetById,
  adminList,
  adminRemove,
  adminUpdate,
  publicOffers,
} from './promotion.controller.js';

/** Public offers read — mounted at /api/v1/offers (no auth). */
export const promotionRouter: Router = express.Router();
promotionRouter.get('/', publicOffers);

export const promotionAdminRouter: Router = express.Router();
promotionAdminRouter.use(requireAuth, requirePermission(PERMISSIONS.COUPON_WRITE));
promotionAdminRouter.get('/', validate(promotionListQuerySchema), adminList);
promotionAdminRouter.post('/', validate(createPromotionSchema), adminCreate);
promotionAdminRouter.get('/:id', validate(idParamSchema), adminGetById);
promotionAdminRouter.patch('/:id', validate(updatePromotionSchema), adminUpdate);
promotionAdminRouter.delete('/:id', validate(idParamSchema), adminRemove);
