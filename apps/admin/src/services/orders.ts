/**
 * Admin orders service (Milestone 1.7a) — wraps /admin/orders. Components never
 * call apiFetch directly. Every mutation returns the server's AdminOrder DTO.
 */
import { apiFetch } from '@/lib/api';
import type { AdminOrder, OrderStatus, Paginated, PaymentStatus } from '@sajawat/types';

export interface OrderListQuery {
  page?: number | undefined;
  limit?: number | undefined;
  status?: OrderStatus | undefined;
  paymentStatus?: PaymentStatus | undefined;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const out = sp.toString();
  return out.length > 0 ? `?${out}` : '';
}

export function listOrders(query: OrderListQuery = {}): Promise<Paginated<AdminOrder>> {
  return apiFetch<Paginated<AdminOrder>>(`/admin/orders${qs({ ...query })}`);
}

export function getOrder(id: string): Promise<AdminOrder> {
  return apiFetch<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}`);
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  return apiFetch<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateOrderPayment(id: string, paymentStatus: PaymentStatus): Promise<AdminOrder> {
  return apiFetch<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus }),
  });
}
