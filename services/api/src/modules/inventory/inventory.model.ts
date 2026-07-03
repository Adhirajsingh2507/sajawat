/**
 * Inventory model (Milestone 1.3b). 1:1 with Product; no soft-delete (managed
 * operationally). Indexes materialized by scripts/sync-indexes.ts.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IInventory } from './inventory.types.js';

const { Schema } = mongoose;

const inventorySchema = new Schema<IInventory>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  reservedQuantity: { type: Number, required: true, default: 0, min: 0 },
  availableQuantity: { type: Number, required: true, default: 0 },
  lowStockThreshold: { type: Number, required: true, default: 5, min: 0 },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'out_of_stock',
  },
});

inventorySchema.plugin(baseSchemaPlugin);

inventorySchema.index({ productId: 1 }, { unique: true });
inventorySchema.index({ status: 1 });

export const Inventory: Model<IInventory> =
  (mongoose.models.Inventory as Model<IInventory> | undefined) ??
  mongoose.model<IInventory>('Inventory', inventorySchema);
