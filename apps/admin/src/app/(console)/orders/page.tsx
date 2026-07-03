'use client';

/**
 * Orders list (Milestone 1.7a) — paginated, filterable by order + payment
 * status. Server-authoritative reads via the admin orders service.
 */
import { useState } from 'react';
import Link from 'next/link';
import type { OrderStatus, PaymentStatus } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { listOrders } from '@/services/orders';
import { formatPrice, formatDate } from '@/lib/format';
import { PageHeader, Pagination, EmptyState } from '@/features/console/ui';
import { OrderStatusBadge, PaymentStatusBadge } from '@/features/console/badges';

const ORDER_STATUSES: OrderStatus[] = [
  'created',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');

  const { data, loading, error } = useAsync(
    () =>
      listOrders({
        page,
        limit: 20,
        status: status === '' ? undefined : status,
        paymentStatus: paymentStatus === '' ? undefined : paymentStatus,
      }),
    [page, status, paymentStatus],
  );

  return (
    <div>
      <PageHeader title="Orders" description="Track and fulfil customer orders." />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            setPage(1);
          }}
          className="h-10 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value as PaymentStatus | '');
            setPage(1);
          }}
          className="h-10 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {loading && data === null && <p className="text-sm text-ink-soft">Loading orders…</p>}

      {data !== null && data.items.length === 0 && (
        <EmptyState message="No orders match this filter." />
      )}

      {data !== null && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="border-b border-line/60 last:border-0 hover:bg-mist/40">
                  <td className="px-5 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-medium text-purple hover:underline"
                    >
                      #{o.orderNumber}
                    </Link>
                    <span className="ml-2 text-xs text-ink-faint">
                      {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3">
                    <PaymentStatusBadge status={o.paymentStatus} />
                    <span className="ml-2 text-xs uppercase text-ink-faint">{o.paymentMethod}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-ink">
                    {formatPrice(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data !== null && (
        <Pagination
          page={data.page}
          pages={data.pages}
          busy={loading}
          onPage={(n) => {
            setPage(n);
          }}
        />
      )}
    </div>
  );
}
