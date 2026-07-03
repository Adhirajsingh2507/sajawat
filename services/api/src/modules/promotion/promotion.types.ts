/**
 * Promotion types (Milestone 1.5a) — admin-configurable discount engine for
 * Model A. `trigger='automatic'` rules apply when the cart subtotal meets
 * `minCartValue`; `trigger='coupon'` rules require a matching `code`. Discounts
 * are always computed server-side. Supersedes the code-only `coupons` design.
 */
export type PromotionTrigger = 'automatic' | 'coupon';
export type RewardType = 'percentage' | 'fixed';
export type PromotionStatus = 'active' | 'inactive';

export interface IPromotion {
  name: string;
  trigger: PromotionTrigger;
  /** Coupon code (normalized uppercase). Absent for automatic promotions. */
  code?: string | undefined;
  rewardType: RewardType;
  value: number;
  minCartValue: number;
  /** Cap for percentage rewards; null = uncapped (still bounded by subtotal). */
  maxDiscount?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  status: PromotionStatus;
  deletedAt?: Date | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AdminPromotion {
  id: string;
  name: string;
  trigger: PromotionTrigger;
  code?: string | undefined;
  rewardType: RewardType;
  value: number;
  minCartValue: number;
  maxDiscount?: number | null | undefined;
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  usageLimit?: number | null | undefined;
  perCustomerLimit?: number | null | undefined;
  status: PromotionStatus;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
