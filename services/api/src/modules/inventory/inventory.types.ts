/**
 * Inventory types (Milestone 1.3b). One inventory row per product (1:1).
 * `availableQuantity = quantity − reservedQuantity` (recomputed server-side);
 * `reservedQuantity` is only touched at checkout (1.6).
 */
import type { Types } from 'mongoose';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface IInventory {
  productId: Types.ObjectId | string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AdminInventory {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  updatedAt?: Date | undefined;
}
