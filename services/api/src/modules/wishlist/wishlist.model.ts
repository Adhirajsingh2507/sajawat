/**
 * Wishlist model (Milestone 1.5b). One per user (unique).
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IWishlist } from './wishlist.types.js';

const { Schema } = mongoose;

const wishlistSchema = new Schema<IWishlist>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productIds: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
});

wishlistSchema.plugin(baseSchemaPlugin);
wishlistSchema.index({ userId: 1 }, { unique: true });

export const Wishlist: Model<IWishlist> =
  (mongoose.models.Wishlist as Model<IWishlist> | undefined) ??
  mongoose.model<IWishlist>('Wishlist', wishlistSchema);
