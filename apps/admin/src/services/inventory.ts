/**
 * Admin inventory service (Milestone 1.7a) — wraps /admin/inventory (read +
 * adjust + movement history). The `order` movement type is system-only and not
 * adjustable here.
 */
import { apiFetch } from '@/lib/api';
import type {
  AdminInventory,
  AdminInventoryMovement,
  AdminMovementType,
  InventoryStatus,
  Paginated,
} from '@sajawat/types';

export interface InventoryListQuery {
  page?: number | undefined;
  limit?: number | undefined;
  status?: InventoryStatus | undefined;
}

export interface AdjustInput {
  type: AdminMovementType;
  quantity: number;
  reason?: string;
  lowStockThreshold?: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const out = sp.toString();
  return out.length > 0 ? `?${out}` : '';
}

export function listInventory(query: InventoryListQuery = {}): Promise<Paginated<AdminInventory>> {
  return apiFetch<Paginated<AdminInventory>>(`/admin/inventory${qs({ ...query })}`);
}

export function getHistory(
  query: {
    page?: number | undefined;
    limit?: number | undefined;
    productId?: string | undefined;
  } = {},
): Promise<Paginated<AdminInventoryMovement>> {
  return apiFetch<Paginated<AdminInventoryMovement>>(`/admin/inventory/history${qs({ ...query })}`);
}

export function adjustInventory(productId: string, input: AdjustInput): Promise<AdminInventory> {
  return apiFetch<AdminInventory>(`/admin/inventory/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
