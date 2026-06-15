/**
 * Promotion controllers (Milestone 1.5a) — admin-only HTTP adapters.
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { promotionService } from './promotion.service.js';
import type {
  CreatePromotionBody,
  PromotionListQuery,
  UpdatePromotionBody,
} from './promotion.validation.js';

export const adminList: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as PromotionListQuery;
  sendSuccess(res, await promotionService.listAdmin(query));
});

export const adminGetById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  sendSuccess(res, await promotionService.getByIdAdmin(id));
});

export const adminCreate: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as CreatePromotionBody;
  sendSuccess(res, await promotionService.create(body), 201);
});

export const adminUpdate: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  const body = req.validatedData?.body as UpdatePromotionBody;
  sendSuccess(res, await promotionService.update(id, body));
});

export const adminRemove: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  await promotionService.remove(id);
  sendSuccess(res, { deleted: true });
});
