/**
 * Wishlist types (Milestone 1.5b). One private wishlist per user.
 */
import type { Types } from 'mongoose';

export interface IWishlist {
  userId: Types.ObjectId | string;
  productIds: (Types.ObjectId | string)[];
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
