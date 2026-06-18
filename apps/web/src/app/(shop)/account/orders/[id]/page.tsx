'use client';

/**
 * Order detail (Milestone 1.4c) — full order view with a post-checkout
 * confirmation banner (?placed=1) and a cancel action gated to the same rules
 * the API enforces (created/processing and unpaid). Cancel re-renders from the
 * returned DTO.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Button, Container } from '@sajawat/ui';
import type { PublicOrder } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { cancelOrder, getOrder } from '@/services/commerce';
import { formatPrice } from '@/lib/format';
import { commerceErrorMessage } from '@/features/commerce/commerce-context';
import { StatusBadge, formatOrderDate, paymentLabel } from '@/features/commerce/order-display';

const CANCELLABLE = new Set(['created', 'processing']);

export default function OrderDetailPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const justPlaced = search.get('placed') === '1';

  const { data, loading, error } = useAsync(() => getOrder(id), [id]);
  // `override` holds the post-cancel DTO so we don't mirror fetched data into
  // state via an effect; the freshest of the two wins.
  const [override, setOverride] = useState<PublicOrder | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const order = override ?? data;

  if (order === null) {
    return (
      <Container className="py-20">
        <p className="text-center text-sm text-ink-soft">
          {loading ? 'Loading order…' : (error ?? 'Order not found.')}
        </p>
      </Container>
    );
  }

  const canCancel = CANCELLABLE.has(order.status) && order.paymentStatus !== 'paid';
  const orderId = order.id;

  function onCancel() {
    setCancelError(null);
    setCancelling(true);
    void cancelOrder(orderId)
      .then((updated) => {
        setOverride(updated);
      })
      .catch((err: unknown) => {
        setCancelError(commerceErrorMessage(err));
      })
      .finally(() => {
        setCancelling(false);
      });
  }

  return (
    <Container className="py-12">
      <nav className="text-xs text-ink-faint">
        <Link href="/account/orders" className="hover:text-purple">
          Orders
        </Link>{' '}
        / #{order.orderNumber}
      </nav>

      {justPlaced && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <strong className="font-semibold">Thank you! Your order is confirmed.</strong> We&apos;ll
          send updates as it&apos;s prepared and shipped.
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-xs text-ink-faint">
            Placed {formatOrderDate(order.createdAt)} ·{' '}
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'} ·{' '}
            {paymentLabel(order.paymentStatus)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section>
          <h2 className="font-serif text-lg font-semibold text-ink">Items</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3 py-4 text-sm">
                <span className="min-w-0 text-ink-soft">
                  {item.name}
                  <span className="text-ink-faint"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium text-ink">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-serif text-lg font-semibold text-ink">Shipping address</h2>
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
            <p className="mt-4 text-sm text-ink-soft">
              <span className="font-medium text-ink">Notes: </span>
              {order.notes}
            </p>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            {order.discount > 0 && (
              <Row
                label={order.appliedPromotion?.label ?? 'Discount'}
                value={`−${formatPrice(order.discount)}`}
                accent
              />
            )}
            <Row
              label="Shipping"
              value={order.shipping > 0 ? formatPrice(order.shipping) : 'Free'}
            />
            {order.tax > 0 && <Row label="Tax" value={formatPrice(order.tax)} />}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>

          {canCancel && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={cancelling}
                className="mt-6 w-full"
              >
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </Button>
              {cancelError !== null && <p className="mt-3 text-sm text-red-600">{cancelError}</p>}
            </>
          )}
        </aside>
      </div>
    </Container>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent === true ? 'text-purple' : 'text-ink-soft'}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
