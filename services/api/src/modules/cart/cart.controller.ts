/**
 * Cart controllers (Milestone 1.5b) — authenticated; user resolved from req.user.
 */
import type { Request, RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import { cartService } from './cart.service.js';
import type { AddItemBody, ApplyCouponBody, UpdateItemBody } from './cart.validation.js';

function userId(req: Request): string {
  const id = req.user?.id;
  if (id === undefined) {
    throw new UnauthorizedError();
  }
  return id;
}

export const getCart: RequestHandler = asyncHandler(async (req, res) => {
  sendSuccess(res, await cartService.getCart(userId(req)));
});

export const addItem: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as AddItemBody;
  sendSuccess(res, await cartService.addItem(userId(req), body.productId, body.quantity), 201);
});

export const updateItem: RequestHandler = asyncHandler(async (req, res) => {
  const { productId } = req.validatedData?.params as { productId: string };
  const body = req.validatedData?.body as UpdateItemBody;
  sendSuccess(res, await cartService.updateItem(userId(req), productId, body.quantity));
});

export const removeItem: RequestHandler = asyncHandler(async (req, res) => {
  const { productId } = req.validatedData?.params as { productId: string };
  sendSuccess(res, await cartService.removeItem(userId(req), productId));
});

export const applyCoupon: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as ApplyCouponBody;
  sendSuccess(res, await cartService.applyCoupon(userId(req), body.code));
});

export const removeCoupon: RequestHandler = asyncHandler(async (req, res) => {
  sendSuccess(res, await cartService.removeCoupon(userId(req)));
});
