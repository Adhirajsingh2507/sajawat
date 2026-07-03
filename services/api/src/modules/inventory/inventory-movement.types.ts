/**
 * Inventory movement types (Milestone 1.3b) — the immutable stock-change audit
 * trail. `quantity` is the SIGNED delta applied. `order` movements are written
 * by checkout (1.6); admin adjustments use the other types.
 */
import type { Types } from 'mongoose';

export type MovementType =
  | 'stock_added'
  | 'stock_removed'
  | 'order'
  | 'manual_adjustment'
  | 'return';

export interface IInventoryMovement {
  productId: Types.ObjectId | string;
  type: MovementType;
  /** Signed change applied to quantity (e.g. +10 added, -3 removed). */
  quantity: number;
  reason?: string | undefined;
  performedBy: Types.ObjectId | string;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AdminInventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string | undefined;
  performedBy: string;
  createdAt?: Date | undefined;
}
