/**
 * CRM routes (Milestone 1.8).
 *  - /api/v1/enquiries       → gated wholesale enquiry (creates a b2b lead)
 *  - /api/v1/admin/crm/leads → staff pipeline (CRM_READ / CRM_WRITE)
 *
 * The enquiry route is auth-gated (D17) and additionally rate-limited to blunt
 * lead spam. Static `/leads` is registered before `/leads/:id`.
 */
import express from 'express';
import type { Router } from 'express';
import { PERMISSIONS } from '@sajawat/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rate-limit.js';
import {
  enquirySchema,
  idParamSchema,
  leadListQuerySchema,
  updateLeadSchema,
} from './crm.validation.js';
import { adminGet, adminList, adminUpdate, submitEnquiry } from './crm.controller.js';

// Tighter per-IP limit for lead submission (spam guard on top of the gate).
const enquiryRateLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 });

export const enquiryRouter: Router = express.Router();
enquiryRouter.use(requireAuth);
enquiryRouter.post('/', enquiryRateLimiter, validate(enquirySchema), submitEnquiry);

export const crmAdminRouter: Router = express.Router();
crmAdminRouter.use(requireAuth);
crmAdminRouter.get(
  '/leads',
  requirePermission(PERMISSIONS.CRM_READ),
  validate(leadListQuerySchema),
  adminList,
);
crmAdminRouter.get(
  '/leads/:id',
  requirePermission(PERMISSIONS.CRM_READ),
  validate(idParamSchema),
  adminGet,
);
crmAdminRouter.patch(
  '/leads/:id',
  requirePermission(PERMISSIONS.CRM_WRITE),
  validate(updateLeadSchema),
  adminUpdate,
);
