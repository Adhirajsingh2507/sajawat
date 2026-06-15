/**
 * Order repository (Milestone 1.6).
 */
import type { HydratedDocument, Model } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Order } from './order.model.js';
import type { IOrder } from './order.types.js';

type OrderFilter = NonNullable<Parameters<Model<IOrder>['findOneAndUpdate']>[0]>;

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order);
  }

  /** Atomic pending→paid transition (idempotency key for verify + webhook). */
  markPaidIfPending(id: string): Promise<HydratedDocument<IOrder> | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, paymentStatus: 'pending' } as unknown as OrderFilter,
        { $set: { paymentStatus: 'paid', status: 'processing' } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** Atomic pending→failed transition. */
  markFailedIfPending(id: string): Promise<HydratedDocument<IOrder> | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, paymentStatus: 'pending' } as unknown as OrderFilter,
        { $set: { paymentStatus: 'failed' } },
        { returnDocument: 'after' },
      )
      .exec();
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
