/**
 * Cart types (Milestone 1.5b). One cart per user (no guest checkout).
 * `priceAtAdd` is reference-only — totals are recomputed against live prices.
 */
import type { Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId | string;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart {
  userId: Types.ObjectId | string;
  items: ICartItem[];
  couponCode?: string | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
