/**
 * Cart repository (Milestone 1.5b).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Cart } from './cart.model.js';
import type { ICart } from './cart.types.js';

export class CartRepository extends BaseRepository<ICart> {
  constructor() {
    super(Cart);
  }

  findByUserId(userId: string): Promise<HydratedDocument<ICart> | null> {
    return this.findOne({ userId });
  }

  async getOrCreate(userId: string): Promise<HydratedDocument<ICart>> {
    const existing = await this.findByUserId(userId);
    if (existing !== null) {
      return existing;
    }
    return this.create({ userId, items: [] });
  }
}

export const cartRepository = new CartRepository();
