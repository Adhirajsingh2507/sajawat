/**
 * Promotion service (Milestone 1.5a) — admin CRUD + the server-side discount
 * calculator used by the cart. Rule (locked): a valid entered coupon wins;
 * otherwise the best-value active automatic promotion applies (no stacking).
 * Usage-limit enforcement happens at order placement (1.6).
 */
import type { HydratedDocument } from 'mongoose';
import type { Paginated, PublicOffer } from '@sajawat/types';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/app-error.js';
import type { PaginatedResult } from '../../db/base-repository.js';
import { normalizeCode, promotionRepository } from './promotion.repository.js';
import type { AdminPromotion, IPromotion } from './promotion.types.js';
import type {
  CreatePromotionBody,
  PromotionListQuery,
  UpdatePromotionBody,
} from './promotion.validation.js';

type PromotionDoc = HydratedDocument<IPromotion>;

export interface ResolvedDiscount {
  promotionId: string;
  label: string;
  code: string | null;
  amount: number;
}

type EligibilityFields = Pick<IPromotion, 'status' | 'minCartValue' | 'startDate' | 'endDate'>;
type RewardFields = Pick<IPromotion, 'rewardType' | 'value' | 'maxDiscount'>;

export function isEligible(
  promo: EligibilityFields,
  subtotal: number,
  now: Date = new Date(),
): boolean {
  if (promo.status !== 'active') return false;
  if (promo.startDate != null && now < promo.startDate) return false;
  if (promo.endDate != null && now > promo.endDate) return false;
  return subtotal >= promo.minCartValue;
}

export function computeDiscount(promo: RewardFields, subtotal: number): number {
  let amount = promo.rewardType === 'percentage' ? (subtotal * promo.value) / 100 : promo.value;
  if (promo.maxDiscount != null) amount = Math.min(amount, promo.maxDiscount);
  amount = Math.min(amount, subtotal);
  return Math.max(0, Math.round(amount));
}

/** Resolve the single applicable discount for a cart subtotal. */
async function resolveCartDiscount(
  subtotal: number,
  couponCode?: string | null,
): Promise<ResolvedDiscount | null> {
  const now = new Date();

  if (couponCode != null && couponCode.length > 0) {
    const coupon = await promotionRepository.findByCode(couponCode);
    if (coupon !== null && isEligible(coupon, subtotal, now)) {
      const amount = computeDiscount(coupon, subtotal);
      if (amount > 0) {
        return {
          promotionId: String(coupon._id),
          label: coupon.name,
          code: coupon.code ?? null,
          amount,
        };
      }
    }
    // Entered coupon is invalid/ineligible → fall back to the best automatic rule.
  }

  let best: ResolvedDiscount | null = null;
  for (const promo of await promotionRepository.findActiveAutomatic()) {
    if (!isEligible(promo, subtotal, now)) continue;
    const amount = computeDiscount(promo, subtotal);
    if (amount > 0 && (best === null || amount > best.amount)) {
      best = { promotionId: String(promo._id), label: promo.name, code: null, amount };
    }
  }
  return best;
}

/** Validate a coupon against a subtotal (used by POST /cart/apply-coupon). Throws. */
async function assertCouponApplies(code: string, subtotal: number): Promise<void> {
  const coupon = await promotionRepository.findByCode(code);
  if (coupon === null) {
    throw new BadRequestError('Invalid coupon code');
  }
  if (!isEligible(coupon, subtotal)) {
    throw new BadRequestError('This coupon cannot be applied to your cart');
  }
}

