/**
 * Payment repository (Milestone 1.6b).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Payment } from './payment.model.js';
import type { IPayment } from './payment.types.js';

export class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(Payment);
  }

  findByProviderOrderId(providerOrderId: string): Promise<HydratedDocument<IPayment> | null> {
    return this.findOne({ providerOrderId });
  }
}

export const paymentRepository = new PaymentRepository();
