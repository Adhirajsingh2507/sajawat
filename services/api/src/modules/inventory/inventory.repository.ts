/**
 * Inventory repository (Milestone 1.3b).
 */
import mongoose from 'mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Inventory } from './inventory.model.js';
import type { IInventory } from './inventory.types.js';

type InventoryFilter = NonNullable<Parameters<Model<IInventory>['findOneAndUpdate']>[0]>;

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

  /**
   * Atomically decrement stock IFF enough is available (no-oversell guard).
   * Returns the updated doc, or null when insufficient stock / no row.
   */
  decrementIfAvailable(
    productId: string,
    quantity: number,
  ): Promise<HydratedDocument<IInventory> | null> {
    const filter = {
      productId,
      availableQuantity: mongoose.trusted({ $gte: quantity }),
    } as unknown as InventoryFilter;
    return this.model
      .findOneAndUpdate(
        filter,
        { $inc: { quantity: -quantity, availableQuantity: -quantity } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** Atomically return stock (cancel/refund/rollback). */
  incrementStock(
    productId: string,
    quantity: number,
  ): Promise<HydratedDocument<IInventory> | null> {
    return this.model
      .findOneAndUpdate(
        { productId } as unknown as InventoryFilter,
        { $inc: { quantity, availableQuantity: quantity } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** Reserve stock for a pending online order (available→reserved) IFF available. */
  reserveIfAvailable(
    productId: string,
    quantity: number,
  ): Promise<HydratedDocument<IInventory> | null> {
    const filter = {
      productId,
      availableQuantity: mongoose.trusted({ $gte: quantity }),
    } as unknown as InventoryFilter;
    return this.model
      .findOneAndUpdate(
        filter,
        { $inc: { reservedQuantity: quantity, availableQuantity: -quantity } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** Convert a reservation into a sale on payment success (quantity & reserved down). */
  commitReserved(
    productId: string,
    quantity: number,
  ): Promise<HydratedDocument<IInventory> | null> {
    return this.model
      .findOneAndUpdate(
        { productId } as unknown as InventoryFilter,
        { $inc: { quantity: -quantity, reservedQuantity: -quantity } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** Release a reservation on failure/cancel (reserved→available). */
  releaseReserved(
    productId: string,
    quantity: number,
  ): Promise<HydratedDocument<IInventory> | null> {
    return this.model
      .findOneAndUpdate(
        { productId } as unknown as InventoryFilter,
        { $inc: { reservedQuantity: -quantity, availableQuantity: quantity } },
        { returnDocument: 'after' },
      )
      .exec();
  }
}

export const inventoryRepository = new InventoryRepository();
