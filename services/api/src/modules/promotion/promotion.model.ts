/**
 * Promotion model (Milestone 1.5a). `code` has a sparse-unique index so only
 * coupon promotions (which carry a code) are constrained; automatic promotions
 * omit it. baseSchemaPlugin + soft-delete.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IPromotion } from './promotion.types.js';

const { Schema } = mongoose;

const promotionSchema = new Schema<IPromotion>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  trigger: { type: String, enum: ['automatic', 'coupon'], required: true },
  code: { type: String, uppercase: true, trim: true, maxlength: 40 },
  rewardType: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  minCartValue: { type: Number, required: true, default: 0, min: 0 },
  maxDiscount: { type: Number, default: null, min: 0 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  usageLimit: { type: Number, default: null, min: 0 },
  perCustomerLimit: { type: Number, default: null, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  deletedAt: { type: Date, default: null },
});

promotionSchema.plugin(baseSchemaPlugin);

promotionSchema.index({ code: 1 }, { unique: true, sparse: true });
promotionSchema.index({ trigger: 1, status: 1 });

export const Promotion: Model<IPromotion> =
  (mongoose.models.Promotion as Model<IPromotion> | undefined) ??
  mongoose.model<IPromotion>('Promotion', promotionSchema);