function toAdmin(doc: PromotionDoc): AdminPromotion {
  return {
    id: String(doc._id),
    name: doc.name,
    trigger: doc.trigger,
    code: doc.code,
    rewardType: doc.rewardType,
    value: doc.value,
    minCartValue: doc.minCartValue,
    maxDiscount: doc.maxDiscount,
    startDate: doc.startDate,
    endDate: doc.endDate,
    usageLimit: doc.usageLimit,
    perCustomerLimit: doc.perCustomerLimit,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function assertRewardValue(rewardType: string, value: number): void {
  if (rewardType === 'percentage' && (value <= 0 || value > 100)) {
    throw new BadRequestError('Percentage value must be between 1 and 100');
  }
}

async function create(input: CreatePromotionBody): Promise<AdminPromotion> {
  assertRewardValue(input.rewardType, input.value);
  let code: string | undefined;
  if (input.trigger === 'coupon') {
    if (input.code === undefined) {
      throw new BadRequestError('A coupon promotion requires a code');
    }
    code = normalizeCode(input.code);
    if (await promotionRepository.existsByCode(code)) {
      throw new ConflictError('Coupon code already in use');
    }
  }
  const doc = await promotionRepository.create({
    name: input.name,
    trigger: input.trigger,
    ...(code !== undefined ? { code } : {}),
    rewardType: input.rewardType,
    value: input.value,
    minCartValue: input.minCartValue ?? 0,
    maxDiscount: input.maxDiscount ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    usageLimit: input.usageLimit ?? null,
    perCustomerLimit: input.perCustomerLimit ?? null,
    status: input.status ?? 'active',
  });
  return toAdmin(doc);
}

async function update(id: string, input: UpdatePromotionBody): Promise<AdminPromotion> {
  const existing = await promotionRepository.findById(id);
  if (existing === null) {
    throw new NotFoundError('Promotion not found');
  }
  const rewardType = input.rewardType ?? existing.rewardType;
  const value = input.value ?? existing.value;
  assertRewardValue(rewardType, value);

  const patch: Partial<IPromotion> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.rewardType !== undefined) patch.rewardType = input.rewardType;
  if (input.value !== undefined) patch.value = input.value;
  if (input.minCartValue !== undefined) patch.minCartValue = input.minCartValue;
  if (input.maxDiscount !== undefined) patch.maxDiscount = input.maxDiscount;
  if (input.startDate !== undefined) patch.startDate = input.startDate;
  if (input.endDate !== undefined) patch.endDate = input.endDate;
  if (input.usageLimit !== undefined) patch.usageLimit = input.usageLimit;
  if (input.perCustomerLimit !== undefined) patch.perCustomerLimit = input.perCustomerLimit;
  if (input.status !== undefined) patch.status = input.status;
  if (input.code !== undefined && existing.trigger === 'coupon') {
    const code = normalizeCode(input.code);
    const clash = await promotionRepository.findByCode(code);
    if (clash !== null && String(clash._id) !== id) {
      throw new ConflictError('Coupon code already in use');
    }
    patch.code = code;
  }
  const updated = await promotionRepository.updateById(id, { $set: patch });
  if (updated === null) {
    throw new NotFoundError('Promotion not found');
  }
  return toAdmin(updated);
}

async function listAdmin(query: PromotionListQuery): Promise<Paginated<AdminPromotion>> {
  const filter: Record<string, unknown> = {};
  if (query.trigger !== undefined) filter.trigger = query.trigger;
  if (query.status !== undefined) filter.status = query.status;
  const res: PaginatedResult<PromotionDoc> = await promotionRepository.paginate(filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
  });
  return {
    items: res.items.map(toAdmin),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

/** Public, advertisable projection of an active promotion (no usage limits). */
function toPublicOffer(doc: PromotionDoc): PublicOffer {
  return {
    id: String(doc._id),
    name: doc.name,
    trigger: doc.trigger,
    code: doc.code,
    rewardType: doc.rewardType,
    value: doc.value,
    minCartValue: doc.minCartValue,
    maxDiscount: doc.maxDiscount,
    endDate: doc.endDate == null ? null : doc.endDate.toISOString(),
  };
}

/** Active offers currently within their date window (for storefront display). */
async function listActivePublic(): Promise<PublicOffer[]> {
  const now = new Date();
  const docs = await promotionRepository.findActive();
  return docs
    .filter(
      (d) => (d.startDate == null || now >= d.startDate) && (d.endDate == null || now <= d.endDate),
    )
    .map(toPublicOffer);
}

async function getByIdAdmin(id: string): Promise<AdminPromotion> {
  const doc = await promotionRepository.findById(id);
  if (doc === null) {
    throw new NotFoundError('Promotion not found');
  }
  return toAdmin(doc);
}

async function remove(id: string): Promise<void> {
  const deleted = await promotionRepository.softDeleteById(id);
  if (deleted === null) {
    throw new NotFoundError('Promotion not found');
  }
}

export const promotionService = {
  resolveCartDiscount,
  assertCouponApplies,
  create,
  update,
  listAdmin,
  getByIdAdmin,
  remove,
  listActivePublic,
};
