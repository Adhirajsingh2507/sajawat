'use client';

/**
 * Order detail (Milestone 1.7a) — full order with staff actions: advance the
 * lifecycle status and update the payment status. Both are gated by ORDER_WRITE
 * (the API enforces transitions + terminal-state guards; we surface its errors)
 * and re-render from the returned AdminOrder.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { AdminOrder, OrderStatus, PaymentStatus } from '@sajawat/types';
import { PERMISSIONS } from '@sajawat/shared';
import { useAsync } from '@/lib/use-async';
import { getOrder, updateOrderPayment, updateOrderStatus } from '@/services/orders';
import { ApiError } from '@/lib/api';
import { formatPrice, formatDateTime } from '@/lib/format';
import { useCan } from '@/features/console/Can';
import { Card, PageHeader } from '@/features/console/ui';
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

function errMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong';
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const canWrite = useCan(PERMISSIONS.ORDER_WRITE);

  const { data, loading, error } = useAsync(() => getOrder(id), [id]);
  const [override, setOverride] = useState<AdminOrder | null>(null);
  const order = override ?? data;

  if (order === null) {
    return (
      <p className="text-sm text-ink-soft">
        {loading ? 'Loading order…' : (error ?? 'Order not found.')}
      </p>
    );
  }

  return (
    <div>
      <nav className="mb-2 text-xs text-ink-faint">
        <Link href="/orders" className="hover:text-purple">
          Orders
        </Link>{' '}
        / #{order.orderNumber}
      </nav>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)} · ${
          order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'
        }`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg font-semibold text-ink">Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 text-ink-soft">
                    {item.name}
                    <span className="text-ink-faint"> × {item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium text-ink">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-semibold text-ink">Shipping address</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
              {order.address.fullName}
              <br />
              {order.address.line1}
              {order.address.line2 !== undefined && order.address.line2.length > 0 && (
                <>
                  <br />
                  {order.address.line2}
                </>
              )}
              <br />
              {order.address.city}, {order.address.state} {order.address.postalCode}
              <br />
              {order.address.country}
              <br />
              {order.address.phone}
            </address>
            {order.notes !== undefined && order.notes.length > 0 && (
              <p className="mt-3 text-sm text-ink-soft">
                <span className="font-medium text-ink">Notes: </span>
                {order.notes}
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg font-semibold text-ink">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Row label="Discount" value={`−${formatPrice(order.discount)}`} />
              )}
              <Row
                label="Shipping"
                value={order.shipping > 0 ? formatPrice(order.shipping) : 'Free'}
              />
              {order.tax > 0 && <Row label="Tax" value={formatPrice(order.tax)} />}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">Order status</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            {canWrite ? (
              <StatusUpdater
                kind="status"
                current={order.status}
                options={ORDER_STATUSES}
                onApply={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                onDone={setOverride}
              />
            ) : (
              <p className="mt-3 text-xs text-ink-faint">
                You don&apos;t have permission to change this.
              </p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">Payment</h2>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            {canWrite ? (
              <StatusUpdater
                kind="payment"
                current={order.paymentStatus}
                options={PAYMENT_STATUSES}
                onApply={(value) => updateOrderPayment(order.id, value as PaymentStatus)}
                onDone={setOverride}
              />
            ) : (
              <p className="mt-3 text-xs text-ink-faint">
                You don&apos;t have permission to change this.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StatusUpdater({
  kind,
  current,
  options,
  onApply,
  onDone,
}: {
  kind: 'status' | 'payment';
  current: string;
  options: string[];
  onApply: (value: string) => Promise<AdminOrder>;
  onDone: (order: AdminOrder) => void;
}) {
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply() {
    if (value === current) return;
    setBusy(true);
    setError(null);
    void onApply(value)
      .then((updated) => {
        onDone(updated);
      })
      .catch((err: unknown) => {
        setError(errMessage(err));
        setValue(current);
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <select
          aria-label={kind === 'status' ? 'Order status' : 'Payment status'}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          disabled={busy}
          className="h-10 flex-1 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={apply}
          disabled={busy || value === current}
          className="h-10 shrink-0 rounded-lg bg-purple px-4 text-sm font-medium text-white hover:bg-purple-dark disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Update'}
        </button>
      </div>
      {error !== null && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
