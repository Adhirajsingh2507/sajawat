/**
 * Admin promotions service (Milestone 1.7b) — wraps /admin/promotions CRUD
 * (COUPON_WRITE). Discounts are computed server-side; this is configuration
 * only. Returns AdminPromotion DTOs.
 */
import { apiFetch } from '@/lib/api';
import type {
  AdminPromotion,
  Paginated,
  PromotionStatus,
  PromotionTrigger,
  RewardType,
} from '@sajawat/types';

export interface PromotionWriteInput {
  name: string;
  trigger: PromotionTrigger;
  code?: string;
  rewardType: RewardType;
  value: number;
  minCartValue?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  status?: PromotionStatus;
}

export interface PromotionListQuery {
  page?: number | undefined;
  limit?: number | undefined;
  trigger?: PromotionTrigger | undefined;
  status?: PromotionStatus | undefined;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const out = sp.toString();
  return out.length > 0 ? `?${out}` : '';
}

export function listPromotions(query: PromotionListQuery = {}): Promise<Paginated<AdminPromotion>> {
  return apiFetch<Paginated<AdminPromotion>>(`/admin/promotions${qs({ ...query })}`);
}

export function createPromotion(input: PromotionWriteInput): Promise<AdminPromotion> {
  return apiFetch<AdminPromotion>('/admin/promotions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePromotion(
  id: string,
  input: Partial<PromotionWriteInput>,
): Promise<AdminPromotion> {
  return apiFetch<AdminPromotion>(`/admin/promotions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deletePromotion(id: string): Promise<void> {
  return apiFetch<void>(`/admin/promotions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
