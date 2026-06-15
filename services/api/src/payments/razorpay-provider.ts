/**
 * Razorpay provider (Milestone 1.6b) — implemented with `fetch` + `node:crypto`
 * (no SDK dependency). Config-gated: unconfigured → `isConfigured() === false`
 * and the order service returns 501 for online checkout.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import type { CreatedProviderOrder, PaymentProvider } from './payment-provider.js';

function hmacHex(secret: string, data: string | Buffer): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  return aBuf.length === bBuf.length && aBuf.length > 0 && timingSafeEqual(aBuf, bBuf);
}

interface RazorpayOrderResponse {
  id?: unknown;
  amount?: unknown;
  currency?: unknown;
}

class RazorpayProvider implements PaymentProvider {
  isConfigured(): boolean {
    return env.RAZORPAY_KEY_ID !== undefined && env.RAZORPAY_KEY_SECRET !== undefined;
  }

  publicKeyId(): string | null {
    return env.RAZORPAY_KEY_ID ?? null;
  }

  async createOrder(
    amountMinor: number,
    currency: string,
    receipt: string,
  ): Promise<CreatedProviderOrder> {
    const keyId = env.RAZORPAY_KEY_ID;
    const secret = env.RAZORPAY_KEY_SECRET;
    if (keyId === undefined || secret === undefined) {
      throw new Error('Razorpay is not configured');
    }
    const auth = Buffer.from(`${keyId}:${secret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: amountMinor, currency, receipt }),
    });
    if (!res.ok) {
      throw new Error(`Razorpay order creation failed (${String(res.status)})`);
    }
    const json = (await res.json()) as RazorpayOrderResponse;
    if (typeof json.id !== 'string') {
      throw new Error('Razorpay returned no order id');
    }
    return {
      providerOrderId: json.id,
      amount: typeof json.amount === 'number' ? json.amount : amountMinor,
      currency: typeof json.currency === 'string' ? json.currency : currency,
    };
  }

  verifyPaymentSignature(providerOrderId: string, paymentId: string, signature: string): boolean {
    const secret = env.RAZORPAY_KEY_SECRET;
    if (secret === undefined) return false;
    return safeEqualHex(hmacHex(secret, `${providerOrderId}|${paymentId}`), signature);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (secret === undefined) return false;
    return safeEqualHex(hmacHex(secret, rawBody), signature);
  }
}

export const razorpayProvider: PaymentProvider = new RazorpayProvider();
