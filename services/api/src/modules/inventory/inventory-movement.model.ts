/**
 * Inventory movement model (Milestone 1.3b) — append-only audit trail; never
 * updated or deleted. Indexes materialized by scripts/sync-indexes.ts.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IInventoryMovement } from './inventory-movement.types.js';

const { Schema } = mongoose;

const movementSchema = new Schema<IInventoryMovement>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: {
    type: String,
    enum: ['stock_added', 'stock_removed', 'order', 'manual_adjustment', 'return'],
    required: true,
  },
  quantity: { type: Number, required: true },
  reason: { type: String, trim: true, maxlength: 500 },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

movementSchema.plugin(baseSchemaPlugin);

movementSchema.index({ productId: 1, createdAt: -1 });
movementSchema.index({ type: 1 });

export const InventoryMovement: Model<IInventoryMovement> =
  (mongoose.models.InventoryMovement as Model<IInventoryMovement> | undefined) ??
  mongoose.model<IInventoryMovement>('InventoryMovement', movementSchema);
