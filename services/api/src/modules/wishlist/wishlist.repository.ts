/**
 * Wishlist repository (Milestone 1.5b).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Wishlist } from './wishlist.model.js';
import type { IWishlist } from './wishlist.types.js';

export class WishlistRepository extends BaseRepository<IWishlist> {
  constructor() {
    super(Wishlist);
  }

  findByUserId(userId: string): Promise<HydratedDocument<IWishlist> | null> {
    return this.findOne({ userId });
  }

  async getOrCreate(userId: string): Promise<HydratedDocument<IWishlist>> {
    const existing = await this.findByUserId(userId);
    if (existing !== null) {
      return existing;
    }
    return this.create({ userId, productIds: [] });
  }
}

export const wishlistRepository = new WishlistRepository();
