/**
 * Wishlist controllers (Milestone 1.5b) — authenticated; user from req.user.
 */
import type { Request, RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import { wishlistService } from './wishlist.service.js';

function userId(req: Request): string {
  const id = req.user?.id;
  if (id === undefined) {
    throw new UnauthorizedError();
  }
  return id;
}

export const getWishlist: RequestHandler = asyncHandler(async (req, res) => {
  sendSuccess(res, await wishlistService.getWishlist(userId(req)));
});

export const addItem: RequestHandler = asyncHandler(async (req, res) => {
  const { productId } = req.validatedData?.params as { productId: string };
  sendSuccess(res, await wishlistService.add(userId(req), productId), 201);
});

export const removeItem: RequestHandler = asyncHandler(async (req, res) => {
  const { productId } = req.validatedData?.params as { productId: string };
  sendSuccess(res, await wishlistService.remove(userId(req), productId));
});
