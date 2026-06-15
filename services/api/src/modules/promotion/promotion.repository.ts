/**
 * Promotion repository (Milestone 1.5a).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Promotion } from './promotion.model.js';
import type { IPromotion } from './promotion.types.js';

/** Normalize a coupon code for storage/lookup (case-insensitive). */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export class PromotionRepository extends BaseRepository<IPromotion> {
  constructor() {
    super(Promotion);
  }

  findByCode(code: string): Promise<HydratedDocument<IPromotion> | null> {
    return this.findOne({ trigger: 'coupon', code: normalizeCode(code) });
  }

  existsByCode(code: string): Promise<boolean> {
    return this.exists({ code: normalizeCode(code) }, { includeDeleted: true });
  }

  /** Active automatic promotions (candidates for auto-application). */
  findActiveAutomatic(): Promise<HydratedDocument<IPromotion>[]> {
    return this.find({ trigger: 'automatic', status: 'active' });
  }
}

export const promotionRepository = new PromotionRepository();
