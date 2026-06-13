/**
 * Product repository (Milestone 1.3b).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import type { ReadOptions } from '../../db/base-repository.js';
import { Product } from './product.model.js';
import type { IProduct } from './product.types.js';

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }

  findBySlug(slug: string, opts: ReadOptions = {}): Promise<HydratedDocument<IProduct> | null> {
    return this.findOne({ slug }, opts);
  }

  /** Uniqueness checks span ALL rows (the unique indexes include soft-deleted). */
  existsBySlug(slug: string): Promise<boolean> {
    return this.exists({ slug }, { includeDeleted: true });
  }

  existsBySku(sku: string): Promise<boolean> {
    return this.exists({ sku }, { includeDeleted: true });
  }
}

export const productRepository = new ProductRepository();
