/**
 * Payment types (Milestone 1.6b) — one record per gateway attempt. Only safe
 * references are stored (no card data): provider order/payment ids + signature.
 */
import type { Types } from 'mongoose';

export type PaymentRecordStatus = 'created' | 'captured' | 'failed';

export interface IPayment {
  orderId: Types.ObjectId | string;
  provider: string;
  providerOrderId: string;
  transactionId?: string | null;
  signature?: string | null;
  status: PaymentRecordStatus;
  amount: number;
  currency: string;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
