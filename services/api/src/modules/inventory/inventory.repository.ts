/**
 * Inventory repository (Milestone 1.3b).
 */
import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Inventory } from './inventory.model.js';
import type { IInventory } from './inventory.types.js';

export class InventoryRepository extends BaseRepository<IInventory> {
  constructor() {
    super(Inventory);
  }

  findByProductId(productId: string): Promise<HydratedDocument<IInventory> | null> {
    return this.findOne({ productId });
  }

  findByProductIds(productIds: string[]): Promise<HydratedDocument<IInventory>[]> {
    // `$in` is a deliberate, developer-constructed operator → mark trusted so the
    // global sanitizeFilter (AD-9) does not neutralize it.
    return this.find({ productId: mongoose.trusted({ $in: productIds }) });
  }
}

export const inventoryRepository = new InventoryRepository();
