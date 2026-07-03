/**
 * Settings routes (Milestone 1.8) — admin only, mounted at /api/v1/admin/settings.
 * RBAC: settings:manage (super_admin).
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { updateSettingsSchema } from './settings.validation.js';
import { getSettings, updateSettings } from './settings.controller.js';

export const settingsAdminRouter: Router = express.Router();
settingsAdminRouter.use(requireAuth, requirePermission(PERMISSIONS.SETTINGS_MANAGE));
settingsAdminRouter.get('/', getSettings);
settingsAdminRouter.patch('/', validate(updateSettingsSchema), updateSettings);
