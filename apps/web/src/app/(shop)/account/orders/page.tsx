'use client';

/**
 * Order history (Milestone 1.4c) — paginated list of the signed-in customer's
 * orders. Reads are server-authoritative; pagination uses the API's page meta.
 */
import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@sajawat/ui';
import { useAsync } from '@/lib/use-async';
import { getOrders } from '@/services/commerce';
import { formatPrice } from '@/lib/format';
import { StatusBadge, formatOrderDate, paymentLabel } from '@/features/commerce/order-display';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsync(() => getOrders({ page, limit: 10 }), [page]);

  return (
    <Container className="py-12">
      <nav className="text-xs text-ink-faint">
        <Link href="/account" className="hover:text-purple">
          Account
        </Link>{' '}
        / Orders
      </nav>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Your orders</h1>

      {loading && data === null && (
        <p className="mt-8 text-sm text-ink-soft">Loading your orders…</p>
      )}
      {error !== null && <p className="mt-8 text-sm text-red-600">{error}</p>}

      {data !== null && data.items.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-sm text-ink-soft">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/products"
            className="mt-5 inline-flex h-11 items-center rounded-full bg-purple px-6 text-sm font-medium text-white hover:bg-purple-dark"
          >
            Start shopping
          </Link>
        </div>
      )}

      {data !== null && data.items.length > 0 && (
        <>
          <ul className="mt-8 space-y-4">
            {data.items.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-purple"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink">#{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-faint">
                      {formatOrderDate(order.createdAt)} · {order.items.length}{' '}
                      {order.items.length === 1 ? 'item' : 'items'} ·{' '}
                      {paymentLabel(order.paymentStatus)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{formatPrice(order.total)}</span>
                </Link>
              </li>
            ))}
          </ul>

          {data.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page <= 1 || loading}
                className="h-9 rounded-full border border-line px-4 text-sm text-ink-soft hover:border-purple disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-ink-soft">
                Page {data.page} of {data.pages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPage((p) => Math.min(data.pages, p + 1));
                }}
                disabled={page >= data.pages || loading}
                className="h-9 rounded-full border border-line px-4 text-sm text-ink-soft hover:border-purple disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
