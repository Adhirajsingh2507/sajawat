/**
 * Order model (Milestone 1.6). Embedded item/address/promotion snapshots.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import type { OrderAddress } from '@sajawat/types';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IOrder, IOrderItem, IOrderPromotion } from './order.types.js';

const { Schema } = mongoose;

const itemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSchema = new Schema<OrderAddress>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { _id: false },
);

const promotionSchema = new Schema<IOrderPromotion>(
  {
    promotionId: { type: String, required: true },
    label: { type: String, required: true },
    code: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['created', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'created',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: { type: String, enum: ['cod', 'online'], required: true },
  items: { type: [itemSchema], required: true },
  address: { type: addressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, default: 0, min: 0 },
  shipping: { type: Number, required: true, default: 0, min: 0 },
  tax: { type: Number, required: true, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  appliedPromotion: { type: promotionSchema, default: null },
  notes: { type: String, default: null, maxlength: 1000 },
});

orderSchema.plugin(baseSchemaPlugin);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'appliedPromotion.promotionId': 1 });

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder> | undefined) ??
  mongoose.model<IOrder>('Order', orderSchema);
