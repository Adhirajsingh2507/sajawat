/**
 * Payment webhook controller (Milestone 1.6b) — PUBLIC endpoint, verified by the
 * raw-body HMAC signature inside the service (no auth middleware).
 */
import type { RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { orderService } from '../order/order.service.js';

export const razorpayWebhook: RequestHandler = asyncHandler(async (req, res) => {
  const signature = req.get('x-razorpay-signature') ?? undefined;
  await orderService.handleRazorpayWebhook(req.rawBody ?? Buffer.alloc(0), signature);
  sendSuccess(res, { received: true });
});
