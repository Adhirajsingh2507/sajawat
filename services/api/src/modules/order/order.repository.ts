/**
 * Order repository (Milestone 1.6).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Order } from './order.model.js';
import type { IOrder } from './order.types.js';

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order);
  }

  findForUser(id: string, userId: string): Promise<HydratedDocument<IOrder> | null> {
    return this.findOne({ _id: id, userId });
  }

  existsByOrderNumber(orderNumber: string): Promise<boolean> {
    return this.exists({ orderNumber });
  }

  /** How many orders have redeemed a promotion (optionally scoped to one user). */
  countByPromotion(promotionId: string, userId?: string): Promise<number> {
    const filter: Record<string, unknown> = { 'appliedPromotion.promotionId': promotionId };
    if (userId !== undefined) filter.userId = userId;
    return this.count(filter);
  }
}

export const orderRepository = new OrderRepository();
