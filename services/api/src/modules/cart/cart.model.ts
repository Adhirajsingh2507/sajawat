/**
 * Cart model (Milestone 1.5b). One per user (unique). Embedded items.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { ICart, ICartItem } from './cart.types.js';

const { Schema } = mongoose;

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const cartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [cartItemSchema], default: [] },
  couponCode: { type: String, default: null },
});

cartSchema.plugin(baseSchemaPlugin);
cartSchema.index({ userId: 1 }, { unique: true });

export const Cart: Model<ICart> =
  (mongoose.models.Cart as Model<ICart> | undefined) ?? mongoose.model<ICart>('Cart', cartSchema);
