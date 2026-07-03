/**
 * Payment provider abstraction (Milestone 1.6b) — Razorpay is the Phase-1
 * implementation behind this interface (provider-agnostic per the spec). Amounts
 * are in the currency's MINOR unit (paise for INR).
 */
export interface CreatedProviderOrder {
  providerOrderId: string;
  amount: number;
  currency: string;
}

export interface PaymentProvider {
  isConfigured(): boolean;
  /** Public key id safe to hand to the browser checkout (null if unconfigured). */
  publicKeyId(): string | null;
  createOrder(
    amountMinor: number,
    currency: string,
    receipt: string,
  ): Promise<CreatedProviderOrder>;
  verifyPaymentSignature(providerOrderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}
