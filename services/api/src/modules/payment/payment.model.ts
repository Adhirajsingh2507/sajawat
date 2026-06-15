/**
 * Payment model (Milestone 1.6b).
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IPayment } from './payment.types.js';

const { Schema } = mongoose;

const paymentSchema = new Schema<IPayment>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  provider: { type: String, required: true },
  providerOrderId: { type: String, required: true },
  transactionId: { type: String, default: null },
  signature: { type: String, default: null },
  status: { type: String, enum: ['created', 'captured', 'failed'], default: 'created' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true },
});

paymentSchema.plugin(baseSchemaPlugin);
paymentSchema.index({ providerOrderId: 1 }, { unique: true });
paymentSchema.index({ orderId: 1 });

export const Payment: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment> | undefined) ??
  mongoose.model<IPayment>('Payment', paymentSchema);
