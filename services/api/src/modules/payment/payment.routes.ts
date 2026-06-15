/**
 * Payment webhook routes (Milestone 1.6b) — mounted at /api/v1/webhooks.
 * PUBLIC (Razorpay calls it); authenticated by signature, not by a token.
 */
import express from 'express';
import type { Router } from 'express';
import { razorpayWebhook } from './payment.controller.js';

export const webhookRouter: Router = express.Router();
webhookRouter.post('/razorpay', razorpayWebhook);
