/**
 * Inventory routes (Milestone 1.3b) — admin only, mounted at
 * /api/v1/admin/inventory. Reads need inventory:read, the adjust needs
 * inventory:write. `/history` (static) is registered before `/:productId`.
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import {
  adjustInventorySchema,
  inventoryHistoryQuerySchema,
  inventoryListQuerySchema,
} from './inventory.validation.js';
import { adminAdjust, adminHistory, adminList } from './inventory.controller.js';

export const inventoryAdminRouter: Router = express.Router();
inventoryAdminRouter.use(requireAuth);
inventoryAdminRouter.get(
  '/',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  validate(inventoryListQuerySchema),
  adminList,
);
inventoryAdminRouter.get(
  '/history',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  validate(inventoryHistoryQuerySchema),
  adminHistory,
);
inventoryAdminRouter.patch(
  '/:productId',
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  validate(adjustInventorySchema),
  adminAdjust,
);
