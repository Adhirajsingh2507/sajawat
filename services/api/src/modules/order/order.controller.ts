/**
 * Order/checkout controllers (Milestone 1.6a) — authenticated; user from req.user.
 */
import type { Request, RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import { orderService } from './order.service.js';
import type { CodCheckoutBody, OrderListQuery } from './order.validation.js';

function userId(req: Request): string {
  const id = req.user?.id;
  if (id === undefined) {
    throw new UnauthorizedError();
  }
  return id;
}

export const checkoutCod: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as CodCheckoutBody;
  sendSuccess(res, await orderService.placeCodOrder(userId(req), body), 201);
});

export const listMine: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as OrderListQuery;
  sendSuccess(res, await orderService.listMine(userId(req), query));
});

export const getMine: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  sendSuccess(res, await orderService.getMine(userId(req), id));
});

export const cancelMine: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  sendSuccess(res, await orderService.cancelMine(userId(req), id));
});
