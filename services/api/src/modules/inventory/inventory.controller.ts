/**
 * Inventory controllers (Milestone 1.3b) — admin-only HTTP adapters.
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import { inventoryService } from './inventory.service.js';
import type {
  AdjustInventoryBody,
  InventoryHistoryQuery,
  InventoryListQuery,
} from './inventory.validation.js';

export const adminList: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as InventoryListQuery;
  sendSuccess(res, await inventoryService.listAdmin(query));
});

export const adminHistory: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as InventoryHistoryQuery;
  sendSuccess(res, await inventoryService.history(query));
});

export const adminAdjust: RequestHandler = asyncHandler(async (req, res) => {
  const performedBy = req.user?.id;
  if (performedBy === undefined) {
    throw new UnauthorizedError();
  }
  const { productId } = req.validatedData?.params as { productId: string };
  const body = req.validatedData?.body as AdjustInventoryBody;
  sendSuccess(res, await inventoryService.adjust(productId, body, performedBy));
});
